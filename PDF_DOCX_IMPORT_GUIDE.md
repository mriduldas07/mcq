# PDF & DOCX Question Import Guide

## 🎉 New Feature: Import Questions from Documents!

You can now import questions directly from PDF and Word documents, in addition to JSON and CSV formats.

---

## 📄 Supported Formats

### 1. **PDF Files (.pdf)**
- Upload scanned or digital PDFs
- Text-based PDFs work best
- Automatically extracts and parses questions

### 2. **Word Documents (.docx, .doc)**
- Microsoft Word documents
- Google Docs (download as .docx)
- Any DOCX-compatible editor

### 3. **JSON Files (.json)**
- Structured data format
- Full control over all fields
- Best for programmatic generation

### 4. **CSV Files (.csv)**
- Spreadsheet format
- Easy to create in Excel/Google Sheets
- Good for simple questions

---

## 📝 Document Format

### Basic Format

```
Q1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B
```

### With Optional Fields

```
Q1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B
Marks: 2
Negative: 0.5
Time: 60
Difficulty: MEDIUM
Explanation: Paris is the capital and largest city of France.
```

---

## 🎯 Format Rules

### 1. Question Markers
- Start with `Q` followed by number: `Q1.`, `Q2.`, etc.
- Or just numbers: `1.`, `2.`, etc.

### 2. Options Format
Supports multiple formats:
- `A) Option text` (recommended)
- `A. Option text`
- `(A) Option text`
- `A: Option text`

### 3. Answer Line
- Must include `Answer:` followed by letter
- Example: `Answer: B`
- Also accepts: `Correct: B` or `Ans: B`

### 4. Optional Fields

| Field | Format | Default | Description |
|-------|--------|---------|-------------|
| Marks | `Marks: 2` | 1 | Points for correct answer |
| Negative | `Negative: 0.5` | 0 | Points deducted for wrong answer |
| Time | `Time: 60` | None | Time limit in seconds |
| Difficulty | `Difficulty: MEDIUM` | MEDIUM | EASY, MEDIUM, or HARD |
| Explanation | `Explanation: ...` | None | Shown after submission |

---

## 🚀 How to Use

### Step 1: Create Your Document

1. **Open Word or any text editor**
2. **Copy the template** from `public/templates/questions_template.txt`
3. **Write your questions** following the format
4. **Save as PDF or DOCX**

### Step 2: Import to Platform

1. **Go to exam edit page** (`/dashboard/exams/[examId]`)
2. **Click "Bulk Import"** button
3. **Select PDF or DOCX** format tab
4. **Upload your file**
5. **Review parsed questions**
6. **Click "Import"**

### Step 3: Verify

- Questions appear in the exam
- Check all fields are correct
- Edit any question if needed
- Publish when ready

---

## 💡 Tips for Best Results

### ✅ Do's

- **Use consistent formatting** throughout your document
- **Leave blank lines** between questions for clarity
- **Test with 2-3 questions** first before importing many
- **Use simple, clear text** - avoid fancy formatting
- **Number questions sequentially** (Q1, Q2, Q3...)
- **Specify one correct answer** per question

### ❌ Don'ts

- Don't use tables or complex layouts
- Don't mix different option formats
- Don't skip question numbers
- Don't use images (text only)
- Don't use special characters in question markers
- Don't forget the Answer line

---

## 🎨 Sample Questions

### Example 1: Basic Question
```
Q1. What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Answer: B
```

### Example 2: With Marks
```
Q2. Solve: 5x + 3 = 18
A) x = 2
B) x = 3
C) x = 4
D) x = 5
Answer: B
Marks: 3
```

### Example 3: Full Featured
```
Q3. What is the speed of light?
A) 3 × 10^8 m/s
B) 3 × 10^6 m/s
C) 3 × 10^10 m/s
D) 3 × 10^7 m/s
Answer: A
Marks: 5
Negative: 1
Time: 90
Difficulty: HARD
Explanation: The speed of light in vacuum is approximately 299,792,458 meters per second, commonly rounded to 3 × 10^8 m/s.
```

---

## 🔧 Technical Details

### Parser Features

- **Flexible formatting** - handles various option styles
- **Automatic validation** - checks for required fields
- **Error reporting** - clear messages for issues
- **Batch processing** - handles many questions at once
- **Transaction safety** - all or nothing import

### Supported Options

- **2-4 options per question** (A-D)
- **Multiple correct answer formats** 
- **Optional metadata fields**
- **Unicode support** for international characters

### Limitations

- **Maximum 100 questions** per import
- **Text-based only** - no images
- **Draft exams only** - can't import to published exams
- **Plain text format** - complex formatting may be lost

---

## 🐛 Troubleshooting

### "No valid questions found"
- Check question numbering (Q1., Q2., etc.)
- Ensure Answer line is present
- Verify options have proper format (A), B), etc.)

### "Failed to parse PDF"
- Make sure PDF is text-based, not scanned image
- Try converting to DOCX first
- Check if text can be selected/copied in PDF

### "Validation errors"
- Check that correct answer exists in options
- Ensure all required fields are present
- Verify option letters match answer letter

### "Question text too short"
- Make sure question has substantial text
- Don't just use question number
- Add full question before options

---

## 📊 Example Use Cases

### 1. **Converting Past Papers**
- Scan or type old exam papers
- Format in Word document
- Import all questions at once
- Build question bank

### 2. **Collaborative Question Writing**
- Multiple teachers write questions
- Share Word document
- Compile and import together
- Review and publish

### 3. **Importing from Other Systems**
- Export questions from old system
- Format as per template
- Import to new platform
- Migrate entire question bank

### 4. **Creating Mock Tests**
- Write questions in familiar Word
- Add comprehensive explanations
- Import and test quickly
- Iterate based on feedback

---

## 📚 Additional Resources

### Template File
- Location: `public/templates/questions_template.txt`
- Contains: Format rules, examples, tips
- Use: Copy and modify for your questions

### Format Examples
- Basic questions
- Questions with marks
- Questions with negative marking
- Questions with time limits
- Questions with explanations

### Video Tutorial (Coming Soon)
- Step-by-step walkthrough
- Best practices
- Common mistakes to avoid

---

## 🎓 Best Practices

### For Teachers

1. **Start Small** - Test with a few questions first
2. **Be Consistent** - Use same format throughout
3. **Add Explanations** - Help students learn
4. **Set Difficulty** - For analytics and adaptive learning
5. **Review Imports** - Always check parsed questions
6. **Keep Backups** - Save your Word/PDF files

### For Students (Information)

- Questions may come from imported documents
- Explanations available after submission
- Some questions may have time limits
- Difficulty levels indicate challenge

---

## 🚀 What's Next?

### Planned Features

- [ ] Image support in questions
- [ ] Bulk export to PDF/DOCX
- [ ] Question bank management
- [ ] OCR for scanned PDFs
- [ ] Formula rendering (LaTeX)
- [ ] Rich text formatting

### Current Capabilities

- ✅ PDF import
- ✅ DOCX import
- ✅ JSON import
- ✅ CSV import
- ✅ Validation
- ✅ Preview before import
- ✅ Error handling

---

## 💬 Support

### Need Help?

- Check this guide first
- Review template file
- Test with sample questions
- Contact support if issues persist

### Report Issues

- Provide sample file
- Describe error message
- Share question format used
- Include screenshots

---

**Happy Importing! 📚**

Now you can quickly build your question bank from existing documents!
