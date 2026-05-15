import { ParsedQAPair } from '@/types/app';

export function parseTxtFile(content: string): ParsedQAPair[] {
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
    } else if (lines.length > 0) {
      pairs.push({
        question: '',
        answer: '',
        valid: false,
        warning: `Skipped: no Q:/A: format found`,
      });
    }
  }

  return pairs;
}
