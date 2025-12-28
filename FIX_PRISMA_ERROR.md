# Fix: Unknown argument `negativeMarking` Error

## Problem
The Prisma client hasn't been regenerated after the database migration. The dev server is using an old cached version that doesn't know about the new fields.

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` in your terminal where `npm run dev` is running.

### Step 2: Regenerate Prisma Client
Run this command:
```bash
npm run postinstall
```

This will regenerate the Prisma client with the new schema fields:
- `negativeMarking` (Boolean)
- `negativeMarks` (Float)
- `explanation` (String)
- `difficulty` (String)
- `ExamTemplate` model

### Step 3: Restart Dev Server
```bash
npm run dev
```

### One-Liner (Alternative)
Stop the server, then run:
```bash
npm run postinstall && npm run dev
```

---

## What This Does
- Clears the old Prisma client cache
- Reads the updated `schema.prisma` file
- Generates TypeScript types for the new fields
- Updates the Prisma client library

## Verification
After restarting, try creating an exam again. The error should be gone and you should be able to:
- ✅ Enable negative marking
- ✅ Set negative marks value
- ✅ Create exams with all new fields
- ✅ Use bulk import with advanced fields

---

## If Still Having Issues

### Clear Everything and Regenerate
```bash
# Stop dev server first!
rmdir /s /q node_modules\.prisma
rmdir /s /q .next
npm run postinstall
npm run dev
```

### Check Migration Status
```bash
npx prisma migrate status
```

Should show: "Database schema is up to date!"

### Verify Schema
Open `prisma/schema.prisma` and confirm these fields exist in the Exam model:
- `negativeMarking Boolean @default(false)`
- `negativeMarks Float @default(0)`

---

## Why This Happened
1. We added new fields to the Prisma schema
2. We ran database migrations (✓ Applied successfully)
3. But the Prisma client wasn't regenerated while the dev server was running
4. The dev server held file locks preventing regeneration

## Prevention
Always restart the dev server after schema changes!
