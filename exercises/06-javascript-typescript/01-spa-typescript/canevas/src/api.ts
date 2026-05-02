/**
 * Fetch typé avec validation Zod — fourni complet, pas de TODO ici.
 */

import { z } from 'zod';

const PokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  sprites: z.object({ front_default: z.string().nullable() }),
  types: z.array(z.object({ type: z.object({ name: z.string() }) })),
  stats: z.array(z.object({
    base_stat: z.number(),
    stat: z.object({ name: z.string() }),
  })),
});

const ListItemSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

const ListSchema = z.object({
  results: z.array(ListItemSchema),
  next: z.string().nullable(),
  previous: z.string().nullable(),
});

export type Pokemon = z.infer<typeof PokemonSchema>;
export type ListItem = z.infer<typeof ListItemSchema>;
export type List = z.infer<typeof ListSchema>;

const BASE = 'https://pokeapi.co/api/v2';

export async function fetchList(offset = 0, limit = 20, signal?: AbortSignal): Promise<List> {
  const r = await fetch(`${BASE}/pokemon?offset=${offset}&limit=${limit}`, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return ListSchema.parse(await r.json());
}

export async function fetchPokemon(id: number | string, signal?: AbortSignal): Promise<Pokemon> {
  const r = await fetch(`${BASE}/pokemon/${id}`, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return PokemonSchema.parse(await r.json());
}

export function idFromUrl(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  if (!match || !match[1]) throw new Error(`URL invalide : ${url}`);
  return Number(match[1]);
}
