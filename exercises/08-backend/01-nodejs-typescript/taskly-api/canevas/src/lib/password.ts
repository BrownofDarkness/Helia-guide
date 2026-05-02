/**
 * À COMPLÉTER : utiliser argon2id via @node-rs/argon2.
 */
export async function hashPassword(plain: string): Promise<string> {
  // TODO 1 : retourner le hash argon2id
  throw new Error('TODO');
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  // TODO 2 : retourner true si le mot de passe correspond
  throw new Error('TODO');
}
