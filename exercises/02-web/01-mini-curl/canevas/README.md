# Canevas — mini-curl

> Tu vas écrire ton propre `curl -v`. Pas une lib qui fait du HTTP par-dessus une autre lib qui fait du HTTP : tu utilises directement le module `http`/`https` natif de Node, et tu observes ce qui se passe à chaque étape.

## Ce que tu vas faire

Tu construis un CLI qui :

- prend une URL en argument (`./mini-curl https://example.com`),
- bascule auto entre `http` et `https`,
- suit les redirections **3xx** (max 5),
- en `-v` (verbose) : affiche tous les en-têtes envoyés (`>`) et reçus (`<`),
- avec `-X POST -d '{"x":1}' -H 'Content-Type: …'` : envoie un POST avec corps + headers custom,
- exit **0** sur 2xx, **1** sur 4xx/5xx, **2** sur erreur réseau,
- mesure les temps **DNS / TCP / TLS / TTFB / Download** via les events de la socket.

À la fin tu sauras *exactement* ce que fait curl quand tu tapes une commande, et tu auras vu les events bas-niveau d'une socket Node de tes propres yeux. Plus jamais de magie noire derrière un `axios.get()`.

## Pré-requis

- **Node ≥ 20** (`node --version`). Sous 20, `--import tsx` ne marche pas.
- npm ≥ 10.

Si Node n'est pas installé, voir l'énoncé global (`../README.md` § « Avant de commencer »).

## Démarrer en 3 étapes

```bash
npm install
npx tsx src/index.ts https://example.com         # GET simple
npx tsx src/index.ts -v https://api.github.com/repos/withastro/astro
```

La première commande dump le HTML brut. La seconde affiche tout : ton User-Agent, les en-têtes envoyés, ceux reçus, et les timings à la fin.

## Structure

```
canevas/
  src/
    index.ts      ← TODO : parser la CLI (5 cas), assembler la requête
    request.ts    ← TODO : faire la requête + mesurer DNS/TCP/TLS/TTFB + suivre redirections
    format.ts     ← fourni : helpers d'affichage (lignes ">" et "<", tableau timings)
  package.json
  tsconfig.json
```

`format.ts` est déjà fait pour que tu te concentres sur le réseau, pas sur le formatage.

## TODO

Suis les commentaires `// TODO` dans le code. En gros :

1. **`request.ts → doRequest`** : choisir `http` ou `https` selon l'URL, construire la requête, écouter les events socket (`lookup`, `connect`, `secureConnect`), retourner `{status, headers, body, timings}`.
2. **`request.ts → fetchWithRedirects`** : boucler tant qu'on reçoit un 3xx avec `Location:`, max 5 sauts, garder le compte des temps cumulés.
3. **`index.ts`** : parser `-v`, `-X`, `-d`, `-H` (répétable), basculer méthode sur POST si `-d` est présent, calculer `Content-Length` automatiquement, gérer l'exit code.

## Tester

```bash
cd ../tests/
npm install
npm test
```

8 tests couvrent les critères d'acceptation : GET 200, exit codes (0/1/2), `-v`, redirections, POST avec et sans `-X`, timings.

> ℹ️ Les tests utilisent un runner custom maison (50 lignes) plutôt que Vitest. Raison : sous Windows + Node 24, Vitest + `spawnSync` plante (Tinypool meurt). Voir [le piège vitest-windows-spawn-tinypool](/pieges/#tests).

## Bloqué ?

- **`req.on('error')` se déclenche tout de suite** → tu as oublié d'appeler `req.end()`. La requête n'est pas envoyée tant que `.end()` n'est pas appelé.
- **TLS jamais déclenché** → tu testes en `http://` (pas `https://`). C'est normal, l'event `secureConnect` n'existe que pour TLS.
- **Le body est tronqué** → tu fais `body += chunk` mais `chunk` est un `Buffer`, pas une `string`. Convertis avec `.toString()` ou collecte les Buffer puis `Buffer.concat()`.
- **La redirection envoie le body en POST en boucle** → 301/302/303 doivent passer en GET (et drop le body). Seuls 307/308 conservent la méthode.

## Ne commit pas

`node_modules/`, `package-lock.json` (déjà dans `.gitignore`), aucun secret n'est requis pour cet exercice.
