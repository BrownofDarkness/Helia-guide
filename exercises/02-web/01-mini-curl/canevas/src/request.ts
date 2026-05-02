/**
 * Le cœur du CLI : faire une requête HTTP/HTTPS et mesurer les temps.
 *
 * À COMPLÉTER aux endroits TODO.
 */

import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

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
  const lib = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const start = performance.now();
    const timings: Response['timings'] = { total: 0 };

    // TODO 1 : construire les options de la requête
    // Indice : { hostname, port, path, method, headers }
    const reqOptions: http.RequestOptions = {
      hostname: '', // ← TODO
      port: '',     // ← TODO (utiliser url.port ou défaut selon protocole)
      path: '',     // ← TODO (pathname + search)
      method: options.method,
      headers: options.headers,
    };

    const req = lib.request(reqOptions, (res) => {
      // TODO 2 : marquer le TTFB
      // timings.ttfb = ...

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

    // TODO 3 : ajouter les listeners sur la socket pour mesurer DNS, TCP, TLS
    // Indice : req.on('socket', (socket) => { socket.on('lookup', ...); ... })

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Suit les redirections 3xx, max 5 sauts.
 */
export async function fetchWithRedirects(options: RequestOptions, maxRedirects = 5): Promise<Response> {
  let current = options.url;

  for (let i = 0; i <= maxRedirects; i++) {
    const res = await doRequest({ ...options, url: current });

    // TODO 4 : si 3xx avec Location, suivre la redirection
    // sinon retourner res

    return res; // ← à modifier
  }

  throw new Error(`Trop de redirections (> ${maxRedirects})`);
}
