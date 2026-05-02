import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';

const PRIVATE_RANGES: Array<[bigint, bigint]> = [
  // 10.0.0.0/8
  [ipToBigInt('10.0.0.0'), ipToBigInt('10.255.255.255')],
  // 172.16.0.0/12
  [ipToBigInt('172.16.0.0'), ipToBigInt('172.31.255.255')],
  // 192.168.0.0/16
  [ipToBigInt('192.168.0.0'), ipToBigInt('192.168.255.255')],
  // 127.0.0.0/8
  [ipToBigInt('127.0.0.0'), ipToBigInt('127.255.255.255')],
  // 169.254.0.0/16 (link-local + métadonnées cloud)
  [ipToBigInt('169.254.0.0'), ipToBigInt('169.254.255.255')],
  // 0.0.0.0/8
  [ipToBigInt('0.0.0.0'), ipToBigInt('0.255.255.255')],
];

function ipToBigInt(ip: string): bigint {
  return ip
    .split('.')
    .reduce((acc, oct) => (acc << 8n) | BigInt(Number(oct)), 0n);
}

function isPrivate(ip: string): boolean {
  if (isIP(ip) !== 4) return true; // on bloque IPv6 par simplicité.
  const value = ipToBigInt(ip);
  return PRIVATE_RANGES.some(([lo, hi]) => value >= lo && value <= hi);
}

export async function assertSafeUrl(input: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('URL invalide');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Seuls http(s) sont autorisés');
  }
  const records = await dns.lookup(url.hostname, { all: true });
  for (const r of records) {
    if (isPrivate(r.address)) {
      throw new Error('Cible interne interdite (SSRF)');
    }
  }
  return url;
}
