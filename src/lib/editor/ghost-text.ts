import { StateEffect, StateField, type Transaction } from '@codemirror/state'
import {
	Decoration,
	type EditorView,
	keymap,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from '@codemirror/view'
import { apiClient } from '@/lib/api/clients/api-client'

// --- Helper: Remove suffix overlap from AI completion ---
// Prevents double characters (e.g. `}}`) when model returns closing text
// that already exists right after the cursor position.
function trimSuffixOverlap(completion: string, suffix: string): string {
	const cleanSuffix = suffix.trimStart()
	if (!cleanSuffix) return completion

	let overlapLength = 0
	const maxSearch = Math.min(completion.length, cleanSuffix.length)
	for (let i = 1; i <= maxSearch; i++) {
		if (cleanSuffix.startsWith(completion.slice(0, i))) {
			overlapLength = i
		} else {
			break
		}
	}

	return overlapLength > 0 ? completion.slice(overlapLength) : completion
}

// --- State Field to hold current suggestion ---
export interface GhostSuggestion {
	text: string
	pos: number
}

export const setGhostText = StateEffect.define<GhostSuggestion | null>()

export const ghostTextState = StateField.define<GhostSuggestion | null>({
	create() {
		return null
	},
	update(value, tr: Transaction) {
		// If user types, delete, or cursor moves, clear suggestion
		if (tr.docChanged || tr.selection) {
			return null
		}

		for (const effect of tr.effects) {
			if (effect.is(setGhostText)) {
				return effect.value
			}
		}
		return value
	},
})

// --- Widget to render ghost text ---
class GhostTextWidget extends WidgetType {
	constructor(readonly text: string) {
		super()
	}

	eq(other: GhostTextWidget) {
		return other.text === this.text
	}

	toDOM() {
		const span = document.createElement('span')
		span.className = 'cm-ghostText'
		span.textContent = this.text
		// Add default styling. It's often better to do this via a base theme,
		// but inline styles are robust for a single widget type.
		span.style.opacity = '0.5'
		span.style.color = '#888'
		span.style.fontStyle = 'italic'
		span.style.pointerEvents = 'none'
		return span
	}
}

// --- High-level View Plugin to handle API debouncing ---
export const ghostTextPlugin = ViewPlugin.fromClass(
	class {
		private timeout: NodeJS.Timeout | null = null
		private abortController: AbortController | null = null

		constructor(public view: EditorView) {}

		update(update: ViewUpdate) {
			// Only trigger if doc changed AND it was an explicit user input
			const isUserInput = update.transactions.some(
				(tr) => tr.isUserEvent('input') || tr.isUserEvent('delete')
			)

			// If the user moved cursor without typing, or typed, we should clear any existing request
			if (update.docChanged || update.selectionSet) {
				this.cancelPending()
			}

			if (update.docChanged && isUserInput) {
				// Don't trigger if the editor is read-only
				if (update.view.state.readOnly) return

				this.timeout = setTimeout(() => {
					this.fetchSuggestion(update.view)
				}, 400) // 400ms debounce
			}
		}

		async fetchSuggestion(view: EditorView) {
			try {
				this.abortController = new AbortController()

				const pos = view.state.selection.main.head
				const doc = view.state.doc.toString()

				const prefix = doc.slice(Math.max(0, pos - 1000), pos)
				const suffix = doc.slice(pos, Math.min(doc.length, pos + 1000))

				const res = await apiClient.request<{ completion: string }>('/ai/autocomplete', {
					method: 'POST',
					body: JSON.stringify({ prefix, suffix }),
					signal: this.abortController.signal,
				})

				const rawCompletion = res.completion?.trim()
				if (rawCompletion) {
					const cleanCompletion = trimSuffixOverlap(rawCompletion, suffix)
					if (cleanCompletion) {
						view.dispatch({
							effects: setGhostText.of({ text: cleanCompletion, pos }),
						})
					}
				}
			} catch (error: any) {
				if (error.name !== 'AbortError') {
					console.error('[GhostText] Failed to fetch suggestion:', error)
				}
			}
		}

		cancelPending() {
			if (this.timeout) {
				clearTimeout(this.timeout)
				this.timeout = null
			}
			if (this.abortController) {
				this.abortController.abort()
				this.abortController = null
			}
		}

		destroy() {
			this.cancelPending()
		}
	},
	{
		decorations: (v) => {
			const suggestion = v.view.state.field(ghostTextState, false)
			if (!suggestion) return Decoration.none

			// Ensure the position is still valid (e.g., doc didn't shrink somehow)
			if (suggestion.pos > v.view.state.doc.length) return Decoration.none

			return Decoration.set([
				Decoration.widget({
					widget: new GhostTextWidget(suggestion.text),
					side: 1, // Draw after the cursor
				}).range(suggestion.pos),
			])
		},
	}
)

// --- Keymap to accept the suggestion ---
export const acceptGhostText = (view: EditorView): boolean => {
	const suggestion = view.state.field(ghostTextState, false)
	if (suggestion?.text) {
		view.dispatch({
			changes: { from: suggestion.pos, insert: suggestion.text },
			selection: { anchor: suggestion.pos + suggestion.text.length },
			effects: setGhostText.of(null),
			userEvent: 'input.autocomplete', // Mark as input so Yjs syncs it normally
		})
		return true // Handled
	}
	return false // Pass to next keymap (e.g., standard Tab behavior)
}

export const ghostTextKeymap = keymap.of([
	{
		key: 'Tab',
		run: acceptGhostText,
	},
])

// --- Helper export for the full extension ---
export function ghostTextExtension() {
	return [ghostTextState, ghostTextPlugin, ghostTextKeymap]
}
