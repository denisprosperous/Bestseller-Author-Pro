# localStorage API Key Debugging Guide

## Current Status

The localStorage API key solution is **FULLY IMPLEMENTED** and should be working. If keys are not saving, follow this debugging guide.

## Quick Test

### Step 1: Open Test Page
1. Make sure dev server is running: http://localhost:5173
2. Open the test page: http://localhost:5173/test-localstorage.html
3. This will test localStorage directly without the React app

### Step 2: Test localStorage Directly
Open browser console (F12) and run:

```javascript
// Test 1: Check if localStorage works
localStorage.setItem('test', 'hello');
console.log(localStorage.getItem('test')); // Should print: hello
localStorage.removeItem('test');

// Test 2: Save a test API key
const testKey = {
  provider: 'openai',
  key: 'sk-test-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
localStorage.setItem('bestseller_api_keys', JSON.stringify([testKey]));

// Test 3: Read it back
const saved = localStorage.getItem('bestseller_api_keys');
console.log('Saved keys:', JSON.parse(saved));

// Test 4: Clear it
localStorage.removeItem('bestseller_api_keys');
```

## Debugging the Settings Page

### Check 1: Verify USE_LOCAL_STORAGE Flag

The Settings page should have this at the top:
```typescript
const USE_LOCAL_STORAGE = true;
```

Location: `project/app/routes/settings.tsx` line 16

### Check 2: Verify Console Logs

When you click "Save" on the Settings page, you should see:
```
✅ API key saved to localStorage for openai
```

If you DON'T see this, there's an error in the save function.

### Check 3: Check for JavaScript Errors

Open browser console (F12) and look for:
- Red error messages
- Failed network requests
- TypeScript errors

### Check 4: Verify localStorage Service

Open browser console and test the service directly:

```javascript
// Import the service (in browser console)
const service = {
  saveApiKey(provider, apiKey) {
    const STORAGE_KEY = 'bestseller_api_keys';
    const keys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const existingIndex = keys.findIndex(k => k.provider === provider);
    
    const keyData = {
      provider,
      key: apiKey,
      createdAt: existingIndex >= 0 ? keys[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      keys[existingIndex] = keyData;
    } else {
      keys.push(keyData);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    console.log(`✅ API key saved to localStorage for ${provider}`);
  },
  
  getApiKey(provider) {
    const STORAGE_KEY = 'bestseller_api_keys';
    const keys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const keyData = keys.find(k => k.provider === provider);
    return keyData ? keyData.key : null;
  },
  
  getAllKeys() {
    const STORAGE_KEY = 'bestseller_api_keys';
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }
};

// Test it
service.saveApiKey('openai', 'sk-test-key-123');
console.log('Saved key:', service.getApiKey('openai'));
console.log('All keys:', service.getAllKeys());
```

## Common Issues and Solutions

### Issue 1: "Keys not saving when I click Save"

**Symptoms:**
- Click "Save" button
- No success message appears
- No console log appears
- Keys don't show as "Configured"

**Solutions:**

1. **Check if button is actually calling the function:**
   - Open browser DevTools (F12)
   - Go to Sources tab
   - Find `settings.tsx`
   - Set a breakpoint in `handleSaveKey` function
   - Click Save button
   - If breakpoint doesn't hit, there's a UI issue

2. **Check for JavaScript errors:**
   - Open Console tab
   - Look for red error messages
   - Fix any errors shown

3. **Verify localStorage is enabled:**
   - Some browsers disable localStorage in private/incognito mode
   - Try in regular browser window
   - Check browser settings

4. **Clear browser cache:**
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Clear cached files
   - Reload page

### Issue 2: "Success message shows but keys don't persist"

**Symptoms:**
- Success message appears
- Console shows "✅ API key saved"
- But keys disappear on page reload

**Solutions:**

1. **Check if localStorage is being cleared:**
   ```javascript
   // In console, check if keys exist
   localStorage.getItem('bestseller_api_keys')
   ```

2. **Check browser settings:**
   - Make sure "Clear cookies on exit" is disabled
   - Make sure localStorage is not blocked

3. **Try a different browser:**
   - Test in Chrome, Firefox, or Edge
   - Some browsers have stricter privacy settings

### Issue 3: "Keys save but don't work in Brainstorm/Builder"

**Symptoms:**
- Keys save successfully in Settings
- Show as "Configured"
- But get "No API key found" error when generating

**Solutions:**

1. **Check if AI service is reading from localStorage:**
   - Open `project/app/services/api-key-service.ts`
   - Verify it has fallback to `localAPIKeyService`
   - Should see this code:
   ```typescript
   const localKey = localAPIKeyService.getApiKey(provider);
   if (localKey) {
     console.log(`Using ${provider} key from localStorage`);
     return localKey;
   }
   ```

2. **Check console logs when generating:**
   - Go to Brainstorm page
   - Open console (F12)
   - Click "Generate Ideas"
   - Look for: "Using [provider] key from localStorage"

3. **Verify key format:**
   - OpenAI keys must start with `sk-`
   - Google keys are alphanumeric
   - Check the key you entered is valid

### Issue 4: "localStorage is undefined"

**Symptoms:**
- Error: "localStorage is not defined"
- Error: "Cannot read property 'getItem' of undefined"

**Solutions:**

1. **Check if running in server-side context:**
   - localStorage only works in browser
   - Make sure code runs in `useEffect` or event handlers
   - Never call localStorage during server-side rendering

2. **Add safety check:**
   ```typescript
   if (typeof window !== 'undefined' && window.localStorage) {
     // Safe to use localStorage
   }
   ```

## Manual Verification Steps

### Step 1: Save a Key Manually

Open browser console and run:

```javascript
// Save OpenAI key
const keys = [{
  provider: 'openai',
  key: 'sk-your-actual-key-here',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}];
localStorage.setItem('bestseller_api_keys', JSON.stringify(keys));
console.log('✅ Key saved manually');
```

### Step 2: Verify It's Saved

```javascript
// Check if it's there
const saved = localStorage.getItem('bestseller_api_keys');
console.log('Saved data:', saved);
console.log('Parsed:', JSON.parse(saved));
```

### Step 3: Reload Settings Page

1. Go to http://localhost:5173/settings
2. The OpenAI provider should show "Configured" with a checkmark
3. If it does, localStorage is working!

### Step 4: Test in Brainstorm

1. Go to http://localhost:5173/brainstorm
2. Enter a book topic
3. Click "Generate Ideas"
4. Check console for: "Using openai key from localStorage"
5. Should generate real content

## Advanced Debugging

### Enable Verbose Logging

Add this to the top of `local-api-key-service.ts`:

```typescript
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[LocalAPIKeyService]', ...args);
  }
}
```

Then add `log()` calls throughout:

```typescript
saveApiKey(provider: string, apiKey: string): void {
  log('saveApiKey called', { provider, keyLength: apiKey.length });
  try {
    const keys = this.getAllKeys();
    log('Current keys:', keys);
    
    // ... rest of function
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    log('Keys saved to localStorage:', keys);
    console.log(`✅ API key saved to localStorage for ${provider}`);
  } catch (error) {
    log('Error saving:', error);
    // ... error handling
  }
}
```

### Check React State

Add console logs to Settings component:

```typescript
const handleSaveKey = async (providerId: string) => {
  console.log('🔍 handleSaveKey called', { providerId, key: apiKeys[providerId] });
  
  const key = apiKeys[providerId];
  if (!key || !key.trim()) {
    console.log('❌ No key provided');
    setError("Please enter an API key");
    return;
  }

  try {
    console.log('🔍 Attempting to save...');
    setLoadingProvider(providerId);
    setError(null);
    setSuccess(null);

    if (USE_LOCAL_STORAGE) {
      console.log('🔍 Using localStorage mode');
      localAPIKeyService.saveApiKey(providerId, key);
      console.log('✅ Save completed');
      // ... rest of function
    }
  } catch (err) {
    console.log('❌ Error in handleSaveKey:', err);
    // ... error handling
  }
}
```

## Still Not Working?

If you've tried everything above and it's still not working:

### Option 1: Use Environment Variables Instead

1. Edit `project/.env`:
   ```env
   VITE_USE_DEV_API_KEYS=true
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   VITE_GOOGLE_API_KEY=your-actual-key-here
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Keys will be loaded from .env file instead

### Option 2: Check File Versions

Make sure you have the latest versions:

```bash
# Check git status
git status

# Pull latest changes
git pull

# Reinstall dependencies
cd project
rm -rf node_modules
npm install

# Restart server
npm run dev
```

### Option 3: Create a Bug Report

If nothing works, create a detailed bug report with:

1. **Browser and version** (Chrome 120, Firefox 121, etc.)
2. **Operating system** (Windows 11, macOS 14, etc.)
3. **Console errors** (copy all red errors from F12 console)
4. **Steps to reproduce** (exactly what you clicked)
5. **Screenshots** (of Settings page and console)
6. **localStorage test results** (from manual verification above)

## Success Checklist

✅ localStorage test page works
✅ Manual save/load in console works
✅ Settings page shows "Browser Storage (Testing Mode)"
✅ Clicking Save shows success message
✅ Console shows "✅ API key saved to localStorage"
✅ Page reload shows keys as "Configured"
✅ Brainstorm page shows "Using [provider] key from localStorage"
✅ Content generation works

If all checkboxes are checked, localStorage is working perfectly! 🎉

## Quick Reference

### Storage Key
```
bestseller_api_keys
```

### Data Format
```json
[
  {
    "provider": "openai",
    "key": "sk-...",
    "createdAt": "2026-01-29T...",
    "updatedAt": "2026-01-29T..."
  }
]
```

### Console Commands
```javascript
// View all keys
JSON.parse(localStorage.getItem('bestseller_api_keys'))

// Clear all keys
localStorage.removeItem('bestseller_api_keys')

// Save a test key
localStorage.setItem('bestseller_api_keys', JSON.stringify([{
  provider: 'openai',
  key: 'sk-test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}]))
```
