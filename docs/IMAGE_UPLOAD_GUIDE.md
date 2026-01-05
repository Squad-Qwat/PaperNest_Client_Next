# 🖼️ Image Upload Configuration & Limitations

## ⚠️ Important: Image Size Limitations

Due to **Liveblocks websocket message size limit (~100KB)**, images are automatically compressed before insertion.

### Current Implementation

#### Compression Settings:
- **Max Width**: 1200px (maintains aspect ratio)
- **Quality**: 0.8 (80% quality)
- **Max Original Size**: 5MB
- **Target Compressed Size**: <80KB

#### How It Works:
1. User drops/pastes image
2. Image is automatically resized to max 1200px width
3. Image is compressed to 80% quality
4. If still >80KB, warning is logged but image is inserted
5. Base64 data is synced through Liveblocks

### Size Warnings

The system will log warnings for:
- Original files >5MB: `"Image file too large (>5MB)"`
- Compressed images >80KB: `"Compressed image still too large (~XXkb). Consider uploading to server."`

---

## 🚀 Recommended Solution: Server Upload

For better performance and larger images, implement server-side upload:

### 1. Create Upload API Endpoint

**File: `src/app/api/upload-image/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Upload to Firebase Storage
    const storage = getStorage()
    const fileName = `documents/images/${Date.now()}-${file.name}`
    const storageRef = ref(storage, fileName)
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    })

    const downloadURL = await getDownloadURL(storageRef)

    return NextResponse.json({ 
      success: true, 
      url: downloadURL 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed' 
    }, { status: 500 })
  }
}
```

### 2. Update FileHandler Configuration

**File: `src/lib/editor/extensions.js`**

```javascript
// Add helper function for server upload
const uploadImageToServer = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  const data = await response.json()
  return data.url
}

// Update FileHandler configuration
FileHandler.configure({
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  onDrop: async (currentEditor, files, pos) => {
    for (const file of files) {
      try {
        // Upload to server
        const imageUrl = await uploadImageToServer(file)

        // Insert image with server URL
        currentEditor
          .chain()
          .insertContentAt(pos, {
            type: 'image',
            attrs: {
              src: imageUrl,
            },
          })
          .focus()
          .run()
      } catch (error) {
        console.error('Error uploading image:', error)
        // Fallback to compressed base64
        const compressedDataUrl = await compressImage(file, 1200, 0.8)
        currentEditor
          .chain()
          .insertContentAt(pos, {
            type: 'image',
            attrs: {
              src: compressedDataUrl,
            },
          })
          .focus()
          .run()
      }
    }
  },
  onPaste: async (currentEditor, files, htmlContent) => {
    if (htmlContent) return false

    for (const file of files) {
      try {
        const imageUrl = await uploadImageToServer(file)
        currentEditor
          .chain()
          .insertContentAt(currentEditor.state.selection.anchor, {
            type: 'image',
            attrs: {
              src: imageUrl,
            },
          })
          .focus()
          .run()
      } catch (error) {
        console.error('Error uploading image:', error)
        const compressedDataUrl = await compressImage(file, 1200, 0.8)
        currentEditor
          .chain()
          .insertContentAt(currentEditor.state.selection.anchor, {
            type: 'image',
            attrs: {
              src: compressedDataUrl,
            },
          })
          .focus()
          .run()
      }
    }
  },
})
```

### 3. Configure Firebase Storage Rules

**File: `firestore.rules`** (or create `storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/images/{imageId} {
      // Allow authenticated users to upload
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024 // 10MB limit
                   && request.resource.contentType.matches('image/.*');
      
      // Allow anyone to read (adjust based on your requirements)
      allow read: if true;
    }
  }
}
```

---

## 📊 Comparison: Base64 vs Server Upload

### Base64 (Current Implementation)

**Pros:**
- ✅ No server setup required
- ✅ Works immediately
- ✅ Simple implementation
- ✅ No external dependencies

**Cons:**
- ❌ Limited to small images (<80KB compressed)
- ❌ Increases document size
- ❌ Slower sync with Liveblocks
- ❌ Higher bandwidth usage
- ❌ Browser memory issues with many images

### Server Upload (Recommended)

**Pros:**
- ✅ Support large images (up to 10MB)
- ✅ Better performance
- ✅ Smaller document size
- ✅ Faster Liveblocks sync
- ✅ CDN delivery (Firebase Storage)
- ✅ Better caching

**Cons:**
- ❌ Requires server endpoint
- ❌ Firebase Storage costs
- ❌ More complex implementation
- ❌ Need to handle failed uploads

---

## 🎯 Recommended Approach

### Hybrid Solution (Best of Both Worlds)

Use **server upload as primary method**, with **compressed base64 as fallback**:

```javascript
onDrop: async (currentEditor, files, pos) => {
  for (const file of files) {
    try {
      // Try server upload first
      const imageUrl = await uploadImageToServer(file)
      currentEditor.chain().insertContentAt(pos, {
        type: 'image',
        attrs: { src: imageUrl },
      }).focus().run()
    } catch (error) {
      console.warn('Server upload failed, using compressed fallback')
      
      // Fallback to compressed base64
      const compressedDataUrl = await compressImage(file, 800, 0.7)
      currentEditor.chain().insertContentAt(pos, {
        type: 'image',
        attrs: { src: compressedDataUrl },
      }).focus().run()
    }
  }
}
```

### Progressive Enhancement:
1. **Small images (<100KB)**: Compress and use base64
2. **Medium images (100KB-5MB)**: Upload to server
3. **Large images (>5MB)**: Reject or compress heavily

---

## 🔧 Configuration Options

### Adjust Compression Settings

In `extensions.js`, modify the `compressImage` function:

```javascript
// More aggressive compression (smaller file, lower quality)
const compressedDataUrl = await compressImage(file, 800, 0.6)

// Less compression (larger file, higher quality)
const compressedDataUrl = await compressImage(file, 1600, 0.9)

// Very small images (for thumbnails)
const compressedDataUrl = await compressImage(file, 400, 0.7)
```

### Size Limits

```javascript
// Increase max size before compression
if (file.size > 10 * 1024 * 1024) { // 10MB

// Increase compressed size warning threshold
if (estimatedSize > 150) { // 150KB
```

---

## 📝 User Notifications

### Add Toast Notifications

```javascript
import { toast } from '@/components/ui/use-toast'

// In FileHandler
if (file.size > 5 * 1024 * 1024) {
  toast({
    title: 'Image Too Large',
    description: 'Please upload images smaller than 5MB',
    variant: 'destructive',
  })
  continue
}

// Success message
toast({
  title: 'Image Uploaded',
  description: 'Your image has been added to the document',
})

// Warning for large compressed images
if (estimatedSize > 80) {
  toast({
    title: 'Large Image',
    description: 'Image may cause performance issues. Consider resizing.',
    variant: 'warning',
  })
}
```

---

## 🐛 Troubleshooting

### Error: "Message is too large for websockets"

**Cause**: Image base64 data exceeds Liveblocks websocket limit

**Solutions**:
1. ✅ Use more aggressive compression (already implemented)
2. ✅ Implement server upload (recommended)
3. ✅ Resize images to smaller dimensions
4. Configure Liveblocks `largeMessageStrategy` (not recommended for images)

### Images Not Appearing

**Check:**
- Browser console for errors
- Image compression succeeded
- Base64 data is valid
- Editor is properly initialized

### Slow Performance

**Causes:**
- Too many large images
- Base64 encoding overhead
- Liveblocks sync delays

**Solutions:**
- Implement server upload
- Limit number of images per document
- Use lazy loading for images
- Implement pagination

---

## 📚 References

- [Liveblocks Message Size Limits](https://liveblocks.io/docs/platform/limits)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Tiptap Image Extension](https://tiptap.dev/docs/editor/extensions/nodes/image)
- [Tiptap File Handler](https://tiptap.dev/docs/editor/extensions/functionality/filehandler)

---

## ✅ Current Status

- ✅ Automatic image compression (max 1200px, 80% quality)
- ✅ File size validation (max 5MB)
- ✅ Size warnings in console
- ⏳ Server upload (not yet implemented)
- ⏳ User notifications (not yet implemented)

**Next Steps:**
1. Implement server upload endpoint
2. Add toast notifications
3. Add loading indicators
4. Add retry logic for failed uploads

---

Generated: January 5, 2026
