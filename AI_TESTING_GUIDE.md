# AI Assistant Testing Guide

## Setup Checklist

- [x] Dependencies installed (`@langchain/google-genai`, `@langchain/core`, etc.)
- [x] Custom tools implementation (9 tools in `src/lib/ai/tools.ts`)
- [x] Agent with Google Gemini configured
- [x] API routes for streaming (`/api/ai-stream`)
- [x] Client-side tool execution in `AIChatPanel.tsx`
- [x] Content extraction helper (handles array/string content)
- [ ] **ADD GOOGLE_API_KEY to `.env.local`** ← YOU NEED TO DO THIS!
- [ ] Test with `pnpm dev`

## ⚠️ IMPORTANT: Get Your API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Create a new API key (free tier available)
3. Copy the key
4. Open `.env.local` file
5. Replace `your_google_api_key_here_REPLACE_THIS` with your actual key:
   ```env
   GOOGLE_API_KEY=AIzaSy... your actual key here
   ```
6. Save the file
7. Restart dev server: `pnpm dev`

## Testing Commands

### 1. Simple Chat (No Tools)
```
User: "Hello, who are you?"
Expected: Neptune introduces itself as AI writing assistant
```

### 2. Read Document
```
User: "What's in my document?"
Expected: 
- AI uses read_document tool
- Returns content summary
- Shows word count
```

### 3. Get Statistics
```
User: "How many words are in this document?"
Expected:
- AI uses get_document_stats tool
- Returns: word count, character count, reading time, paragraph count
- Message shows "✓ get_document_stats: { words: 123, ... }"
```

### 4. Insert Content
```
User: "Add a paragraph saying 'This is a test.'"
Expected:
- AI uses insert_content tool
- Document updates with new paragraph
- Message shows "✓ insert_content: Inserted content at current cursor"
```

### 5. Format Text (Select text first!)
```
User: [Select some text] "Make this text bold"
Expected:
- AI uses format_text tool with format='bold'
- Selected text becomes bold
- Message shows "✓ format_text: Applied bold formatting"
```

### 6. Insert Table
```
User: "Insert a 3 by 4 table"
Expected:
- AI uses insert_table tool
- 3x4 table appears in document
- Message shows "✓ insert_table: Inserted 3x4 table with header row"
```

### 7. Replace Content
```
User: "Replace the first paragraph with 'New introduction.'"
Expected:
- AI uses replace_content tool
- First paragraph text changes
- Message shows "✓ replace_content: Replaced content from X to Y"
```

### 8. Text Alignment
```
User: "Center align this paragraph"
Expected:
- AI uses set_text_align tool with align='center'
- Paragraph alignment changes
- Message shows "✓ set_text_align: Set text alignment to center"
```

### 9. Insert Divider
```
User: "Add a horizontal line"
Expected:
- AI uses insert_horizontal_rule tool
- Horizontal rule appears in document
- Message shows "✓ insert_horizontal_rule: Inserted horizontal rule"
```

### 10. Complex Workflow
```
User: "Read the document, then make the title bold, and insert a table below it"
Expected:
- AI executes multiple tools in sequence:
  1. read_document (gets content)
  2. format_text (makes title bold)
  3. insert_table (adds table)
- All changes visible in real-time
- Multiple success messages in chat
```

## Debugging

### Check Console Logs

Open browser DevTools (F12) and look for:

```
[AI] Connected to stream
[AI] Executing insert_table...
[AI] Tool insert_table result: Inserted 3x3 table
```

### Common Issues

**1. "[object Object]" appears**
- ✅ FIXED - extractTextContent() handles this
- If you see this, report it as a bug

**2. "Error: API key not valid"**
- Check `.env.local` has correct `GOOGLE_API_KEY`
- Restart dev server after adding key
- Verify key at https://makersuite.google.com

**3. "Editor not available"**
- Editor might not be initialized yet
- Try refreshing the page
- Check editor prop is passed correctly

**4. Tools not executing**
- Check browser console for errors
- Verify tool name matches exactly
- Check tool input matches schema

**5. No response from AI**
- Check API key is valid
- Check network tab for 401/403 errors
- Verify `AI_PROVIDER=google-genai` in `.env.local`

## Success Criteria

✅ AI responds with actual text (not "[object Object]")
✅ Tools execute and update the document in real-time
✅ Success messages show "✓ tool_name: result"
✅ Multiple tools can be chained in one request
✅ No console errors
✅ Streaming works smoothly without freezing

## Performance Benchmarks

- **First response**: < 2 seconds
- **Tool execution**: < 500ms per tool
- **Streaming**: Smooth chunks, no buffering
- **Large documents (>10,000 words)**: < 5 seconds to read

## Next Steps After Testing

1. ✅ Verify all 9 tools work correctly
2. Add Firebase authentication to API routes
3. Add rate limiting (Upstash Redis)
4. Add user feedback UI (like/dislike responses)
5. Add loading indicators for tool execution
6. Monitor token usage and costs
7. Consider Tiptap AI Toolkit migration (when license available)

## Troubleshooting Checklist

- [ ] `.env.local` has `GOOGLE_API_KEY`
- [ ] Dev server restarted after env changes
- [ ] Browser console shows no errors
- [ ] Editor is loaded and editable
- [ ] AI Assistant panel is open
- [ ] Network tab shows successful `/api/ai-stream` requests
- [ ] Google API key has quota remaining

---

**Happy Testing!** 🚀

Report any issues with:
- Exact command sent to AI
- Console errors (screenshot)
- Expected vs actual behavior
