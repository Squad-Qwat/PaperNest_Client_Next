# Rekomendasi Tiptap Extensions untuk PaperNest

## Extension yang Sudah Digunakan ✅

### Nodes
- ✅ Document, Paragraph, Text
- ✅ Heading (levels 1-4)
- ✅ CodeBlock
- ✅ Blockquote
- ✅ BulletList, OrderedList, ListItem
- ✅ Table, TableRow, TableCell, TableHeader
- ✅ HardBreak

### Marks
- ✅ Bold, Italic, Strike, Underline
- ✅ Code
- ✅ TextStyle, Color
- ✅ FontFamily

### Functionality
- ✅ Gapcursor
- ✅ TrailingNode
- ✅ Placeholder
- ✅ TextAlign
- ✅ Collaboration
- ✅ CollaborationCaret

### Pro Extensions (Team Plan)
- ✅ Pages (pagination)
- ✅ ExportDocx
- ✅ ImportDocx

---

## 🎯 Extension Yang Direkomendasikan untuk Ditambahkan

### 1. **PRIORITY HIGH** - Node Extensions

#### Image
```bash
pnpm add @tiptap/extension-image
```
**Benefit:** Upload dan display gambar dalam dokumen
- Resize image
- Alignment
- Caption support
**Use case:** Dokumen dengan ilustrasi, report dengan screenshot

#### HorizontalRule
```bash
pnpm add @tiptap/extension-horizontal-rule
```
**Benefit:** Pemisah visual antar section
**Use case:** Dokumen formal, chapter breaks

#### TaskList & TaskItem
```bash
pnpm add @tiptap/extension-task-list @tiptap/extension-task-item
```
**Benefit:** Checkbox list untuk to-do atau checklist
**Use case:** Meeting notes, project planning documents

#### Details, DetailsSummary, DetailsContent
```bash
pnpm add @tiptap/extension-details @tiptap/extension-details-summary @tiptap/extension-details-content
```
**Benefit:** Collapsible sections
**Use case:** FAQ, lengthy documents with optional sections

---

### 2. **PRIORITY HIGH** - Mark Extensions

#### Link
```bash
pnpm add @tiptap/extension-link
```
**Benefit:** Hyperlink support
- Auto-detect URLs
- Custom link text
- Open in new tab option
**Use case:** ESSENTIAL untuk dokumen modern

#### Highlight
```bash
pnpm add @tiptap/extension-highlight
```
**Benefit:** Text highlighting dengan berbagai warna
**Use case:** Review, annotation, emphasize important text

#### Subscript & Superscript
```bash
pnpm add @tiptap/extension-subscript @tiptap/extension-superscript
```
**Benefit:** Formatting untuk scientific documents
**Use case:** Rumus kimia (H₂O), mathematical notation (x²), footnotes

---

### 3. **PRIORITY MEDIUM** - Functionality Extensions

#### Typography
```bash
pnpm add @tiptap/extension-typography
```
**Benefit:** Auto-format typography
- Smart quotes ("hello" → "hello")
- Em dash (-- → —)
- Ellipsis (... → …)
- Copyright symbols
**Use case:** Professional document formatting

#### History (Undo/Redo)
```bash
pnpm add @tiptap/extension-history
```
**Benefit:** Built-in undo/redo (Anda sudah implement custom, tapi ini official)
**Note:** Mungkin perlu disesuaikan dengan collaboration setup Anda

#### Dropcursor
```bash
pnpm add @tiptap/extension-dropcursor
```
**Benefit:** Visual indicator saat drag & drop
**Use case:** UX improvement saat drag nodes

#### Focus
```bash
pnpm add @tiptap/extension-focus
```
**Benefit:** Highlight node yang sedang di-focus
**Use case:** Better visual feedback

#### CharacterCount
```bash
pnpm add @tiptap/extension-character-count
```
**Benefit:** Hitung karakter dan kata
**Use case:** Document dengan limit (abstract, summary)

---

### 4. **PRO EXTENSIONS** - Team Plan Benefits 🌟

#### Comments (Start Plan)
```bash
pnpm add @tiptap-pro/extension-comments
```
**Benefit:** Inline commenting system
- Thread discussions
- Resolve/unresolve
- User mentions
**Use case:** PERFECT untuk review system Anda!

#### FileHandler (Team Plan)
```bash
pnpm add @tiptap-pro/extension-file-handler
```
**Benefit:** Drag & drop file upload
- Images
- Documents
- Custom file types
**Use case:** Easy content insertion

#### DragHandle / DragHandleReact (Team Plan)
```bash
pnpm add @tiptap-pro/extension-drag-handle-react
```
**Benefit:** Drag to reorder blocks
**Use case:** Document reorganization

#### Snapshot & SnapshotCompare (Team Plan)
```bash
pnpm add @tiptap-pro/extension-snapshot @tiptap-pro/extension-snapshot-compare
```
**Benefit:** Version history dan comparison
**Use case:** Track changes, document versioning (PERFECT untuk workflow Anda!)

#### TableOfContents (Team Plan)
```bash
pnpm add @tiptap-pro/extension-table-of-contents
```
**Benefit:** Auto-generate table of contents dari headings
**Use case:** Long documents, reports

#### UniqueID (Team Plan)
```bash
pnpm add @tiptap-pro/extension-unique-id
```
**Benefit:** Unique ID untuk setiap node
**Use case:** Tracking, analytics, deep linking

#### ListKit & TableKit (Team Plan)
```bash
pnpm add @tiptap-pro/extension-list-kit @tiptap-pro/extension-table-kit
```
**Benefit:** Advanced list and table features
- Nested lists
- Table operations
- Better keyboard navigation

#### InvisibleCharacters (Team Plan)
```bash
pnpm add @tiptap-pro/extension-invisible-characters
```
**Benefit:** Show spaces, line breaks, paragraphs
**Use case:** Debugging, formatting visibility

#### LineHeight (Team Plan)
```bash
pnpm add @tiptap-pro/extension-line-height
```
**Benefit:** Control line spacing
**Note:** Anda sudah punya custom implementation, tapi ini official version

---

### 5. **SPECIALIZED** - Optional Based on Use Case

#### Mathematics
```bash
pnpm add @tiptap/extension-mathematics
```
**Benefit:** LaTeX math formulas
**Use case:** Academic papers, scientific documents

#### Youtube & Twitch
```bash
pnpm add @tiptap/extension-youtube @tiptap/extension-twitch
```
**Benefit:** Embed videos
**Use case:** Documentation dengan video tutorials

#### Mention
```bash
pnpm add @tiptap/extension-mention
```
**Benefit:** @mention users dengan autocomplete
**Use case:** Collaborative review, comments

#### CodeBlockLowlight
```bash
pnpm add @tiptap/extension-code-block-lowlight lowlight
```
**Benefit:** Syntax highlighting untuk code blocks
**Use case:** Technical documentation

---

## 📦 Recommended Installation Order

### Phase 1: Essential Missing Features
```bash
pnpm add @tiptap/extension-link @tiptap/extension-image @tiptap/extension-highlight @tiptap/extension-horizontal-rule
```

### Phase 2: Rich Formatting
```bash
pnpm add @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-typography @tiptap/extension-task-list @tiptap/extension-task-item
```

### Phase 3: Pro Features (Perfect for Your Review System!)
```bash
pnpm add @tiptap-pro/extension-comments @tiptap-pro/extension-snapshot @tiptap-pro/extension-snapshot-compare @tiptap-pro/extension-file-handler @tiptap-pro/extension-drag-handle-react
```

### Phase 4: Advanced Pro Features
```bash
pnpm add @tiptap-pro/extension-table-of-contents @tiptap-pro/extension-unique-id @tiptap-pro/extension-list-kit @tiptap-pro/extension-table-kit
```

### Phase 5: UX Enhancements
```bash
pnpm add @tiptap/extension-dropcursor @tiptap/extension-focus @tiptap/extension-character-count @tiptap-pro/extension-invisible-characters
```

---

## 🎯 Top 5 Must-Have Extensions untuk PaperNest

Berdasarkan fitur review dan collaboration yang Anda miliki:

1. **@tiptap/extension-link** - CRITICAL (no modern editor without links!)
2. **@tiptap-pro/extension-comments** - PERFECT untuk review system
3. **@tiptap-pro/extension-snapshot** - Version control & history
4. **@tiptap/extension-image** - Document completeness
5. **@tiptap-pro/extension-file-handler** - Easy content insertion

---

## 💡 Integration Notes

### Comments Extension
Integrasikan dengan sistem review yang sudah ada:
- ReviewComment.tsx bisa diganti/enhanced dengan Tiptap Comments
- Support threading
- User mentions
- Resolve/unresolve status

### Snapshot Extension
Perfect untuk:
- Document versions (ModalVersions.tsx)
- Track changes
- Compare document states
- Rollback functionality

### FileHandler Extension
Tambahkan di DocumentEditor untuk:
- Drag & drop images
- Paste images from clipboard
- File upload handling

---

## 🔐 Authentication Required

Pro extensions memerlukan:
```env
NEXT_PUBLIC_TIPTAP_APP_ID=your_app_id
NEXT_PUBLIC_TIPTAP_JWT_TOKEN=your_jwt_token
```

Anda sudah set ini untuk ImportDocx, jadi tinggal add extension baru!

---

## 📚 Documentation Links

- [Tiptap Nodes](https://tiptap.dev/docs/editor/extensions/nodes)
- [Tiptap Marks](https://tiptap.dev/docs/editor/extensions/marks)
- [Tiptap Functionality](https://tiptap.dev/docs/editor/extensions/functionality)
- [Tiptap Pro Extensions](https://tiptap.dev/docs/editor/extensions/pro)

---

## ⚠️ Notes

- Extensions marked dengan Team Plan memerlukan valid subscription
- Test setiap extension di development environment dulu
- Beberapa extension mungkin conflict dengan custom extensions Anda
- Consider bundle size impact (terutama CodeBlockLowlight dengan lowlight library)
