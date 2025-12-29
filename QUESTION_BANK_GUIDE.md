# Question Bank Management System

## 🎉 Complete Question Bank Feature!

Your MCQ platform now has a powerful question bank management system that allows teachers to organize, reuse, and manage their questions efficiently.

---

## 📚 What is the Question Bank?

The Question Bank is a centralized library where teachers can:
- Store reusable questions
- Organize by subject, topic, and tags
- Search and filter questions
- Import questions into multiple exams
- Track question usage statistics
- Perform bulk operations

---

## 🆕 Features Implemented

### 1. **Question Bank Database Model**
- ✅ Full question data (text, options, correct answer)
- ✅ Question settings (marks, negative marks, time limit)
- ✅ Explanations and difficulty levels
- ✅ Organization (subject, topic, tags)
- ✅ Usage tracking (count, last used)
- ✅ Public sharing capability

### 2. **Question Bank Page** (`/dashboard/question-bank`)
- ✅ Beautiful, responsive interface
- ✅ Statistics dashboard (4 cards)
- ✅ Advanced search functionality
- ✅ Multiple filter options
- ✅ Bulk selection and operations
- ✅ Question preview cards

### 3. **Search & Filters**
- ✅ **Text search** - Search question text
- ✅ **Difficulty filter** - Easy, Medium, Hard
- ✅ **Subject filter** - Filter by subject
- ✅ **Tag filter** - Multiple tag selection
- ✅ **Clear filters** - Reset all filters

### 4. **Organization System**
- ✅ **Subjects** - Categorize by subject (Math, Physics, etc.)
- ✅ **Topics** - Sub-categorize within subjects
- ✅ **Tags** - Flexible tagging system
- ✅ **Difficulty levels** - Easy, Medium, Hard

### 5. **Import/Export Features**
- ✅ **Save to Bank** - Save questions from exams
- ✅ **Import to Exam** - Add bank questions to exams
- ✅ **Bulk import** - Multiple questions at once
- ✅ **Usage tracking** - Auto-increment usage count

### 6. **Bulk Operations**
- ✅ **Select multiple** - Checkbox selection
- ✅ **Select all/Deselect all** - Quick selection
- ✅ **Bulk delete** - Delete multiple questions
- ✅ **Bulk duplicate** - Copy multiple questions
- ✅ **Bulk tagging** - Add tags to multiple questions

### 7. **Statistics & Analytics**
- ✅ **Total questions** - Count of questions
- ✅ **Total usage** - Times questions used
- ✅ **Subject distribution** - Questions per subject
- ✅ **Difficulty breakdown** - Easy/Medium/Hard split
- ✅ **Usage per question** - Individual usage tracking

---

## 🚀 How to Use

### Access the Question Bank

1. **Navigate** to `/dashboard/question-bank`
2. Or click **"Question Bank"** in the sidebar navigation

### Adding Questions to Bank

#### Method 1: From Existing Exam
1. Go to exam edit page
2. Find the question you want to save
3. Click the **bookmark icon** (💾) on the question
4. Question is saved to your bank!

#### Method 2: Bulk Import
1. Use the bulk import feature on exam page
2. Questions imported to exam can be saved individually

### Using Questions from Bank

1. **Go to exam edit page**
2. **Click "From Bank"** button (next to "Bulk Import")
3. **Browse your question bank**
4. **Select questions** using checkboxes
5. **Click "Import X Questions"**
6. Questions are added to your exam!

### Organizing Questions

#### Add Tags
1. Select questions using checkboxes
2. Click **"Add Tags"** in bulk actions bar
3. Enter tags (comma-separated)
4. Tags are added to all selected questions

#### Set Subject/Topic
1. Click **Edit** on a question
2. Set subject and topic
3. Save changes

### Searching & Filtering

#### Search
- Type in search box at top
- Searches question text
- Real-time filtering

#### Filter by Difficulty
1. Click **"Filters"** button
2. Select difficulty: All, Easy, Medium, Hard
3. Questions filter automatically

#### Filter by Subject
1. Click **"Filters"** button
2. Select subject from dropdown
3. View questions for that subject

#### Filter by Tags
1. Click **"Filters"** button
2. Click tags to toggle selection
3. Shows questions with ALL selected tags

### Bulk Operations

#### Delete Multiple Questions
1. Select questions using checkboxes
2. Click **"Select All"** to select all visible
3. Click **"Delete"** in bulk actions bar
4. Confirm deletion

#### Duplicate Questions
1. Select questions
2. Click **"Duplicate"**
3. Copies are created with "(Copy)" suffix

---

## 📊 Statistics Dashboard

### Total Questions Card
- Shows total number of questions in your bank
- Updates in real-time

### Total Usage Card
- Shows how many times questions have been used
- Helpful for identifying popular questions

### Subjects Card
- Shows number of unique subjects
- Helps track content coverage

### Difficulty Split Card
- Shows breakdown: Easy, Medium, Hard
- Color-coded badges
- Quick visual reference

---

## 🎨 Question Card Layout

Each question displays:
- ✅ **Question text** - The actual question
- ✅ **Answer options** - All options with correct answer highlighted (green badge)
- ✅ **Difficulty badge** - Color-coded (green=easy, blue=medium, red=hard)
- ✅ **Subject & topic** - Organization metadata
- ✅ **Marks** - Points for correct answer
- ✅ **Negative marks** - Deduction if any
- ✅ **Time limit** - If set
- ✅ **Usage count** - "Used Xx" indicator
- ✅ **Tags** - All associated tags
- ✅ **Explanation** - Expandable section if present
- ✅ **Action buttons** - Edit, Copy, Delete

---

## 🔧 Database Schema

```prisma
model QuestionBank {
  id            String   @id @default(cuid())
  teacherId     String
  teacher       User     @relation(fields: [teacherId], references: [id])
  
  // Question content
  text          String
  options       Json
  correctOption String
  
  // Settings
  marks         Int      @default(1)
  negativeMarks Float    @default(0)
  timeLimit     Int?
  explanation   String?
  difficulty    String   @default("MEDIUM")
  
  // Organization
  subject       String?
  topic         String?
  tags          String[]
  
  // Metadata
  usageCount    Int      @default(0)
  lastUsed      DateTime?
  isPublic      Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([teacherId])
  @@index([subject])
  @@index([difficulty])
}
```

---

## 🎯 Use Cases

### 1. **Build Question Library**
- Create exams as usual
- Save good questions to bank
- Build reusable question library over time

### 2. **Create Question Variations**
- Duplicate existing questions
- Modify for different difficulty
- Create question sets

### 3. **Subject-Based Organization**
- Tag questions by subject
- Filter by subject when creating exams
- Ensure balanced content coverage

### 4. **Reuse Across Multiple Exams**
- Import same questions to different exams
- Track which questions are popular
- Identify questions needing updates

### 5. **Quick Exam Creation**
- Filter by subject/difficulty
- Select multiple questions
- Import to new exam instantly

### 6. **Question Quality Management**
- Track usage statistics
- Identify unused questions
- Review and update popular questions

---

## 📝 Server Actions

### Available Actions

```typescript
// Add question to bank
addToQuestionBankAction(data)

// Update question
updateQuestionBankAction(questionId, data)

// Delete questions
deleteQuestionBankAction(questionIds)

// Add tags
addTagsToQuestionsAction(questionIds, tags)

// Duplicate questions
duplicateQuestionsAction(questionIds)

// Import to exam
importFromQuestionBankAction(examId, questionIds)

// Save from exam
saveToQuestionBankAction(examId, questionId)
```

---

## 🎨 UI Components

### New Components Created

1. **`question-bank-client.tsx`** - Main question bank interface
2. **`save-to-bank-button.tsx`** - Button to save question from exam
3. **`import-from-bank-button.tsx`** - Button to open import dialog
4. **`import-from-bank-dialog.tsx`** - Dialog to select questions for import

### New Pages

1. **`/dashboard/question-bank/page.tsx`** - Question bank main page

### API Routes

1. **`/api/question-bank/route.ts`** - Fetch questions for import dialog

---

## 💡 Best Practices

### For Teachers

1. **Consistent Tagging**
   - Use standard tag names
   - Create tag naming convention
   - Example: "algebra-basics", "physics-mechanics"

2. **Set Subjects & Topics**
   - Always set subject field
   - Use topic for sub-categorization
   - Makes filtering much easier

3. **Add Explanations**
   - Include detailed explanations
   - Helps students learn
   - Reference for you later

4. **Regular Cleanup**
   - Review unused questions
   - Delete or improve low-quality questions
   - Keep bank organized

5. **Track Usage**
   - Check which questions are popular
   - Revise frequently used questions
   - Update based on student feedback

### For Platform Administrators

1. **Monitor Bank Size**
   - Track total questions per teacher
   - Set limits if needed
   - Optimize database queries

2. **Enable Public Sharing** (Future)
   - Let teachers share questions
   - Build community question library
   - Quality control process

---

## 🔮 Future Enhancements

Potential features to add:

- [ ] Question categories (multiple choice, true/false, etc.)
- [ ] Image support in questions
- [ ] Formula/LaTeX rendering
- [ ] Question difficulty auto-detection
- [ ] Collaborative question sharing
- [ ] Question reviews/ratings
- [ ] Export to PDF/Word
- [ ] Question versioning
- [ ] AI-powered question suggestions
- [ ] Question performance analytics

---

## 🐛 Troubleshooting

### Questions Not Showing
- Check if you're logged in
- Verify questions belong to your account
- Try clearing filters

### Import Not Working
- Ensure exam is in DRAFT status
- Check if questions are selected
- Verify exam ownership

### Search Not Finding Questions
- Check spelling
- Try partial search
- Clear filters and try again

### Usage Count Not Updating
- Count updates when imported to exam
- Refresh page to see latest count
- Check database connection

---

## 📊 Performance Considerations

### Optimizations Implemented

- ✅ **Database indexes** on teacherId, subject, difficulty
- ✅ **Client-side filtering** for instant response
- ✅ **Pagination ready** (can add limit/offset)
- ✅ **Efficient queries** with select statements
- ✅ **JSON serialization** for proper data transfer

### Recommended Limits

- **Questions per teacher**: 10,000 (can increase)
- **Tags per question**: 10 recommended
- **Bulk operations**: 100 questions max
- **Import to exam**: 100 questions max

---

## 🎓 Training Materials

### For Teachers

**Video Tutorial** (Create one showing):
1. Saving questions to bank
2. Organizing with tags
3. Searching and filtering
4. Importing to exams
5. Bulk operations

**Quick Start Guide**:
1. Create an exam with questions
2. Save 2-3 questions to bank
3. Add tags and subject
4. Create new exam
5. Import questions from bank

---

## 🚀 Integration Points

### With Other Features

**Exam Creation**
- Import from bank button
- Quick question addition
- Pre-filled question data

**Exam Editing**
- Save to bank button on each question
- One-click save
- Preserves all question data

**Bulk Import**
- Questions can be saved to bank after import
- Build library from imported questions

**Templates**
- Can include default subjects/tags
- Pre-configured organization

---

## 📈 Success Metrics

Track these to measure adoption:

- **Bank size** - Questions per teacher
- **Usage rate** - % of questions used from bank
- **Reuse rate** - Average uses per question
- **Organization** - % with subjects/tags
- **Time saved** - Less time creating exams

---

## ✅ Summary

**Files Created:**
- `prisma/migrations/add_question_bank/migration.sql`
- `src/app/(dashboard)/dashboard/question-bank/page.tsx`
- `src/components/question-bank-client.tsx`
- `src/actions/question-bank.ts`
- `src/components/save-to-bank-button.tsx`
- `src/components/import-from-bank-button.tsx`
- `src/components/import-from-bank-dialog.tsx`
- `src/app/api/question-bank/route.ts`

**Files Modified:**
- `prisma/schema.prisma`
- `src/components/dashboard-nav.tsx`
- `src/app/(dashboard)/dashboard/exams/[examId]/page.tsx`

**Features:**
- ✅ Question bank database
- ✅ Search & filters
- ✅ Organization system
- ✅ Import/export
- ✅ Bulk operations
- ✅ Statistics & analytics
- ✅ Navigation integration

**Status:** ✅ **Production Ready!**

---

**Happy Question Banking! 📚🎓**
