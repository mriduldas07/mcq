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
    
    // Set worker path to use local worker file from public directory
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Preserve line breaks by checking Y coordinates
      let lastY = -1;
      const pageText = textContent.items
        .map((item: any) => {
          const currentY = item.transform[5];
          const text = item.str;
          
          // Add newline if Y position changed significantly
          if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
            lastY = currentY;
            return '\n' + text;
          }
          
          lastY = currentY;
          return text;
        })
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    console.log('Extracted PDF text:', fullText.substring(0, 500)); // Log first 500 chars
    
    return parseQuestionText(fullText);
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
export function parseQuestionText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Clean up the text - normalize multiple spaces but preserve line breaks
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  
  // Try multiple split patterns
  let questionBlocks = text.split(/Q\d+\.\s*/gi).filter(block => block.trim());
  
  // If no matches, try alternative patterns
  if (questionBlocks.length <= 1) {
    questionBlocks = text.split(/Question\s*\d+[:.)]\s*/gi).filter(block => block.trim());
  }
  
  // If still no matches, try just number with period
  if (questionBlocks.length <= 1) {
    questionBlocks = text.split(/\b\d+\.\s+/g).filter(block => block.trim());
  }
  
  console.log(`Found ${questionBlocks.length} question blocks`);
  if (questionBlocks.length > 0) {
    console.log('First block preview:', questionBlocks[0].substring(0, 300));
  } else {
    console.log('Raw text preview:', text.substring(0, 500));
  }
  
  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    try {
      const question = parseQuestionBlock(block.trim());
      if (question) {
        questions.push(question);
        console.log(`✓ Successfully parsed question ${i + 1}`);
      } else {
        console.warn(`✗ Question ${i + 1} returned null`);
        console.warn(`Block content:`, block.substring(0, 200));
      }
    } catch (error) {
      console.error(`✗ Failed to parse question ${i + 1}:`, error);
      console.error(`Block content:`, block.substring(0, 200));
      // Don't skip - continue trying to parse remaining questions
      continue;
    }
  }
  
  // Log summary
  console.log(`\n=== PARSING SUMMARY ===`);
  console.log(`Total blocks found: ${questionBlocks.length}`);
  console.log(`Successfully parsed: ${questions.length}`);
  console.log(`Failed/Skipped: ${questionBlocks.length - questions.length}`);
  
  if (questions.length === 0) {
    throw new Error('No valid questions found in document. Check console for details.');
  }
  
  console.log(`Successfully parsed ${questions.length} questions`);
  return questions;
}

/**
 * Parse a single question block
 */
function parseQuestionBlock(block: string): ParsedQuestion | null {
  // Extract question text (everything before first option)
  const optionMatch = block.match(/\b[A-D]\s*\)|\b[A-D]\s*\./i);
  if (!optionMatch) {
    console.warn('No option markers found in block');
    return null;
  }
  
  const questionText = block.substring(0, optionMatch.index).trim();
  if (!questionText) {
    console.warn('Empty question text');
    return null;
  }
  
  // Extract options (A, B, C, D) - more flexible pattern
  const options: { id: string; text: string }[] = [];
  
  // First, try to find all option markers and extract text between them
  const optionMarkers = [
    { letter: 'A', regex: /\bA\s*[\)\.]/i },
    { letter: 'B', regex: /\bB\s*[\)\.]/i },
    { letter: 'C', regex: /\bC\s*[\)\.]/i },
    { letter: 'D', regex: /\bD\s*[\)\.]/i }
  ];
  
  const foundOptions: Array<{letter: string, start: number, end: number}> = [];
  
  for (const marker of optionMarkers) {
    const match = block.match(marker.regex);
    if (match && match.index !== undefined) {
      foundOptions.push({
        letter: marker.letter,
        start: match.index + match[0].length,
        end: -1
      });
    }
  }
  
  // Sort by position
  foundOptions.sort((a, b) => a.start - b.start);
  
  // Set end positions
  for (let i = 0; i < foundOptions.length; i++) {
    if (i < foundOptions.length - 1) {
      foundOptions[i].end = foundOptions[i + 1].start - foundOptions[i + 1].letter.length - 2;
    } else {
      // Last option - find where Answer: or other metadata starts
      const metaMatch = block.substring(foundOptions[i].start).match(/\s+(Answer:|Marks:|Negative:|Time:|Difficulty:|Explanation:)/i);
      foundOptions[i].end = metaMatch ? foundOptions[i].start + metaMatch.index! : block.length;
    }
  }
  
  // Extract option text
  for (const opt of foundOptions) {
    const optionText = block.substring(opt.start, opt.end).trim();
    if (optionText && optionText.length > 0) {
      const optionIndex = opt.letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      options.push({
        id: `opt_${optionIndex + 1}`,
        text: optionText
      });
    }
  }
  
  if (options.length < 2) {
    console.warn(`Only found ${options.length} options out of ${foundOptions.length} markers`);
    if (foundOptions.length > 0) {
      console.warn('Option markers found at positions:', foundOptions.map(o => `${o.letter}:${o.start}`));
    }
    return null;
  }
  
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
