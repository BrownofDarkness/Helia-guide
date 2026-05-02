#!/usr/bin/env node
/**
 * mini-curl — point d'entrée du CLI.
 */

import { fetchWithRedirects } from './request.js';
import { printRequestHeaders, printResponseHeaders, printTimings } from './format.js';

interface CliArgs {
  url: string;
  method: string;
  verbose: boolean;
  body?: string;
  headers: Record<string, string>;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    url: '',
    method: 'GET',
    verbose: false,
    headers: { 'User-Agent': 'mini-curl/1.0', Accept: '*/*' },
  };

  let methodExplicit = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '-v':
      case '--verbose':
        args.verbose = true;
        break;

      case '-X':
      case '--request':
        args.method = argv[++i].toUpperCase();
        methodExplicit = true;
        break;

      case '-d':
      case '--data': {
        args.body = argv[++i];
        if (!methodExplicit) args.method = 'POST';
        break;
      }

      case '-H':
      case '--header': {
        const raw = argv[++i];
        const idx = raw.indexOf(':');
        if (idx === -1) {
          console.error(`En-tête mal formé : "${raw}". Format attendu : "Nom: valeur".`);
          process.exit(2);
        }
        const key = raw.slice(0, idx).trim();
        const value = raw.slice(idx + 1).trim();
        args.headers[key] = value;
        break;
      }

      case '-h':
      case '--help':
        printHelp();
        process.exit(0);

      default:
        if (arg.startsWith('-')) {
          console.error(`Option inconnue : ${arg}`);
          process.exit(2);
        }
        args.url = arg;
    }
  }

  if (!args.url) {
    printHelp();
    process.exit(2);
  }

  // Headers minimaux pour POST avec body
  if (args.body && !findHeader(args.headers, 'content-length')) {
    args.headers['Content-Length'] = String(Buffer.byteLength(args.body));
  }

  return args;
}

function findHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some((k) => k.toLowerCase() === name.toLowerCase());
}

function printHelp(): void {
  console.error(`Usage : mini-curl [options] <url>

Options :
  -v, --verbose       Afficher les en-têtes envoyés et reçus
  -X, --request M     Méthode HTTP (GET par défaut, POST si -d présent)
  -d, --data BODY     Corps de la requête
  -H, --header H      En-tête supplémentaire (format "Nom: valeur"), répétable
  -h, --help          Afficher cette aide`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.verbose) {
    const url = new URL(args.url);
    printRequestHeaders(args.method, url.pathname + url.search, {
      Host: url.host,
      ...args.headers,
    });
  }

  try {
    const res = await fetchWithRedirects(
      {
        url: args.url,
        method: args.method,
        headers: args.headers,
        body: args.body,
      },
      5,
      (from, to, status) => {
        if (args.verbose) console.error(`→ ${status} redirect to ${to}`);
      }
    );

    if (args.verbose) {
      printResponseHeaders(res.status, res.statusText, res.headers as Record<string, string | string[] | undefined>);
    }

    process.stdout.write(res.body);
    if (res.body.length > 0 && !res.body.toString().endsWith('\n')) {
      process.stdout.write('\n');
    }

    if (args.verbose) {
      printTimings(res.timings);
    }

    process.exit(res.status >= 200 && res.status < 400 ? 0 : 1);
  } catch (err) {
    console.error('Erreur :', (err as Error).message);
    process.exit(2);
  }
}

main();
