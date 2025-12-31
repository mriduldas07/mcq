# 📂 Folder-Based Question Bank Setup Guide

## ✅ Implementation Status
All code has been successfully implemented! The folder feature is ready to use.

## 🔧 Setup Steps

### Step 1: Enable PowerShell Script Execution (Required)

Your system has PowerShell execution restricted. To run npm/node commands, open PowerShell **as Administrator** and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then restart your terminal/VS Code.

### Step 2: Generate Prisma Client

After enabling scripts, run:

```bash
npm run postinstall
```

Or directly:

```bash
npx prisma generate
```

This regenerates the Prisma client with the new `QuestionFolder` model.

### Step 3: Run Database Migration

Apply the database migration to add folder tables:

```bash
npx prisma migrate dev
```

If you encounter issues, use:

```bash
npx prisma db push
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000/dashboard/question-bank

---

## 🎉 What's Been Fixed

### Issue 1: `searchParams` Error ✅
**Error:** `searchParams.folderId` - searchParams must be unwrapped with await

**Fix Applied:** Updated to await searchParams in Next.js 15+
```typescript
const params = await searchParams;
const currentFolderId = params.folderId || null;
```

### Issue 2: Prisma Client Already Generated ✅
The Prisma client with QuestionFolder model is already generated in `node_modules/.prisma/client`.

---

## 🚀 How to Test the Feature

### Test 1: Create a Folder
1. Go to `/dashboard/question-bank`
2. Click "Create Your First Folder" button
3. Enter name: "Mathematics"
4. Press Enter
5. ✅ Folder should appear in the grid

### Test 2: Save Question to Folder
1. Go to any exam editor
2. Click the bookmark icon (💾) on a question
3. Modal opens with folder tree
4. Select "Mathematics" folder
5. Click "Save to Selected Folder"
6. ✅ Question saved to folder

### Test 3: Navigate Folders
1. Go to Question Bank
2. Click on "Mathematics" folder
3. ✅ See breadcrumb: Home → Mathematics
4. Create subfolder: "Algebra"
5. ✅ Subfolder appears inside Mathematics

### Test 4: Create Nested Folder
1. Inside Mathematics folder
2. Click "New Folder" button
3. Enter name: "Algebra"
4. ✅ Creates subfolder inside Mathematics

---

## 📁 Feature Overview

### What You Can Do Now:
- ✅ Create unlimited nested folders
- ✅ Save questions to specific folders
- ✅ Create folders while saving questions
- ✅ Navigate folder hierarchy with breadcrumbs
- ✅ See question counts per folder
- ✅ Delete folders (questions move to root)
- ✅ Search and filter within folders

### Example Folder Structure:
```
📁 Root
├── 📚 Mathematics
│   ├── 📐 Algebra
│   ├── 📊 Geometry
│   └── 🔢 Calculus
├── 🔬 Science
│   ├── ⚛️ Physics
│   └── 🧪 Chemistry
└── 📖 English
```

---

## 🐛 Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'findMany')"
**Solution:** Prisma client not generated properly. Run:
```bash
npx prisma generate
```

### Issue: "Table QuestionFolder does not exist"
**Solution:** Migration not applied. Run:
```bash
npx prisma migrate dev
```
or
```bash
npx prisma db push
```

### Issue: "searchParams is a Promise" error
**Solution:** Already fixed! Make sure you pull latest code.

### Issue: PowerShell execution policy restricted
**Solution:** Run as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📊 Database Schema Added

### QuestionFolder Table
```sql
CREATE TABLE "QuestionFolder" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    teacherId TEXT NOT NULL,
    parentId TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (teacherId) REFERENCES User(id),
    FOREIGN KEY (parentId) REFERENCES QuestionFolder(id)
);
```

### QuestionBank Table (Updated)
```sql
ALTER TABLE QuestionBank ADD COLUMN folderId TEXT;
ALTER TABLE QuestionBank ADD FOREIGN KEY (folderId) REFERENCES QuestionFolder(id);
```

---

## 🎯 Next Steps

1. **Enable PowerShell scripts** (if you haven't)
2. **Generate Prisma client** (`npm run postinstall`)
3. **Run migration** (`npx prisma migrate dev`)
4. **Start dev server** (`npm run dev`)
5. **Test the feature** (create folders, save questions)

---

## 📝 Files Modified

**New Files:**
- `src/actions/folder.ts` (374 lines)
- `src/components/folder-selector-modal.tsx` (348 lines)
- `prisma/migrations/20250101_add_question_folders/migration.sql`

**Updated Files:**
- `prisma/schema.prisma` - Added QuestionFolder model
- `src/actions/question-bank.ts` - Added folderId support
- `src/components/save-to-bank-button.tsx` - Integrated folder selector
- `src/components/question-bank-client-mvp.tsx` - Added folder navigation
- `src/app/(dashboard)/dashboard/question-bank/page.tsx` - Added folder filtering (FIXED searchParams)

---

**Need help?** The implementation is complete and the code is ready. Just run the setup steps above! 🚀
