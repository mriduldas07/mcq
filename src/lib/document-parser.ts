/**
 * Document Parser for PDF and DOCX files
 * Extracts questions from formatted documents
 */

interface ParsedQuestion {
  text: string;
  options: { id: string; text: string }[];
  correctOption: string;
  marks?: number;
  negativeMarks?: number;
  timeLimit?: number;
  explanation?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

/**
 * Expected format in documents:
 * 
 * Q1. Question text here?
 * A) Option 1
 * B) Option 2
 * C) Option 3
 * D) Option 4
 * Answer: B
 * Marks: 2
 * Negative: 0.5
 * Time: 60
 * Difficulty: MEDIUM
 * Explanation: Optional explanation here
 * 
 * Q2. Next question...
 */

export async function parsePDF(file: File): Promise<ParsedQuestion[]> {
  try {
    // Dynamic import for client-side only
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs') as any;
    
    // Set worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return parseQuestionText(fullText);
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file. Please check the format.');
  }
}

export async function parseDOCX(file: File): Promise<ParsedQuestion[]> {
  try {
    // Dynamic import for client-side only
    const mammoth = await import('mammoth/mammoth.browser');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value) {
      throw new Error('No text found in document');
    }
    
    return parseQuestionText(result.value);
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file. Please check the format.');
  }
}

/**
 * Parse text content to extract questions
 * Supports flexible formatting
 */
function parseQuestionText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Split by question markers (Q1., Q2., etc. or just numbers)
  const questionBlocks = text.split(/Q\d+\.|^\d+\./gm).filter(block => block.trim());
  
  for (let block of questionBlocks) {
    try {
      const question = parseQuestionBlock(block.trim());
      if (question) {
        questions.push(question);
      }
    } catch (error) {
      console.warn('Skipping invalid question block:', error);
      continue;
    }
  }
  
  if (questions.length === 0) {
    throw new Error('No valid questions found in document');
  }
  
  return questions;
}

/**
 * Parse a single question block
 */
function parseQuestionBlock(block: string): ParsedQuestion | null {
  // Extract question text (everything before first option)
  const optionMatch = block.match(/[A-D]\)|\([A-D]\)|[A-D]\.|[A-D]:/i);
  if (!optionMatch) return null;
  
  const questionText = block.substring(0, optionMatch.index).trim();
  if (!questionText) return null;
  
  // Extract options (A, B, C, D)
  const options: { id: string; text: string }[] = [];
  const optionRegex = /[A-D]\)\s*([^\n]+)|[A-D]\.\s*([^\n]+)|[A-D]:\s*([^\n]+)|\([A-D]\)\s*([^\n]+)/gi;
  let match;
  let optionIndex = 0;
  
  while ((match = optionRegex.exec(block)) !== null && optionIndex < 4) {
    const optionText = (match[1] || match[2] || match[3] || match[4] || '').trim();
    if (optionText) {
      options.push({
        id: `opt_${optionIndex + 1}`,
        text: optionText
      });
      optionIndex++;
    }
  }
  
  if (options.length < 2) return null;
  
  // Extract answer
  const answerMatch = block.match(/Answer:\s*([A-D])|Correct:\s*([A-D])|Ans:\s*([A-D])/i);
  if (!answerMatch) return null;
  
  const answerLetter = (answerMatch[1] || answerMatch[2] || answerMatch[3]).toUpperCase();
  const answerIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
  
  if (answerIndex < 0 || answerIndex >= options.length) return null;
  
  const correctOption = options[answerIndex].id;
  
  // Extract optional fields
  const marksMatch = block.match(/Marks?:\s*(\d+)/i);
  const marks = marksMatch ? parseInt(marksMatch[1]) : 1;
  
  const negativeMatch = block.match(/Negative:\s*([\d.]+)/i);
  const negativeMarks = negativeMatch ? parseFloat(negativeMatch[1]) : 0;
  
  const timeMatch = block.match(/Time:\s*(\d+)/i);
  const timeLimit = timeMatch ? parseInt(timeMatch[1]) : undefined;
  
  const difficultyMatch = block.match(/Difficulty:\s*(EASY|MEDIUM|HARD)/i);
  const difficulty = difficultyMatch ? (difficultyMatch[1].toUpperCase() as "EASY" | "MEDIUM" | "HARD") : "MEDIUM";
  
  const explanationMatch = block.match(/Explanation:\s*(.+?)(?=Q\d+\.|$)/i);
  const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;
  
  return {
    text: questionText,
    options,
    correctOption,
    marks,
    negativeMarks,
    timeLimit,
    explanation,
    difficulty,
  };
}

/**
 * Validate parsed questions
 */
export function validateQuestions(questions: ParsedQuestion[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  questions.forEach((q, index) => {
    if (!q.text || q.text.length < 5) {
      errors.push(`Question ${index + 1}: Text is too short`);
    }
    
    if (!q.options || q.options.length < 2) {
      errors.push(`Question ${index + 1}: Must have at least 2 options`);
    }
    
    if (!q.correctOption) {
      errors.push(`Question ${index + 1}: No correct answer specified`);
    }
    
    const correctOptionExists = q.options.some(opt => opt.id === q.correctOption);
    if (!correctOptionExists) {
      errors.push(`Question ${index + 1}: Correct option not found in options list`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
