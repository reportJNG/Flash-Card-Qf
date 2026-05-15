import { parseQAFile } from './qaParser';

export function parseTxtFile(content: string) {
  return parseQAFile(content);
}
