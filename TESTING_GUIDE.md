# 🧪 Real-Time Testing Guide - No Mock Data

## 🎯 Objective
Test all features with **real AI inference** and **live results**. No mock data, only production-ready functionality.

---

## 📋 Pre-Test Setup

### Step 1: Load API Keys
1. Open: http://localhost:5173/setup-test-keys.html
2. Click **"Setup All API Keys"**
3. Wait for success message
4. You'll be redirected to home page

**API Keys Loaded**:
- ✅ OpenAI (GPT-5.2, GPT-4)
- ✅ Anthropic (Claude 4)
- ✅ Google (Gemini 2)
- ✅ xAI (Grok 3)
- ✅ DeepSeek (via HuggingFace)

---

## 🧪 Test Plan

### Test 1: Home Page ✅
**URL**: http://localhost:5173/

**What to Check**:
- [ ] Page loads without errors
- [ ] Navigation menu visible
- [ ] All feature cards display
- [ ] Links work correctly
- [ ] No console errors

**Expected**: Clean home page with all features listed

---

### Test 2: Settings Page ✅
**URL**: http://localhost:5173/settings

**What to Test**:
1. Check if API keys are loaded
2. Try viewing saved keys
3. Verify all 5 providers show keys

**Expected**: All API keys visible and saved

---

### Test 3: Brainstorm Feature 🔥
**URL**: http://localhost:5173/brainstorm

**Test Steps**:
1. Enter topic: "Digital Marketing for Small Businesses"
2. Select provider: OpenAI
3. Select model: GPT-4 Turbo
4. Click "Generate Ideas"
5. Wait for real AI response (10-30 seconds)

**What to Check**:
- [ ] Loading state shows
- [ ] Real AI generates 5 titles
- [ ] Real outline appears
- [ ] Can select a title
- [ ] "Use This Outline" button works
- [ ] Redirects to Builder

**Expected**: Real AI-generated titles and outline, no mock data

**If Fails**: Check console for errors, verify API key format

---

### Test 4: Builder Feature 🔥
**URL**: http://localhost:5173/builder

**Test Steps**:
1. Configure book:
   - Topic: "Digital Marketing for Small Businesses"
   - Word Count: 10000 (shorter for testing)
   - Tone: Professional
   - Audience: "Small business owners"
2. Paste outline or use from brainstorm
3. Select provider: OpenAI
4. Select model: GPT-4 Turbo
5. Click "Generate Book"
6. Watch progress (2-5 minutes for 10k words)

**What to Check**:
- [ ] Progress bar updates (10% → 100%)
- [ ] Real generation messages appear
- [ ] Takes real time (not instant)
- [ ] Saves to database
- [ ] Redirects to preview

**Expected**: Real ebook generation with actual progress, saves to database

**If Fails**: Check console, verify API key, check database connection

---

### Test 5: Preview Feature 🔥
**URL**: http://localhost:5173/preview

**Test Steps**:
1. Should load automatically after Builder
2. View generated ebook
3. Navigate between chapters
4. Try humanization on a chapter
5. Export to different formats

**What to Check**:
- [ ] Real ebook content loads from database
- [ ] Chapters display correctly
- [ ] Humanization works (real AI call)
- [ ] Export downloads real files
- [ ] HTML export has real content
- [ ] Markdown export has real content

**Expected**: Real ebook content, real humanization, real exports

**If Fails**: Check if ebook saved to database, verify export service

---

### Test 6: Children's Ebooks 🔥
**URL**: http://localhost:5173/children-books

**Test Steps**:
1. Enter details:
   - Title: "The Brave Little Robot"
   - Age Group: 3-5 years
   - Theme: "Friendship and courage"
   - Page Count: 8 pages
   - Story Provider: OpenAI
   - Image Provider: Google
   - Style: Cartoon
2. Click "Generate Story"
3. Wait for real AI response (30-60 seconds)
4. Review story and characters
5. Click "Generate Illustrations"
6. Export book

**What to Check**:
- [ ] Real AI generates age-appropriate story
- [ ] Characters are created
- [ ] Pages have real content
- [ ] Illustration prompts generated
- [ ] Export works

**Expected**: Real children's story with characters and pages

**If Fails**: Check API keys for both story and image providers

---

### Test 7: Audiobooks 🔥
**URL**: http://localhost:5173/audiobooks

**Test Steps**:
1. Should see list of ebooks (if any created)
2. Select an ebook
3. Choose voice provider: Google Cloud TTS
4. Select voice
5. Generate audio for one chapter
6. Play audio

**What to Check**:
- [ ] Ebooks load from database
- [ ] Voice selection works
- [ ] Audio generation starts
- [ ] Real TTS audio created
- [ ] Audio player works

**Expected**: Real TTS audio generation

**If Fails**: Check TTS API keys, verify audio service

---

## 🐛 Common Issues & Fixes

### Issue 1: "No API key found"
**Fix**: 
1. Go to http://localhost:5173/setup-test-keys.html
2. Click "Setup All API Keys"
3. Refresh the page

### Issue 2: "Invalid API key format"
**Fix**:
1. Check console for which provider failed
2. Verify key format in .env file
3. Re-run setup script

### Issue 3: Generation fails immediately
**Fix**:
1. Check console for error message
2. Verify API key has quota
3. Try different provider
4. Check network connection

### Issue 4: Database errors
**Fix**:
1. Check Supabase connection
2. Verify .env has correct SUPABASE_PROJECT_URL
3. Check if tables exist
4. Run database setup script

### Issue 5: Progress stuck at X%
**Fix**:
1. Check console for errors
2. Wait longer (AI can take 2-5 minutes)
3. Check API rate limits
4. Try with smaller word count

---

## ✅ Success Criteria

### Brainstorm
- ✅ Generates 5 real titles
- ✅ Creates detailed outline
- ✅ Takes 10-30 seconds
- ✅ Saves to session

### Builder
- ✅ Generates complete ebook
- ✅ Shows real progress
- ✅ Takes 2-5 minutes
- ✅ Saves to database
- ✅ Redirects to preview

### Preview
- ✅ Loads real ebook
- ✅ Shows all chapters
- ✅ Humanization works
- ✅ Exports real files

### Children's Books
- ✅ Generates real story
- ✅ Creates characters
- ✅ Age-appropriate content
- ✅ Exports successfully

### Audiobooks
- ✅ Lists real ebooks
- ✅ Generates real audio
- ✅ Audio plays correctly

---

## 📊 Test Results Template

```
Test Date: [DATE]
Tester: [NAME]

✅ Home Page: PASS/FAIL
✅ Settings: PASS/FAIL
✅ Brainstorm: PASS/FAIL
   - Time taken: [X] seconds
   - Titles generated: [X]
   - Outline quality: Good/Fair/Poor
✅ Builder: PASS/FAIL
   - Time taken: [X] minutes
   - Word count: [X]
   - Saved to DB: YES/NO
✅ Preview: PASS/FAIL
   - Chapters loaded: [X]
   - Humanization: PASS/FAIL
   - Export: PASS/FAIL
✅ Children's Books: PASS/FAIL
   - Story quality: Good/Fair/Poor
   - Characters: [X]
   - Pages: [X]
✅ Audiobooks: PASS/FAIL
   - Audio generated: YES/NO
   - Audio quality: Good/Fair/Poor

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
[Any additional observations]
```

---

## 🚀 Quick Test Commands

### Test API Keys
```javascript
// In browser console
const keys = JSON.parse(localStorage.getItem('bestseller_api_keys'));
console.log('API Keys:', keys.map(k => k.provider));
```

### Test Database Connection
```javascript
// In browser console
fetch('/api/keys/secure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'list' })
}).then(r => r.json()).then(console.log);
```

### Clear Cache and Restart
```bash
# Stop server
Ctrl+C

# Clear cache
rm -rf project/.react-router

# Restart
npm run dev
```

---

## 📝 Notes for Testing

1. **Be Patient**: Real AI takes time (10 seconds to 5 minutes)
2. **Check Console**: Always have browser console open
3. **Monitor Network**: Check Network tab for API calls
4. **Save Results**: Document what works and what doesn't
5. **Test Incrementally**: Fix issues as you find them

---

## 🎯 Priority Order

1. **CRITICAL**: Brainstorm (must work for everything else)
2. **HIGH**: Builder (core feature)
3. **HIGH**: Preview (needed to see results)
4. **MEDIUM**: Children's Books
5. **MEDIUM**: Audiobooks
6. **LOW**: Advanced features

---

**Ready to test? Start here**: http://localhost:5173/setup-test-keys.html

Good luck! 🚀
