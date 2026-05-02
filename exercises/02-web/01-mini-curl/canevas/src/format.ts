/**
 * Helpers d'affichage — fournis. Pas besoin de modifier ce fichier.
 */

export function printRequestHeaders(method: string, path: string, headers: Record<string, string>): void {
  console.error(`> ${method} ${path} HTTP/1.1`);
  for (const [key, value] of Object.entries(headers)) {
    console.error(`> ${key}: ${value}`);
  }
  console.error('>');
}

export function printResponseHeaders(status: number, statusText: string, headers: Record<string, string | string[] | undefined>): void {
  console.error(`< HTTP/1.1 ${status} ${statusText}`);
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const v of value) console.error(`< ${key}: ${v}`);
    } else if (value !== undefined) {
      console.error(`< ${key}: ${value}`);
    }
  }
  console.error('<');
}

export function printTimings(timings: {
  dns?: number;
  tcp?: number;
  tls?: number;
  ttfb?: number;
  total: number;
}): void {
  console.error();
  console.error(`✓ Done in ${timings.total.toFixed(0)} ms`);
  if (timings.dns !== undefined) console.error(`  DNS:      ${timings.dns.toFixed(0)} ms`);
  if (timings.tcp !== undefined) console.error(`  TCP:      ${(timings.tcp - (timings.dns ?? 0)).toFixed(0)} ms`);
  if (timings.tls !== undefined) console.error(`  TLS:      ${(timings.tls - timings.tcp!).toFixed(0)} ms`);
  if (timings.ttfb !== undefined) console.error(`  TTFB:     ${(timings.ttfb - (timings.tls ?? timings.tcp ?? 0)).toFixed(0)} ms`);
  console.error(`  Download: ${(timings.total - (timings.ttfb ?? 0)).toFixed(0)} ms`);
}
