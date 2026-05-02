// Découpage d'un Markdown en chunks par H2/H3, puis sliding window si trop long.

export interface Chunk {
  file: string;
  section: string;
  content: string;
}

const MAX_CHARS = 2400; // ~600 tokens (rule of thumb 4 chars / token)
const OVERLAP_CHARS = 240;

export function chunk(file: string, markdown: string): Chunk[] {
  const sections = splitBySection(markdown);
  const chunks: Chunk[] = [];

  for (const sec of sections) {
    if (sec.content.length <= MAX_CHARS) {
      chunks.push({ file, section: sec.title, content: sec.content });
    } else {
      // sliding window dans une section longue
      let start = 0;
      while (start < sec.content.length) {
        const end = Math.min(start + MAX_CHARS, sec.content.length);
        chunks.push({
          file,
          section: sec.title,
          content: sec.content.slice(start, end),
        });
        if (end === sec.content.length) break;
        start = end - OVERLAP_CHARS;
      }
    }
  }

  return chunks.filter((c) => c.content.trim().length > 100);
}

function splitBySection(md: string): { title: string; content: string }[] {
  const lines = md.split('\n');
  const out: { title: string; content: string }[] = [];
  let current = { title: 'intro', content: '' };

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) {
      if (current.content.trim()) out.push(current);
      current = { title: m[2]!.trim(), content: '' };
    } else {
      current.content += line + '\n';
    }
  }
  if (current.content.trim()) out.push(current);
  return out;
}
