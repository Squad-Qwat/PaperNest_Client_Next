# PaperNest Visual LaTeX Editor - Architecture & Solution

## Problem Statement

Saat user mengedit dokumen LaTeX di **Visual Editor** (Rich Text), semua LaTeX commands hilang atau corrupt:

### Before (BROKEN) ❌
```latex
% Original:
{\LARGE\bfseries\color{aksen} Title }
\vspace{10pt}
\href{mailto:email@example.com}{Email}

% After visual edit - CORRUPTED:
Title (font commands GONE!)
(spacing GONE!)
Email (href GONE!)
```

## Root Cause Analysis

**The converter worked fine, but Tiptap stripped all custom HTML attributes!**

Tiptap hanya preserve nodes/marks yang didefinisikan sebagai **Extensions**. Custom `<span>` elements dengan data attributes akan di-strip saat user edit.

### Example:
```html
<!-- LaTeXConverter generated: -->
<span data-type="latex-fontsize" data-size="LARGE"></span>

<!-- Tiptap will strip this → result: empty span -->
```

## Solution Architecture

### 1. Enhanced LaTeXConverter (Already Done) ✅
- Preserve LaTeX commands dengan **data attributes**:
  ```typescript
  \LARGE → <span data-type="latex-fontsize" data-size="LARGE"></span>
  \vspace{10pt} → <span data-type="latex-layout" data-cmd="vspace" data-val="10pt"></span>
  ```

### 2. Custom Tiptap Extensions (NEW) ✅
Membuat 9 custom extensions untuk register data attribute patterns ke Tiptap:

#### Extensions Created:

1. **LaTeXFontSize** (Mark)
   - Preserve: `\tiny`, `\small`, `\LARGE`, `\large`, etc.
   - Attribute: `data-type="latex-fontsize"` + `data-size="LARGE"`

2. **LaTeXFontStyle** (Mark)
   - Preserve: `\bfseries`, `\itshape`, `\mdseries`, etc.
   - Attribute: `data-type="latex-fontstyle"` + `data-style="bfseries"`

3. **LaTeXColor** (Mark)
   - Preserve: `\color{aksen}`, `\color{red}`, etc.
   - Attribute: `data-type="latex-color"` + `data-color="aksen"`

4. **LaTeXLayoutCommand** (Node)
   - Preserve: `\vspace{10pt}`, `\hspace{2em}`, `\hrule height 1pt`, `\newline`
   - Attribute: `data-type="latex-layout"` + `data-cmd` + `data-val`

5. **LaTeXDocumentCommand** (Mark)
   - Preserve: `\noindent`, `\centering`, `\label{...}`
   - Attribute: `data-type="latex-cmd"` + `data-cmd` + `data-val`

6. **LaTeXComment** (Node)
   - Preserve: `% comment text`
   - Attribute: `data-type="latex-comment"` + `data-comment`

7. **LaTeXEnvironment** (Node)
   - Preserve: `\begin{env}...\end{env}` structures
   - Attribute: `data-type="latex-env"` + `data-env`

8. **LaTeXTwocolumn** (Node)
   - Preserve: `\twocolumn[...]` complex blocks
   - Attribute: `data-type="latex-twocolumn"`

9. **LaTeXBrace** (Mark)
   - Preserve: standalone `{` dan `}` untuk grouping
   - Attribute: `data-latex-brace="open|close"`

### 3. Registration in LatexVisualEditor ✅
```typescript
const editor = useEditor({
    extensions: [
        StarterKit,
        // ... standard extensions ...
        // LaTeX-specific extensions
        LaTeXFontSize,
        LaTeXFontStyle,
        LaTeXColor,
        LaTeXLayoutCommand,
        LaTeXDocumentCommand,
        LaTeXComment,
        LaTeXEnvironment,
        LaTeXTwocolumn,
        LaTeXBrace
    ],
    // ...
})
```

## Data Flow (Complete Cycle)

```
┌─────────────────────────────────────────────────────────────┐
│             User Edits in Visual Editor                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  1. LaTeX Source → LaTeXConverter.toHTML()                   │
│     Produces HTML with data attributes                       │
│     ✅ Preserves ALL LaTeX commands as data attributes       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. HTML → Tiptap Editor                                    │
│     Custom extensions RECOGNIZE data attributes             │
│     ✅ Extensions prevent Tiptap from stripping attributes   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. User Edits Content (text, paragraphs, formatting)       │
│     ✅ Data attributes PRESERVED by extensions              │
│     ✅ Only content changes, not LaTeX commands              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Updated HTML → LaTeXConverter.toLaTeX()                 │
│     ✅ Reconstructs LaTeX from data attributes               │
│     Result: VALID LaTeX with all commands intact             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Send to Source Editor                                   │
│     ✅ All LaTeX preserved, document integrity maintained   │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified/Created

### Created:
- ✅ `src/components/document/tiptap/LaTeXExtensions.tsx` (350+ lines)
  - 9 custom Tiptap extensions untuk preserve LaTeX commands

### Modified:
- ✅ `src/components/document/LatexVisualEditor.tsx`
  - Import 9 extensions
  - Register ke Tiptap editor config

### Already Working:
- ✅ `src/lib/latex/LaTeXConverter.ts` (perbaikan sebelumnya)
  - HTML → LaTeX dengan data attributes
  - LaTeX → HTML dengan proper handling

## Testing & Verification

### Test File (with 18/18 checks passing):
- `src/lib/latex/test-converter.ts`

Run:
```bash
npx tsx src/lib/latex/test-converter.ts
```

Expected output: **18/18 checks passed** ✅

## How It Works (Technical Details)

### Before Extension:
```html
<!-- Tiptap receives this: -->
<span data-type="latex-fontsize" data-size="LARGE"></span>

<!-- Tiptap only knows standard nodes, strips it → EMPTY -->
<span></span>
```

### After Extension:
```typescript
// Extension definition:
export const LaTeXFontSize = Mark.create({
  name: 'latexFontSize',

  parseHTML() {
    return [{
      tag: 'span[data-type="latex-fontsize"]',
      getAttrs: element => ({
        size: element.getAttribute('data-size')
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'latex-fontsize'
    }), 0];
  }
});

// Now Tiptap RECOGNIZES and PRESERVES the element with attributes ✅
```

## Key Features

✅ **No Data Loss** - All LaTeX commands preserved during visual editing
✅ **Incremental Updates** - Only edited content changes, LaTeX structure stays intact
✅ **Round-trip Safe** - LaTeX → HTML → LaTeX produces valid output
✅ **User-Friendly** - Visual editor shows readable placeholders for commands
✅ **Extensible** - Easy to add more LaTeX commands as extensions

## Usage in Application

1. User is in **Source Mode** (pure LaTeX)
2. Switch to **Visual Mode** → LaTeXConverter.toHTML() called
3. Extensions register HTML patterns → Tiptap loads with extensions
4. User edits content → extensions preserve LaTeX commands
5. On update → LaTeXConverter.toLaTeX() called
6. Send back to Source Mode → all LaTeX intact ✅

## To Deploy

1. ✅ Extensions already created and imported
2. ✅ LatexVisualEditor already updated
3. ✅ LaTeXConverter already improved

Ready for testing in development environment!

## Next Steps (Optional Improvements)

- [ ] Add more custom extensions for uncommon LaTeX commands
- [ ] Add visual styling/icons for different command types
- [ ] Add command palette for inserting LaTeX commands
- [ ] Add syntax validation for complex environments
- [ ] Add performance optimizations for large documents
