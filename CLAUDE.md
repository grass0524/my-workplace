# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **personal productivity dashboard** built with vanilla HTML/CSS/JavaScript, designed to be:
- A single-page application (SPA)
- Deployed on Cloudflare Pages
- Uses Supabase for authentication and database
- Supports multi-device data synchronization
- Works entirely in the browser with no build step

## Core Architecture

### Data Flow

```
User Action → Local Storage → Auto Sync → Supabase Database
                ↑
                └─ Sync Engine (js/sync.js)
```

### Key Components

1. **Main Application** (`index.html`)
   - Single HTML file containing all UI
   - Inline styles in `<style>` tags
   - Inline JavaScript in `<script>` tags

2. **Authentication Module** (`js/auth.js`)
   - `Auth` class handles all auth operations
   - Global instance: `window.auth`
   - Configuration: `config/supabase.json`

3. **Sync Engine** (`js/sync.js`)
   - `DataSync` class handles bidirectional sync
   - Global instance: `window.dataSync`
   - Supports offline queue and auto-sync every 5 minutes

4. **Core Logic** (`script.js`)
   - All feature implementations
   - Global variables for data state
   - Functions prefixed by feature (e.g., `initTodos()`, `addTodo()`)

### Data Types & Sync Strategies

| Data Type | localStorage Key | Merge Strategy |
|-----------|------------------|----------------|
| Health Records | `healthRecords` | Append (merge by date key) |
| Todos | `todos` | Append (ID-based deduplication) |
| Vocabulary Library | `vocabLibrary` | Replace (timestamp comparison) |
| My Vocabulary | `myVocab` | Append (ID-based deduplication) |
| Accounting Data | `accountingData` | Append (ID-based deduplication) |
| Mood Entries | `moodEntries` | Append |

### Sync Logic Highlights

**Critical Fix Applied (March 2026):**
- Uses **ID集合比较** instead of simple count comparison
- Correctly handles:
  - Local-only additions → use local data
  - Cloud-only additions → use cloud data
  - Deletions → detect via ID comparison (local < cloud AND no unique IDs)
  - Both have changes → merge with ID deduplication

**Bug Fix History:**
- Fixed: `triggerSync()` undefined error → commented out in `addTodo()`
- Fixed: Duplicate sync calls removed from `toggleTodo()` and `deleteTodo()`
- Fixed: Data import bypassing sync → now uses `saveTodos()`

## Common Development Tasks

### Git Workflow

```bash
# Check current status
git status

# Commit changes with descriptive message
git add .
git commit -m "Fix: 修复记账数据同步和统计显示问题"

# Push to main branch (triggers Cloudflare Pages deployment)
git push origin main

# View recent commits
git log --oneline -10

# Revert last commit if needed
git revert HEAD
git push origin main
```

**Note:** Pushing to `main` branch triggers automatic Cloudflare Pages deployment.

### Running the Application

**Local Development:**
```bash
# Using Python's built-in server
python3 -m http.server 8080

# Or Node.js
npx -y http-server -p 8080

# Or PHP
php -S localhost:8000
```

**No build step required** - just open `index.html` directly in browser.

### Testing Authentication Flow

```javascript
// 1. Check auth status
console.log('Authenticated:', window.auth.isAuthenticated());

// 2. Check sync status
console.log('Sync ready:', window.dataSync?.isReady);

// 3. Manual sync trigger
await window.dataSync.syncAll(['todos', 'healthRecords']);

// 4. Check local data
JSON.parse(localStorage.getItem('todos') || '[]');
```

### Debugging Sync Issues

**Check sync logs in console:**
```
[Sync] 开始同步: ["todos"]
[Sync] 下载数据: todos
[Sync] todos - 本地数据: (15项)
[Sync] todos - 云端数据: (15项)
[Sync] todos - 双方都有变化或数量相同，进行合并（本地独有:0，云端独有:0）
[Sync] todos - 合并结果: 15项
```

**Common sync patterns:**
- "本地有新增(X项)" → Local has unique data
- "云端有新增(X项)" → Cloud has unique data
- "检测到删除操作" → Deletion detected
- "双方都有变化" → Both have changes, merging

### Adding New Features

1. **Data Structure**: Use objects with `id` field (timestamp or UUID)
2. **Persistence**: Add to `localStorage` immediately
3. **Sync Trigger**: Call appropriate save function which auto-triggers sync
4. **Examples**: See `addTodo()`, `saveTodos()`, `saveHealth()`

**Example: Adding a new data type:**
```javascript
// 1. Define data structure
let myData = [];

// 2. Add save function
function saveMyData() {
    localStorage.setItem('myData', JSON.stringify(myData));
    // Sync will be auto-triggered by sync engine if configured
}

// 3. Add to dataTypes in js/sync.js
// See lines 17-48 for examples
```

### Modifying Sync Behavior

**Sync configuration is in `js/sync.js`:**
- Lines 17-48: `this.dataTypes` configuration object
- Lines 258-305: Append strategy logic (ID-based comparison)
- Lines 364-442: `mergeAppendData()` function

**Key files for sync:**
- `js/sync.js` - Main sync engine
- `js/auth.js` - Authentication
- `script.js` - Save functions that trigger sync

### Database Schema

**Tables:**
- `user_data` - User metadata
- `health_records` - Health tracking records
- `todos` - Todo items
- `vocab_library` - Vocabulary library
- `my_vocab` - Personal vocabulary
- `accounting_data` - Accounting records
- `mood_entries` - Mood journal entries

**Setup SQL:** `supabase_setup.sql`

**Row Level Security (RLS):**
- All tables use `user_id` for isolation
- Policies ensure users can only access their own data
- See lines 41-78 in `supabase_setup.sql`

### Deployment

**Platform:** Cloudflare Pages

**Build Command:** (none - static files)

**Output Directory:** `/`

**Setup:** See `CLOUDFLARE_DEPLOYMENT.md`

**Auto-deploy:** Connected to GitHub `main` branch

**Production URL:** `https://my-workplace.pages.dev` (or custom domain)

## Important Gotchas

### Critical Security Fix Applied (March 2026)

**Problem:** New users logging in were seeing previous user's data.

**Root Cause:** localStorage wasn't being cleared on logout/login.

**Fix Location:**
- `index.html` - `onLogin` callback (line ~2225)
- `index.html` - `onLogout` callback (line ~2239)
- `index.html` - `initAuthAndSync` (line ~2198)

**Fix:** Added localStorage cleanup on:
1. Logout (clears all user data before page reload)
2. Login (clears old data before sync)
3. Initialization (clears potential stale data)

**Data types cleared:**
- `todos`, `healthRecords`, `myVocab`, `vocabLibrary`, `accountingData`, `moodEntries`, `dailyQuote`
- All associated timestamps

### Registration Page Initialization

**Issue:** `initAuth()` wasn't being called on page load.

**Fix:** `register.html` line ~485 - Changed from DOMContentLoaded to IIFE:

```javascript
// Before (didn't work)
document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
});

// After (works)
(async () => {
    await initAuth();
})();
```

### Todo List Sync Behavior

**When deleting todos:**
- Local: Removes from `todos` array
- Sync: Uses ID comparison to detect deletion
- Result: Local (smaller count) overrides cloud (larger count)

**When adding todos:**
- Local: Pushes to `todos` array with `Date.now()` as ID
- Sync: Compares IDs, finds local-only items
- Result: Local data uploaded to cloud

**When editing todos:**
- Local: Updates in-place
- Sync: Treated as modification, not new item
- Result: Changes synced (ID remains same)

### Accounting Data Display

**Issue:** Added records not showing in statistics.

**Fix:** `saveAccountingData()` now:
1. Triggers sync to `accountingData` table
2. Re-renders stats if modal is open
3. Added detailed logging

**Location:** `script.js` line ~2455

### Cache-Busting for Deployments

**Issue:** Browser/CDN cache serving old JavaScript files.

**Fix:** Added version parameters:
```html
<script src="js/auth.js?v=1710576000"></script>
```

**Also added meta tags:**
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### Cloudflare Pages Configuration

**Critical file:** `_redirects` (in root directory)

```
# Cloudflare Pages Redirects
# 将 /config 路由到正确的处理方式

/config/* /config.html 200
```

**Important:**
- Status code must be 200, 301, 302, 303, 307, or 308
- Using 404 will cause deployment failure
- This file is required for proper routing on Cloudflare Pages

**Deployment commands:**
```bash
# Using Wrangler CLI
npm install -g wrangler
wrangler login
cd /Users/lijingcao/Desktop/workplace
wrangler pages deploy . --project-name=my-workplace

# Or use Git integration (automatic deployment on push to main)
git push origin main
```

**Checking deployment status:**
1. Visit Cloudflare Dashboard
2. Go to Pages → your project
3. View "Deployments" tab for latest deployment status
4. Check "Production URL" for live site

## File Organization

### Core Files
- `index.html` - Main application (~83KB)
- `script.js` - All business logic (~135KB)
- `style.css` - All styles (~18KB)

### Modular Components
- `js/auth.js` - Authentication module
- `js/sync.js` - Sync engine

### Configuration
- `config/supabase.json` - Supabase credentials (not in git)
- `config/supabase.json.example` - Template

### Documentation
- `QUICK_START.md` - Getting started guide
- `CLOUDFLARE_DEPLOYMENT.md` - Deployment instructions
- `AUTH_SETUP_GUIDE.md` - Auth setup details
- `IMPLEMENTATION_SUMMARY.md` - Technical summary
- `supabase_setup.sql` - Database schema

### Setup Files
- `login.html` - Login page
- `register.html` - Registration page
- `reset-password.html` - Password reset page

## Development Workflow

### Adding New Features

1. Create data structure in `script.js`
2. Add UI to `index.html`
3. Add styles to `style.css`
4. Add save function that updates localStorage
5. Update `js/sync.js` dataTypes configuration if sync is needed
6. Test with `python3 -m http.server 8080`

### Modifying Sync Behavior

**For array-type data (todos, accounting, etc.):**
- Edit `js/sync.js` lines 258-305
- Strategy: Uses ID-based comparison and deduplication
- Key function: `mergeAppendData()` (lines 364-442)

**For object-type data (health records):**
- Edit `js/sync.js` lines 306-314
- Strategy: Merge by key, timestamp comparison

### Testing Changes

```bash
# 1. Start local server
python3 -m http.server 8080

# 2. Open browser to http://localhost:8080

# 3. Test authentication flow
# - Register new user
# - Login
# - Add data
# - Check console for sync logs

# 4. Verify data persistence
# In console:
localStorage.getItem('todos')
```

### Testing Multi-Device Sync

**Test scenario:**
1. **Device A:** Register account, add todo items
2. **Device B:** Login with same account
3. **Verify:** Data appears on Device B
4. **Device B:** Add new todo, delete one todo
5. **Device A:** Refresh or wait for auto-sync
6. **Verify:** Changes synced to Device A

**Console commands to verify sync:**
```javascript
// Check sync engine status
console.log('Sync ready:', window.dataSync?.isReady);
console.log('Auth status:', window.auth?.isAuthenticated());

// Trigger manual sync
await window.dataSync.syncAll(['todos', 'healthRecords']);

// Check local vs cloud data
const localTodos = JSON.parse(localStorage.getItem('todos') || '[]');
console.log('Local todos:', localTodos.length);

// Check device ID
console.log('Device ID:', localStorage.getItem('deviceId'));
```

### Debugging Tips

**Check if sync is working:**
```javascript
// In browser console
console.log('Auth:', window.auth);
console.log('DataSync:', window.dataSync);
console.log('Sync status:', window.dataSync?.isReady);

// Check local data
Object.keys(localStorage).forEach(key => {
    if (key.includes('todo') || key.includes('health')) {
        console.log(key, JSON.parse(localStorage.getItem(key)));
    }
});
```

**Check Supabase connection:**
```javascript
// Verify Supabase client is initialized
console.log('Supabase client:', window.auth?.supabase);

// Check current user
console.log('Current user:', window.auth?.getCurrentUser());

// Check session
console.log('Session:', window.auth?.session);

// Test Supabase connection
async function testSupabaseConnection() {
    const { data, error } = await window.auth.supabase
        .from('todos')
        .select('*');

    if (error) {
        console.error('Supabase connection error:', error);
    } else {
        console.log('Supabase connection OK, data:', data);
    }
}

testSupabaseConnection();
```

**Monitor authentication state:**
```javascript
// Listen to auth state changes
window.auth.onLogin((user) => {
    console.log('User logged in:', user.email);
});

window.auth.onLogout(() => {
    console.log('User logged out');
});
```

**Check sync logs:**
- Look for `[Sync]` prefixed messages in console
- Check for errors in sync flow
- Verify `localData` and `cloudData.data` counts match

### Common Issues

**"认证服务未初始化" error:**
- Check if `window.auth.supabase` exists
- Verify `initAuth()` was called
- Check browser console for initialization errors

**Sync not triggering:**
- Verify `window.dataSync.isReady` is true
- Check if user is authenticated
- Look for `[Sync]` logs in console

**Data not syncing after logout/login:**
- Check localStorage cleanup in `index.html`
- Verify `onLogin` and `onLogout` callbacks
- Look for data cleanup logs in console

**Statistics showing "--" after adding records:**
- Check if accounting data was saved to localStorage
- Verify sync completed successfully
- Check if `renderAccountingStats()` was called
- Review console for `[saveAccountingData]` logs

**User data leakage (seeing other users' data):**
- Verify localStorage cleanup on login/logout
- Check `onLogin` callback in `index.html` (line ~2225)
- Check `onLogout` callback in `index.html` (line ~2239)
- Test: Register new account, login, verify no old data appears
- Critical security fix applied in March 2026

## Project History

### Recent Critical Fixes

1. **Security Fix (March 2026)** - User data isolation
2. **Sync Logic Fix** - ID-based comparison instead of count
3. **Registration Fix** - Immediate IIFE instead of DOMContentLoaded
4. **Cache Fix** - Version parameters and meta tags
5. **Accounting Stats Fix** - Auto-re-render on save

### Known Limitations

- Single-threaded JavaScript (no Web Workers)
- No build process (raw HTML/JS)
- No TypeScript (vanilla JS)
- No automated tests
- Manual deployment required for non-Cloudflare platforms

### Deployment

**Current:** Cloudflare Pages (auto-deploy from GitHub `main` branch)

**URL:** `https://my-workplace.pages.dev`

**Setup:** See `CLOUDFLARE_DEPLOYMENT.md`

**Rollback:** Use `git revert` to undo last commit if needed
