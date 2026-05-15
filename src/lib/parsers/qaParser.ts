import { ParsedQAPair } from '@/types/app';

const QUESTION_PATTERNS = [
  /^(?:Q|Question)\s*\d*\s*:\s*(.+)$/i,
  /^\d+[\.)]\s*(.+)$/,
  /^#{2,3}\s+(.+)$/,
];

const ANSWER_PATTERN = /^(?:A|Answer)\s*\d*\s*:\s*(.*)$/i;

export function parseQAFile(content: string): ParsedQAPair[] {
  const normalizedContent = content.replace(/\r\n?/g, '\n').trim();
  if (!normalizedContent) return [];

  return normalizedContent
    .split(/\n\s*\n+/)
    .map(parseBlock)
    .filter((pair): pair is ParsedQAPair => pair !== null);
}

function parseBlock(block: string): ParsedQAPair | null {
  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const questionIndex = lines.findIndex(isQuestionLine);
  const answerIndex = lines.findIndex(isAnswerLine);

  if (questionIndex === -1 && answerIndex === -1) {
    return null;
  }

  if (answerIndex === -1 && questionIndex !== -1 && isMarkdownHeadingLine(lines[questionIndex])) {
    const question = extractQuestion(lines[questionIndex]);
    const answer = lines
      .slice(questionIndex + 1)
      .filter(line => !isQuestionLine(line))
      .join('\n')
      .trim();

    if (question && answer) {
      return {
        question,
        answer,
        valid: true,
      };
    }
  }

  if (questionIndex === -1 || answerIndex === -1 || answerIndex < questionIndex) {
    return {
      question: '',
      answer: '',
      valid: false,
      warning: 'Skipped: no supported question/answer format found',
    };
  }

  const question = extractQuestion(lines[questionIndex]);
  const firstAnswer = extractAnswer(lines[answerIndex]);
  const answerLines = [firstAnswer];

  for (let i = answerIndex + 1; i < lines.length; i++) {
    if (isQuestionLine(lines[i])) break;
    answerLines.push(lines[i]);
  }

  const answer = answerLines.join('\n').trim();

  if (!question || !answer) {
    return {
      question: '',
      answer: '',
      valid: false,
      warning: 'Skipped: question or answer was empty',
    };
  }

  return {
    question,
    answer,
    valid: true,
  };
}

function isQuestionLine(line: string) {
  return QUESTION_PATTERNS.some(pattern => pattern.test(line));
}

function isMarkdownHeadingLine(line: string) {
  return /^#{2,3}\s+.+$/.test(line);
}

function isAnswerLine(line: string) {
  return ANSWER_PATTERN.test(line);
}

function extractQuestion(line: string) {
  for (const pattern of QUESTION_PATTERNS) {
    const match = line.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

function extractAnswer(line: string) {
  return line.replace(ANSWER_PATTERN, '$1').trim();
}
