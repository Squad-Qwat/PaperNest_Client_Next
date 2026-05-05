// src/extensions/codemirror/mathlive/MathDetector.ts
import type { EditorView } from '@codemirror/view'

import { type FileType, getPatternsForFileType } from './patterns'

export interface MathRegion {
	from: number
	to: number
	type: 'inline' | 'display'
	content: string
	rawContent: string
	leadingWS: string
	trailingWS: string
	contentStart: number
	contentEnd: number
	fileType: FileType
	delimiterStart: string
	delimiterEnd: string
	replaceFrom: number
	replaceTo: number
	previewLatex: string
}

export class MathDetector {
	private currentFileType: FileType = 'latex'

	setFileType(fileType: FileType): void {
		this.currentFileType = fileType
	}

	detectMathAtPosition(view: EditorView, pos: number): MathRegion | null {
		const doc = view.state.doc.toString()
		const patterns = getPatternsForFileType(this.currentFileType)

		for (const patternConfig of patterns) {
			const { pattern, type, fileType, getDelimiters } = patternConfig
			let match = pattern.exec(doc)
			while (match !== null) {
				const matchStart = match.index
				const matchEnd = matchStart + match[0].length

				if (pos >= matchStart && pos <= matchEnd) {
					const fullMatch = match[0]
					const delims = getDelimiters(fullMatch)

					const contentStart = matchStart + delims.start.length
					const contentEnd = matchEnd - delims.end.length

					const rawContent = doc.substring(contentStart, contentEnd)

					if (this.isSplittableEnv(type, fileType, delims.start, delims.end)) {
						const rowRegion = this.findRowRegion(
							doc,
							rawContent,
							matchStart,
							matchEnd,
							contentStart,
							contentEnd,
							type,
							fileType,
							delims.start,
							delims.end,
							pos
						)
						if (rowRegion) return rowRegion
					}

					return this.buildWholeRegion(
						doc,
						rawContent,
						matchStart,
						matchEnd,
						contentStart,
						contentEnd,
						type,
						fileType,
						delims.start,
						delims.end
					)
				}
				match = pattern.exec(doc)
			}
		}

		return null
	}

	findAllMathRegions(doc: string, fileType: FileType): MathRegion[] {
		const regions: MathRegion[] = []
		const patterns = getPatternsForFileType(fileType)

		for (const patternConfig of patterns) {
			const { pattern, type, getDelimiters } = patternConfig
			pattern.lastIndex = 0
			let match = pattern.exec(doc)

			while (match !== null) {
				const matchStart = match.index
				const matchEnd = matchStart + match[0].length
				const fullMatch = match[0]
				const delims = getDelimiters(fullMatch)

				const contentStart = matchStart + delims.start.length
				const contentEnd = matchEnd - delims.end.length

				const rawContent = doc.substring(contentStart, contentEnd)

				const whole = this.buildWholeRegion(
					doc,
					rawContent,
					matchStart,
					matchEnd,
					contentStart,
					contentEnd,
					type,
					fileType,
					delims.start,
					delims.end
				)
				regions.push(whole)
				match = pattern.exec(doc)
			}
		}

		return regions.sort((a, b) => a.from - b.from)
	}

	private isSplittableEnv(
		type: 'inline' | 'display',
		fileType: FileType,
		delimiterStart: string,
		delimiterEnd: string
	): boolean {
		return (
			fileType === 'latex' &&
			type === 'display' &&
			delimiterStart.startsWith('\\begin{') &&
			delimiterEnd.startsWith('\\end{') &&
			(delimiterStart.includes('{align') ||
				delimiterStart.includes('{gather') ||
				delimiterStart.includes('{aligned') ||
				delimiterStart.includes('{cases') ||
				delimiterStart.includes('{array') ||
				delimiterStart.includes('{matrix') ||
				delimiterStart.includes('{pmatrix') ||
				delimiterStart.includes('{bmatrix') ||
				delimiterStart.includes('{Bmatrix') ||
				delimiterStart.includes('{vmatrix') ||
				delimiterStart.includes('{Vmatrix'))
		)
	}

	private getWhitespace(raw: string): { leadingWS: string; trailingWS: string } {
		const leadingWS = raw.match(/^\s*/)?.[0] ?? ''
		const trailingWS = raw.match(/\s*$/)?.[0] ?? ''
		return { leadingWS, trailingWS }
	}

	private buildWholeRegion(
		_doc: string,
		rawContent: string,
		matchStart: number,
		matchEnd: number,
		contentStart: number,
		contentEnd: number,
		type: 'inline' | 'display',
		fileType: FileType,
		delimiterStart: string,
		delimiterEnd: string
	): MathRegion {
		const { leadingWS, trailingWS } = this.getWhitespace(rawContent)

		const content = rawContent.slice(leadingWS.length, rawContent.length - trailingWS.length)

		return {
			from: matchStart,
			to: matchEnd,
			type,
			content,
			rawContent,
			leadingWS,
			trailingWS,
			contentStart,
			contentEnd,
			fileType,
			delimiterStart,
			delimiterEnd,
			replaceFrom: matchStart,
			replaceTo: matchEnd,
			previewLatex: content,
		}
	}

	private getRowSeparators(rawContent: string): { from: number; to: number }[] {
		const rowSep = /\\\\(\[[^\]]*\])?/g
		const seps: { from: number; to: number }[] = []
		rowSep.lastIndex = 0

		let m = rowSep.exec(rawContent)
		while (m !== null) {
			seps.push({ from: m.index, to: m.index + m[0].length })
			m = rowSep.exec(rawContent)
		}

		return seps
	}

	private findRowRegion(
		_doc: string,
		rawContent: string,
		matchStart: number,
		matchEnd: number,
		contentStart: number,
		contentEnd: number,
		type: 'inline' | 'display',
		fileType: FileType,
		delimiterStart: string,
		delimiterEnd: string,
		pos: number
	): MathRegion | null {
		const seps = this.getRowSeparators(rawContent)
		if (seps.length === 0) return null

		const relPos = pos - contentStart

		let rowStart = 0
		for (let i = 0; i <= seps.length; i++) {
			const rowEnd = i < seps.length ? seps[i].from : rawContent.length

			if (relPos >= rowStart && relPos <= rowEnd) {
				const rowRaw = rawContent.slice(rowStart, rowEnd)

				const { leadingWS, trailingWS } = this.getWhitespace(rowRaw)
				const rowContent = rowRaw.slice(leadingWS.length, rowRaw.length - trailingWS.length)

				const replaceFrom = contentStart + rowStart
				const replaceTo = contentStart + rowEnd

				const previewLatex = `\\begin{aligned}${leadingWS}${rowContent}${trailingWS}\\end{aligned}`

				return {
					from: matchStart,
					to: matchEnd,
					type,
					content: rowContent,
					rawContent: rowRaw,
					leadingWS,
					trailingWS,
					contentStart,
					contentEnd,
					fileType,
					delimiterStart,
					delimiterEnd,
					replaceFrom,
					replaceTo,
					previewLatex,
				}
			}

			rowStart = i < seps.length ? seps[i].to : rawContent.length
		}

		return null
	}
}
