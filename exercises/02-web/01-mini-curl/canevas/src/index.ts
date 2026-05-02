#!/usr/bin/env node
/**
 * mini-curl — point d'entrée du CLI.
 *
 * À COMPLÉTER aux endroits TODO.
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

  // TODO 1 : parser les arguments
  // Supporter au minimum :
  //   <url>          → args.url
  //   -v / --verbose → args.verbose = true
  //   -X METHOD      → args.method = METHOD
  //   -d body        → args.body = body (et passer en POST si pas explicit)
  //   -H "Key: Value" → ajouter à args.headers

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      args.url = arg;
    }
    // TODO : compléter
  }

  if (!args.url) {
    console.error('Usage : mini-curl [options] <url>');
    process.exit(2);
  }

  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // TODO 2 : si verbose, afficher les en-têtes envoyés via printRequestHeaders

  try {
    const res = await fetchWithRedirects({
      url: args.url,
      method: args.method,
      headers: args.headers,
      body: args.body,
    });

    // TODO 3 : si verbose, afficher les en-têtes reçus via printResponseHeaders
    // TODO 4 : afficher le corps sur stdout
    // TODO 5 : afficher les timings via printTimings (sur stderr)
    // TODO 6 : exit code selon le statut (0 si 2xx, 1 sinon)

    process.stdout.write(res.body);
    process.exit(0);

  } catch (err) {
    console.error('Erreur :', (err as Error).message);
    process.exit(2);
  }
}

main();
