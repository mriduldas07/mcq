# Fix for Exam Creation Error

## Problem Identified

The Prisma schema file (`prisma/schema.prisma`) contains fields like `passPercentage`, `shuffleQuestions`, `shuffleOptions`, `showResultsImmediately`, `requirePassword`, `examPassword`, and `maxAttempts` for the `Exam` model, but these fields were never added to the actual database.

The error occurred because:
1. The schema was updated with new fields
2. The database was not migrated to add these columns
3. The Prisma Client was not regenerated

## Solution

Follow these steps to fix the issue:

### Step 1: Apply the Database Migration

Run this command to apply the migration that adds the missing fields:

```bash
npx prisma migrate deploy
```

Or if you're in development and want Prisma to handle it automatically:

```bash
npx prisma migrate dev
```

### Step 2: Regenerate Prisma Client

After the migration is applied, regenerate the Prisma Client:

```bash
npx prisma generate
```

### Step 3: Restart Your Development Server

Stop your development server (Ctrl+C) and restart it:

```bash
npm run dev
```

## What Was Fixed in the Code

In addition to the database migration, I also improved the `createExamAction` function in `src/actions/exam.ts`:

1. ✅ **Better error handling** - Now shows detailed error messages instead of generic "Failed to create exam"
2. ✅ **Input validation** - Validates all numeric inputs (duration, maxViolations, passPercentage, maxAttempts)
3. ✅ **Fixed checkbox handling** - Properly handles checked/unchecked states for `showResultsImmediately`
4. ✅ **Fixed empty string handling** - Converts empty strings to `null` for optional fields
5. ✅ **Added debug logging** - Shows what data is being sent to the database

## Migration File Created

Created: `prisma/migrations/add_exam_advanced_settings/migration.sql`

This migration adds the following fields to the `Exam` table:
- `scheduledStartTime` (nullable timestamp)
- `scheduledEndTime` (nullable timestamp)
- `allowLateSubmission` (boolean, default false)
- `passPercentage` (integer, default 50)
- `shuffleQuestions` (boolean, default false)
- `shuffleOptions` (boolean, default false)
- `showResultsImmediately` (boolean, default true)
- `requirePassword` (boolean, default false)
- `examPassword` (nullable text)
- `maxAttempts` (nullable integer)

## After Applying the Fix

Once you've run the commands above, try creating an exam again. It should work correctly now!
