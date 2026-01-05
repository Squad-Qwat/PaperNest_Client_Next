# 🎉 New Tiptap Extensions Usage Guide

## ✅ Successfully Installed Extensions

### Core Extensions (Open Source)
- ✅ **Link** - Hyperlink support dengan auto-detection
- ✅ **Image** - Image upload & display
- ✅ **Highlight** - Text highlighting dengan multiple colors
- ✅ **HorizontalRule** - Visual separator (HR tag)
- ✅ **FileHandler** - Drag & drop file support
- ✅ **DragHandleReact** - Drag to reorder blocks

### Pro Extensions (Team Plan)
- ✅ **Comments** - Inline commenting system
- ✅ **Snapshot** - Document versioning
- ✅ **SnapshotCompare** - Compare document versions

---

## 🔗 1. Link Extension

### Features
- Auto-detect URLs dan convert ke links
- Click to edit link
- Custom styling
- Protocol handling (http/https)

### Usage in Editor Commands

```javascript
// Set link
editor.chain().focus().setLink({ href: 'https://example.com' }).run()

// Set link with target
editor.chain().focus().setLink({ 
  href: 'https://example.com',
  target: '_blank' 
}).run()

// Remove link
editor.chain().focus().unsetLink().run()

// Toggle link
editor.chain().focus().toggleLink({ href: 'https://example.com' }).run()
```

### Implementation in Toolbar (EditorToolbar.js)

```javascript
// Add Link Button
<button
  onClick={() => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }}
  className={editor.isActive('link') ? 'is-active' : ''}
  disabled={!editor.can().setLink({ href: '' })}
>
  <LinkIcon />
</button>

// Remove Link Button
<button
  onClick={() => editor.chain().focus().unsetLink().run()}
  disabled={!editor.isActive('link')}
>
  <LinkOffIcon />
</button>
```

### Check if Link is Active

```javascript
const isActive = editor.isActive('link')
const linkAttributes = editor.getAttributes('link')
console.log(linkAttributes.href) // Get current link URL
```

---

## 🖼️ 2. Image Extension

### Features
- Base64 image support
- Inline images
- Drag & drop (via FileHandler)
- Paste images from clipboard
- Responsive sizing

### Usage in Editor Commands

```javascript
// Insert image from URL
editor.chain().focus().setImage({ src: 'https://example.com/image.jpg' }).run()

// Insert image with alt text
editor.chain().focus().setImage({ 
  src: 'https://example.com/image.jpg',
  alt: 'Description',
  title: 'Image Title'
}).run()
```

### Implementation in Toolbar

```javascript
// Image Upload Button
<button
  onClick={() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        editor.chain().focus().setImage({ src: event.target.result }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }}
>
  <ImageIcon />
</button>
```

### File Upload to Server (Optional)

```javascript
// Upload to your backend
const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  const data = await response.json()
  return data.url
}

// Use in editor
<button
  onClick={async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      const url = await uploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    }
    input.click()
  }}
>
  <ImageIcon />
</button>
```

---

## 🎨 3. Highlight Extension

### Features
- Multiple highlight colors
- Custom color support
- Toggle highlighting

### Usage in Editor Commands

```javascript
// Set highlight with default color (yellow)
editor.chain().focus().toggleHighlight().run()

// Set highlight with specific color
editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()

// Remove highlight
editor.chain().focus().unsetHighlight().run()
```

### Implementation in Toolbar

```javascript
// Highlight Color Picker
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#ccffcc' },
  { name: 'Blue', value: '#cce5ff' },
  { name: 'Pink', value: '#ffccff' },
  { name: 'Orange', value: '#ffcc99' },
]

<div className="highlight-picker">
  {HIGHLIGHT_COLORS.map(color => (
    <button
      key={color.value}
      onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
      style={{ backgroundColor: color.value }}
      className={editor.isActive('highlight', { color: color.value }) ? 'is-active' : ''}
    >
      {color.name}
    </button>
  ))}
  <button onClick={() => editor.chain().focus().unsetHighlight().run()}>
    Clear
  </button>
</div>
```

---

## ➖ 4. Horizontal Rule Extension

### Features
- Visual separator between sections
- Keyboard shortcut support
- Simple insertion

### Usage in Editor Commands

```javascript
// Insert horizontal rule
editor.chain().focus().setHorizontalRule().run()
```

### Implementation in Toolbar

```javascript
<button
  onClick={() => editor.chain().focus().setHorizontalRule().run()}
>
  <MinusIcon /> Horizontal Line
</button>
```

### Keyboard Shortcut
Default: Type `---` (three dashes) and press Enter

---

## 📎 5. File Handler Extension

### Features (Already Configured)
- Drag & drop images into editor
- Paste images from clipboard
- Auto-convert to base64
- File type filtering

### Current Configuration

```javascript
FileHandler.configure({
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  onDrop: (editor, files, pos) => {
    // Handles dropped files
  },
  onPaste: (editor, files, htmlContent) => {
    // Handles pasted files
  },
})
```

### Usage
- **Drag & Drop**: Drag image files directly into the editor
- **Paste**: Copy image and paste (Ctrl+V) into editor
- No additional code needed - already configured!

### Customize for Server Upload

```javascript
FileHandler.configure({
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  onDrop: async (currentEditor, files, pos) => {
    for (const file of files) {
      const url = await uploadToServer(file)
      currentEditor
        .chain()
        .insertContentAt(pos, {
          type: 'image',
          attrs: { src: url },
        })
        .focus()
        .run()
    }
  },
})

const uploadToServer = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  const data = await response.json()
  return data.url
}
```

---

## 💬 6. Comments Extension (Pro)

### Features
- Inline comments
- Thread discussions
- User mentions
- Resolve/unresolve
- Comment metadata

### Basic Usage

```javascript
import { Comments } from '@tiptap-pro/extension-comments'

// Configure in extensions
Comments.configure({
  HTMLAttributes: {
    class: 'comment',
  },
})

// Create comment
editor.chain().focus().setComment({ id: 'comment-1' }).run()

// Remove comment
editor.chain().focus().unsetComment({ id: 'comment-1' }).run()

// Get all comments
const comments = editor.storage.comments.comments
```

### Integration with Your Review System

```javascript
// In DocumentEditor or ReviewComment component
import { useComments } from '@tiptap-pro/extension-comments/react'

const MyCommentComponent = () => {
  const { comments, addComment, deleteComment, updateComment } = useComments()
  
  const handleAddComment = (text) => {
    const commentId = generateId()
    editor.chain().focus().setComment({ 
      id: commentId,
      author: currentUser.uid,
      text: text,
      createdAt: new Date().toISOString()
    }).run()
    
    // Save to Firebase
    saveCommentToFirebase(commentId, text)
  }
  
  return (
    <div className="comments-panel">
      {comments.map(comment => (
        <CommentThread key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
```

---

## 📸 7. Snapshot Extension (Pro)

### Features
- Document versioning
- Manual snapshots
- Automatic snapshots
- Snapshot metadata
- Restore to previous version

### Basic Usage

```javascript
import { Snapshot } from '@tiptap-pro/extension-snapshot'

// Configure
Snapshot.configure({
  onSnapshot: (snapshot) => {
    // Save snapshot to database
    saveSnapshot(snapshot)
  },
})

// Create manual snapshot
editor.chain().focus().snapshot().run()

// Get all snapshots
const snapshots = editor.storage.snapshot.snapshots

// Restore snapshot
editor.commands.restoreSnapshot(snapshotId)
```

### Integration with ModalVersions.tsx

```javascript
import { useSnapshot } from '@tiptap-pro/extension-snapshot/react'

const DocumentVersions = () => {
  const { snapshots, createSnapshot, restoreSnapshot } = useSnapshot()
  
  const handleCreateVersion = () => {
    const snapshot = createSnapshot({
      name: versionName,
      description: versionDescription,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString()
    })
    
    // Save to Firebase
    saveVersionToFirebase(snapshot)
  }
  
  const handleRestore = (snapshotId) => {
    restoreSnapshot(snapshotId)
    toast.success('Document restored to this version')
  }
  
  return (
    <div className="versions-list">
      <button onClick={handleCreateVersion}>
        Create Version
      </button>
      {snapshots.map(snapshot => (
        <VersionCard 
          key={snapshot.id}
          snapshot={snapshot}
          onRestore={() => handleRestore(snapshot.id)}
        />
      ))}
    </div>
  )
}
```

---

## 🔄 8. Snapshot Compare Extension (Pro)

### Features
- Visual diff between versions
- Highlight changes
- Track additions/deletions
- Side-by-side comparison

### Basic Usage

```javascript
import { SnapshotCompare } from '@tiptap-pro/extension-snapshot-compare'

// Configure
SnapshotCompare.configure({
  // configuration options
})

// Compare two snapshots
editor.commands.compareSnapshots({
  from: snapshotId1,
  to: snapshotId2
})

// Get comparison result
const comparison = editor.storage.snapshotCompare.comparison
```

### Implementation Example

```javascript
const VersionCompare = ({ version1, version2 }) => {
  const [comparison, setComparison] = useState(null)
  
  useEffect(() => {
    const result = editor.commands.compareSnapshots({
      from: version1.id,
      to: version2.id
    })
    setComparison(result)
  }, [version1, version2])
  
  return (
    <div className="version-compare">
      <div className="version-panel">
        <h3>{version1.name}</h3>
        <div className="content">{/* render version1 */}</div>
      </div>
      <div className="version-panel">
        <h3>{version2.name}</h3>
        <div className="content">{/* render version2 */}</div>
      </div>
      <div className="changes-panel">
        <h3>Changes</h3>
        <ul>
          {comparison?.changes.map(change => (
            <li key={change.id} className={change.type}>
              {change.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

---

## 🎯 Quick Implementation Checklist

### EditorToolbar.js Updates
- [ ] Add Link button with prompt
- [ ] Add Unlink button
- [ ] Add Image upload button
- [ ] Add Highlight color picker
- [ ] Add Horizontal Rule button

### DocumentEditor.js Updates
- [ ] Import new extensions (already done in extensions.js)
- [ ] Test drag & drop functionality
- [ ] Test paste image functionality

### Review System Integration
- [ ] Integrate Comments extension with ReviewComment.tsx
- [ ] Replace or enhance existing comment system
- [ ] Add comment threading UI

### Version Control Integration
- [ ] Integrate Snapshot extension with ModalVersions.tsx
- [ ] Add version comparison UI
- [ ] Connect to Firebase for version persistence

---

## 🔧 Styling Recommendations

### Add to EditorStyles.css

```css
/* Link styles */
.ProseMirror a {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

.ProseMirror a:hover {
  color: #1d4ed8;
}

/* Image styles */
.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  cursor: default;
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid #3b82f6;
}

/* Highlight styles */
.ProseMirror mark {
  background-color: #fef08a;
  padding: 0.125rem 0;
  border-radius: 0.125rem;
}

/* Horizontal Rule styles */
.ProseMirror hr {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2rem 0;
}

/* Comment styles */
.ProseMirror .comment {
  background-color: #fef3c7;
  border-bottom: 2px solid #f59e0b;
  padding: 0.125rem 0;
}

.ProseMirror .comment.resolved {
  background-color: #d1fae5;
  border-bottom-color: #10b981;
}
```

---

## 📚 Next Steps

1. **Test all new extensions** in development
2. **Update EditorToolbar.js** dengan button untuk Link, Image, Highlight, HR
3. **Integrate Comments** dengan existing review system
4. **Integrate Snapshot** dengan ModalVersions.tsx
5. **Add styling** untuk semua new extensions
6. **Create API endpoint** untuk image upload (optional, jika mau server upload)
7. **Test collaboration** dengan multiple users

---

## 🐛 Troubleshooting

### Extension not working?
- Check browser console untuk errors
- Verify extension is imported correctly
- Check if extension is added to extensions array
- Ensure peer dependencies are satisfied

### Images not uploading?
- Check FileHandler configuration
- Verify file MIME types
- Check browser file size limits
- Implement server upload if base64 too large

### Comments not showing?
- Verify Tiptap Pro authentication (APP_ID & JWT)
- Check Comments extension configuration
- Ensure comment metadata is properly stored

---

## 📖 Documentation Links

- [Link Extension](https://tiptap.dev/docs/editor/extensions/marks/link)
- [Image Extension](https://tiptap.dev/docs/editor/extensions/nodes/image)
- [Highlight Extension](https://tiptap.dev/docs/editor/extensions/marks/highlight)
- [Horizontal Rule](https://tiptap.dev/docs/editor/extensions/nodes/horizontal-rule)
- [File Handler](https://tiptap.dev/docs/editor/extensions/functionality/filehandler)
- [Comments (Pro)](https://tiptap.dev/docs/editor/extensions/functionality/comments)
- [Snapshot (Pro)](https://tiptap.dev/docs/editor/extensions/functionality/snapshot)
