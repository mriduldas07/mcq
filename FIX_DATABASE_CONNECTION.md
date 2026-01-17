# Fix Database Connection Issue

## Problem
Your Neon database at `ep-round-hall-adqrf37m-pooler.c-2.us-east-1.aws.neon.tech` is not reachable.

Error:
```
Can't reach database server at `ep-round-hall-adqrf37m-pooler.c-2.us-east-1.aws.neon.tech:5432`
```

---

## Most Likely Cause: Neon Database is Paused

**Neon free tier databases automatically pause after 5 minutes of inactivity.**

### ✅ Solution: Wake Up Your Database

1. **Go to Neon Console:**
   - Visit: https://console.neon.tech/
   - Login with your account

2. **Find Your Project:**
   - Look for project: `ep-round-hall-adqrf37m`
   - Click on it

3. **Wake Up Database:**
   - The database will automatically wake up when you click on it
   - Wait 10-20 seconds for it to start
   - You'll see a green "Active" status

4. **Test Connection:**
   - Open Command Prompt (not PowerShell)
   - Run: `node node_modules/.bin/prisma db pull`
   - If successful, you'll see: "Introspecting based on datasource..."

5. **Restart Your Dev Server:**
   - Stop the current server (Ctrl+C)
   - Run: `npm run dev`
   - Try accessing `/dashboard/billing` again

---

## Alternative: Get Fresh Connection String

If waking up doesn't work, get a new connection string:

### Step 1: Get Connection String from Neon

1. Go to https://console.neon.tech/
2. Click on your project `ep-round-hall-adqrf37m`
3. Click "Connection Details" or "Connection String"
4. Copy the **Pooled connection** string (it includes `pooler.` in the URL)
5. It should look like:
   ```
   postgresql://neondb_owner:PASSWORD@ep-round-hall-adqrf37m-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
   ```

### Step 2: Update .env File

1. Open `.env` file in your project root
2. Find the line with `DATABASE_URL=`
3. Replace the entire value with your new connection string
4. **Important:** Make sure there are NO spaces and it's all on one line
5. Save the file

Example:
```env
DATABASE_URL="postgresql://neondb_owner:npg_xxxx@ep-round-hall-adqrf37m-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Run Migration After Database is Connected

Once your database is accessible, you need to run the migration:

### Using Command Prompt (Not PowerShell):

```bash
node node_modules/.bin/prisma migrate dev --name add_user_subscription_fields
```

Or simply:

```bash
npm run prisma:migrate
```

If you don't have this script, add it to `package.json`:
```json
"scripts": {
  "prisma:migrate": "prisma migrate dev",
  "prisma:generate": "prisma generate"
}
```

---

## PowerShell Execution Policy Issue

If you need to use PowerShell, enable script execution:

### Option 1: Use Command Prompt Instead
- Press `Win + R`
- Type `cmd`
- Run your commands there

### Option 2: Enable PowerShell Scripts (Admin)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Option 3: Bypass for Single Command
```powershell
powershell -ExecutionPolicy Bypass -Command "npx prisma generate"
```

---

## Quick Troubleshooting Checklist

- [ ] Database is active in Neon Console (not paused)
- [ ] Connection string in `.env` is correct
- [ ] No extra spaces or line breaks in `DATABASE_URL`
- [ ] `sslmode=require` is at the end of the connection string
- [ ] Internet connection is working
- [ ] Firewall/VPN is not blocking Neon
- [ ] Dev server restarted after any `.env` changes

---

## Testing Database Connection

### Method 1: Using Node (works without PowerShell issues)

Create a file `test-db.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run it:
```bash
node test-db.js
```

### Method 2: Using Prisma Studio

```bash
node node_modules/.bin/prisma studio
```

This opens a GUI at http://localhost:5555 to browse your database.

---

## After Database is Connected

1. **Generate Prisma Client:**
   ```bash
   node node_modules/.bin/prisma generate
   ```

2. **Run Migration:**
   ```bash
   node node_modules/.bin/prisma migrate dev --name add_user_subscription_fields
   ```

3. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

4. **Test Billing Page:**
   - Go to http://localhost:3000/dashboard/billing
   - Should load without errors

---

## Common Errors and Solutions

### Error: "Can't reach database server"
**Solution:** Database is paused. Wake it up in Neon Console.

### Error: "SSL connection is required"
**Solution:** Add `?sslmode=require` to end of DATABASE_URL

### Error: "Invalid connection string"
**Solution:** Check for spaces, quotes, or line breaks in `.env`

### Error: "authentication failed"
**Solution:** Password in connection string is incorrect. Get fresh one from Neon.

### Error: "npx is not recognized"
**Solution:** Use `node node_modules/.bin/prisma` instead of `npx prisma`

---

## Need Help?

If none of these work:

1. **Check Neon Status:**
   - https://neon.tech/status
   - Make sure Neon services are operational

2. **Check Your Internet:**
   - Try accessing https://neon.tech/
   - Try pinging: `ping ep-round-hall-adqrf37m-pooler.c-2.us-east-1.aws.neon.tech`

3. **Contact Neon Support:**
   - https://neon.tech/docs/introduction/support
   - They can check if your database has issues

---

## Summary

**Most likely fix:**
1. Go to https://console.neon.tech/
2. Click on your project to wake it up
3. Wait 20 seconds
4. Restart: `npm run dev`
5. Try again

**This should resolve 95% of "Can't reach database" errors with Neon!**
