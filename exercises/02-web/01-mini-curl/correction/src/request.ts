/**
 * Cœur du mini-curl : requête HTTP/HTTPS avec mesure des temps et redirections.
 */

import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';
import type { TLSSocket } from 'node:tls';

export interface RequestOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface Response {
  status: number;
  statusText: string;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  timings: {
    dns?: number;
    tcp?: number;
    tls?: number;
    ttfb?: number;
    total: number;
  };
}

export async function doRequest(options: RequestOptions): Promise<Response> {
  const url = new URL(options.url);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const start = performance.now();
    const timings: Response['timings'] = { total: 0 };

    const reqOptions: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: (url.pathname || '/') + url.search,
      method: options.method,
      headers: options.headers,
    };

    const req = lib.request(reqOptions, (res) => {
      timings.ttfb = performance.now() - start;

      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        timings.total = performance.now() - start;
        resolve({
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          headers: res.headers,
          body: Buffer.concat(chunks),
          timings,
        });
      });
      res.on('error', reject);
    });

    // Mesure des phases bas-niveau
    req.on('socket', (socket) => {
      socket.on('lookup', () => {
        timings.dns = performance.now() - start;
      });
      socket.on('connect', () => {
        timings.tcp = performance.now() - start;
      });
      if (isHttps) {
        (socket as TLSSocket).on('secureConnect', () => {
          timings.tls = performance.now() - start;
        });
      }
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Suit les redirections 3xx, max N sauts. Émet un log par saut.
 */
export async function fetchWithRedirects(
  options: RequestOptions,
  maxRedirects = 5,
  onRedirect?: (from: string, to: string, status: number) => void
): Promise<Response> {
  let current = options.url;
  let method = options.method;
  let body = options.body;

  for (let i = 0; i <= maxRedirects; i++) {
    const res = await doRequest({ ...options, url: current, method, body });

    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      const next = new URL(res.headers.location as string, current).toString();
      onRedirect?.(current, next, res.status);

      // 303 : toujours GET. 301/302 : pratiquement traité comme GET.
      // 307/308 : conservent la méthode et le corps.
      if (res.status === 307 || res.status === 308) {
        // garder method et body
      } else {
        method = 'GET';
        body = undefined;
      }

      current = next;
      continue;
    }

    return res;
  }

  throw new Error(`Trop de redirections (> ${maxRedirects})`);
}
