import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.TARGET ?? 'correction';

const routerModule = await import(
  path.resolve(__dirname, `../${TARGET}/src/router.ts`)
) as typeof import('../correction/src/router.js');

const { _internal } = routerModule;

describe('compile', () => {
  it('pattern static sans paramètre', () => {
    const { pattern, paramNames } = _internal.compile('/');
    expect(pattern.test('/')).toBe(true);
    expect(pattern.test('/foo')).toBe(false);
    expect(paramNames).toEqual([]);
  });

  it('pattern avec un paramètre', () => {
    const { pattern, paramNames } = _internal.compile('/pokemon/:id');
    expect(paramNames).toEqual(['id']);
    const m = pattern.exec('/pokemon/42');
    expect(m).not.toBeNull();
    expect(m?.[1]).toBe('42');
  });

  it('pattern avec plusieurs paramètres', () => {
    const { pattern, paramNames } = _internal.compile('/users/:userId/posts/:postId');
    expect(paramNames).toEqual(['userId', 'postId']);
    const m = pattern.exec('/users/42/posts/abc');
    expect(m?.[1]).toBe('42');
    expect(m?.[2]).toBe('abc');
  });

  it('pattern ne matche pas si chemin trop court', () => {
    const { pattern } = _internal.compile('/pokemon/:id');
    expect(pattern.test('/pokemon')).toBe(false);
  });
});
