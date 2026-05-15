import { ParsedQAPair } from '@/types/app';

export function parseMdFile(content: string): ParsedQAPair[] {
  const pairs: ParsedQAPair[] = [];
  
  // First try Q:/A: prefix format
  const qaPairs = parseQAPrefixFormat(content);
  if (qaPairs.length > 0) {
    return qaPairs;
  }

  // Then try heading format
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Check for heading (## or ###)
    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headingMatch) {
      const question = headingMatch[1].trim();
      // Look for the next non-empty line as the answer
      let answer = '';
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine === '') break;
        if (nextLine.match(/^#{2,3}\s+/)) {
          i--;
          break;
        }
        answer = nextLine;
        break;
      }
      
      if (question && answer) {
        pairs.push({ question, answer, valid: true });
      }
      i++;
      continue;
    }
    i++;
  }

  return pairs;
}

function parseQAPrefixFormat(content: string): ParsedQAPair[] {
  const pairs: ParsedQAPair[] = [];
  const blocks = content.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const qLine = lines.find(l => l.startsWith('Q:'));
    const aLine = lines.find(l => l.startsWith('A:'));

    if (qLine && aLine) {
      pairs.push({
        question: qLine.replace(/^Q:\s*/, '').trim(),
        answer: aLine.replace(/^A:\s*/, '').trim(),
        valid: true,
      });
    }
  }

  return pairs;
}
