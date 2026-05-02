import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const model = openai.embedding('text-embedding-3-small');

export async function embedOne(text: string): Promise<number[]> {
  const { embedding } = await embed({ model, value: text });
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model, values: texts });
  return embeddings;
}
