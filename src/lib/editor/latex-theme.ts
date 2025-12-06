import { EditorView } from "@codemirror/view"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"

/**
 * PaperNest Editor Theme
 * A professional, minimalist theme consistent with the project's Tailwind v4 palette.
 * Uses CSS variables to automatically support Dark/Light modes.
 */
export const paperNestTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    outline: "none !important"
  },
  ".cm-content": {
    caretColor: "var(--primary)",
    fontFamily: "var(--font-mono, 'JetBrains Mono', 'Fira Code', monospace)",
    fontSize: "13px",
    lineHeight: "1.6",
    padding: "16px 0"
  },
  ".cm-scroller": {
    overflow: "auto"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--primary)"
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--primary-subtle, rgba(59, 130, 246, 0.2)) !important"
  },
  ".cm-gutters": {
    backgroundColor: "var(--muted, #fafbfc)",
    color: "var(--muted-foreground, #9ca3af)",
    borderRight: "1px solid var(--border)",
    fontSize: "12px",
    minWidth: "3.5em"
  },
  ".cm-activeLine": {
    backgroundColor: "var(--primary-subtle, rgba(59, 130, 246, 0.05))"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--primary)",
    fontWeight: "bold"
  },
  ".cm-line": {
    paddingLeft: "4px"
  },
  // Yjs Collaboration Styles
  ".cm-ySelection": {
    borderRadius: "2px",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.45)"
  },
  ".cm-yLineSelection": {
    boxShadow: "none"
  },
  ".cm-ySelectionCaret": {
    borderLeftWidth: "2px !important",
    borderRight: "0 !important",
    marginLeft: "-1px",
    marginRight: "0"
  },
  ".cm-ySelectionCaretDot": {
    width: "0.5rem !important",
    height: "0.5rem !important",
    top: "-0.26rem !important",
    left: "-0.26rem !important",
    boxShadow: "0 0 0 2px #ffffff"
  },
  ".cm-ySelectionInfo": {
    top: "-1.45em !important",
    left: "2px !important",
    fontSize: "10px !important",
    fontFamily: "ui-sans-serif, system-ui, sans-serif !important",
    fontWeight: "600 !important",
    letterSpacing: "0.01em",
    borderRadius: "9999px",
    padding: "2px 8px !important",
    opacity: "0.95 !important",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)"
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--muted-foreground)"
  },
  ".cm-tooltip": {
    border: "none",
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    borderRadius: "var(--radius-md)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)"
  }
}, { dark: false }) // The presence of CSS variables makes this essentially theme-agnostic

/**
 * PaperNest Highlight Style
 * Optimized for LaTeX documents with a clear, readable syntax.
 */
export const paperNestHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "var(--primary)", fontWeight: "600" },
  { tag: t.atom, color: "oklch(0.65 0.15 20)" }, // Consistent with Red/Danger
  { tag: t.number, color: "oklch(0.7 0.1 140)" }, // Greenish
  { tag: t.string, color: "oklch(0.6 0.12 160)" }, // Success-like
  { tag: t.comment, color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: t.meta, color: "var(--primary)", fontWeight: "500" }, // Commands like \begin, \section
  { tag: t.heading, color: "var(--primary)", fontWeight: "bold", fontSize: "1.1em" },
  { tag: t.labelName, color: "var(--primary-subtle-foreground)" },
  { tag: t.operator, color: "var(--muted-foreground)" },
  { tag: t.bracket, color: "var(--muted-foreground)" },
  { tag: t.tagName, color: "var(--primary)" },
  { tag: [t.function(t.variableName), t.propertyName], color: "var(--primary)" },
  { tag: t.processingInstruction, color: "oklch(0.7 0.15 50)" }, // Math modes
])

export const paperNestThemeExtension = [
  paperNestTheme,
  syntaxHighlighting(paperNestHighlightStyle)
]
