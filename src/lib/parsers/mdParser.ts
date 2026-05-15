import { parseQAFile } from './qaParser';

export function parseMdFile(content: string) {
  return parseQAFile(content);
}
