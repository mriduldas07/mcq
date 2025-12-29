# Fix: Cannot read properties of undefined (reading 'findMany')

## Problem
The Prisma client doesn't have the `QuestionBank` model yet. The database migration was applied, but the Prisma client needs to be regenerated to include the new model.

## Solution

### Step 1: Stop Dev Server
Press `Ctrl+C` in your terminal where `npm run dev` is running.

### Step 2: Regenerate Prisma Client
Run this command:
```bash
npx prisma generate
```

This will:
- Read the updated `schema.prisma` file
- Generate TypeScript types for QuestionBank
- Update the Prisma client library
- Add `prisma.questionBank.findMany()` and other methods

### Step 3: Restart Dev Server
```bash
npm run dev
```

### One-Liner (Alternative)
Stop the server, then run:
```bash
npx prisma generate && npm run dev
```

---

## Verification

After restarting, navigate to `/dashboard/question-bank`. The error should be gone and you should see:
- Empty question bank page (if no questions yet)
- Statistics cards showing 0 questions
- Search and filter interface
- "Add Question" button

---

## Why This Happened

1. We added `QuestionBank` model to `schema.prisma` ✓
2. We ran the database migration ✓
3. But the Prisma client wasn't regenerated while dev server was running ✗
4. The dev server held file locks preventing regeneration

## Prevention

Always restart the dev server after schema changes:
```bash
# When you modify schema.prisma:
1. Stop dev server (Ctrl+C)
2. Run: npx prisma migrate dev
3. Run: npm run dev
```

---

## Still Having Issues?

### Clear Everything
```bash
# Stop dev server first!
rmdir /s /q node_modules\.prisma
rmdir /s /q .next
npx prisma generate
npm run dev
```

### Verify Schema
Open `prisma/schema.prisma` and confirm the QuestionBank model exists:
```prisma
model QuestionBank {
  id            String   @id @default(cuid())
  teacherId     String
  // ... more fields
}
```

### Check Migration Status
```bash
npx prisma migrate status
```

Should show all migrations applied including `add_question_bank`.

---

## Expected Result

Once fixed:
✅ Question Bank page loads without errors
✅ Can add questions to bank
✅ Can search and filter
✅ Can import/export questions
✅ Statistics show correct data

---

**After fixing, you'll have access to the complete Question Bank system!** 🎉
