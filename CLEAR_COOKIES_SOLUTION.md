# Clear Cookies & Session Issues - Solution

## Problem
After dropping and recreating your database, old session cookies point to users that no longer exist, causing authentication errors.

## ✅ Solutions Implemented

### 1. Added Error Handling to Auth (Done)
- Added try-catch block in JWT callback
- Prevents complete auth failure if database is temporarily down
- Gracefully falls back to OAuth user info

---

## 🔥 Quick Fix: Clear Your Browser Cookies

### Method 1: Clear Cookies for Localhost (Recommended)

**Chrome/Edge:**
1. Click on the lock icon (🔒) in the address bar
2. Click "Cookies"
3. Find `localhost` in the list
4. Click "Remove" or "Clear"
5. Refresh the page (F5)

**Firefox:**
1. Press `F12` to open Developer Tools
2. Go to "Storage" tab
3. Click "Cookies" → "http://localhost:3000"
4. Right-click → "Delete All"
5. Refresh the page

---

### Method 2: Clear All Browser Data (Nuclear Option)

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cookies and other site data"
3. Time range: "All time"
4. Click "Clear data"

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Check "Cookies"
3. Time range: "Everything"
4. Click "Clear Now"

---

### Method 3: Use Incognito/Private Window

1. Open Incognito/Private window
2. Go to http://localhost:3000
3. Login with Google
4. Should work without old cookies

---

## 🛠️ Developer Solution: Force Cookie Clear on Login

If you want to automatically clear old cookies, add this to your login page:

### Update `src/app/(auth)/login/page.tsx`:

Add a "Clear Session" button:

```tsx
'use client';

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  const handleClearSession = () => {
    // Clear all cookies for localhost
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Refresh page
    router.refresh();
    alert("Session cleared! You can now login.");
  };

  return (
    <div>
      <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
        Sign in with Google
      </button>
      
      <button onClick={handleClearSession} className="text-sm text-gray-500">
        Having login issues? Clear session
      </button>
    </div>
  );
}
```

---

## 🔧 Backend Solution: Change Cookie Name

Force all users to get new cookies by changing the cookie name:

### Update `src/auth.ts`:

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token-v2"  // Changed: added -v2
      : "authjs.session-token-v2",           // Changed: added -v2
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
},
```

This forces everyone to get a fresh session cookie.

---

## 🎯 Permanent Solution: Add Logout API Route

Create a dedicated logout route that clears cookies:

### Create `src/app/api/auth/clear-session/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Clear all auth cookies
  const cookieStore = cookies();
  
  cookieStore.delete('authjs.session-token');
  cookieStore.delete('authjs.csrf-token');
  cookieStore.delete('__Secure-authjs.session-token');
  cookieStore.delete('__Secure-authjs.csrf-token');
  
  // Redirect to login
  return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
}
```

Then visit: http://localhost:3000/api/auth/clear-session

---

## 🧪 Test After Clearing Cookies

1. **Clear cookies** using one of the methods above
2. **Go to login page**: http://localhost:3000/login
3. **Click "Sign in with Google"**
4. **Should work now!**

---

## 🚨 If Still Not Working

### Check Database Connection:
```bash
node test-db.js
```

Should show:
```
✅ Connected successfully!
✅ Found X users
```

### Check Auth Configuration:
1. Verify `GOOGLE_CLIENT_ID` in `.env`
2. Verify `GOOGLE_CLIENT_SECRET` in `.env`
3. Verify `NEXTAUTH_URL=http://localhost:3000` in `.env`
4. Verify `NEXTAUTH_SECRET` is set in `.env`

### Restart Dev Server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 📋 Summary

**Quick Fix (Do This Now):**
1. Clear browser cookies for localhost
2. Restart dev server
3. Login again

**Permanent Fix (Done):**
- ✅ Added error handling to auth.ts
- ✅ JWT callback won't crash if DB is down
- ✅ Graceful fallback to OAuth user info

**Future Prevention:**
- Use incognito window for testing
- Clear cookies after dropping database
- Change cookie name version when needed

---

## ✅ Expected Result

After clearing cookies:
1. Login with Google → Works ✅
2. Redirected to /dashboard → Works ✅
3. Can access /dashboard/billing → Works ✅
4. No more authentication errors → Works ✅

---

**Try clearing your browser cookies now and login again!**
