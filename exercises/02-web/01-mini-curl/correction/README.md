# Correction — mini-curl

> Cette correction couvre **tous les critères d'acceptation** + redirections avec changement de méthode, timings détaillés, et conventions stdout/stderr correctes pour la pipe shell.
>
> Lis-la **après avoir tenté le canevas**. Si tu te débloques en regardant ici, tu te seras volé l'apprentissage le plus précieux : « pourquoi cette ligne précisément ? ».

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Vue d'ensemble](#2-vue-densemble)
3. [Code annoté — `request.ts`](#3-code-annoté--requestts)
4. [Code annoté — `index.ts`](#4-code-annoté--indexts)
5. [Conventions stdout vs stderr](#5-conventions-stdout-vs-stderr)
6. [Validation : 8/8 tests](#6-validation--88-tests)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
npm install
npx tsx src/index.ts https://example.com                   # GET 200
npx tsx src/index.ts -v https://api.github.com/repos/withastro/astro
npx tsx src/index.ts -X POST -d '{"name":"Alice"}' \
  -H "Content-Type: application/json" https://httpbin.org/post
```

Sortie attendue avec `-v` :

```
> GET / HTTP/1.1
> Host: example.com
> User-Agent: mini-curl/1.0
> Accept: */*
>
< HTTP/1.1 200 OK
< content-type: text/html; charset=UTF-8
< ...
<
<!doctype html>...
✓ Done in 312 ms
  DNS:      14 ms
  TCP:      47 ms
  TLS:      121 ms
  TTFB:     85 ms
  Download: 45 ms
```

## 2. Vue d'ensemble

Trois fichiers, une responsabilité chacun :

| Fichier | Responsabilité |
|---------|----------------|
| `src/request.ts` | `doRequest()` envoie une requête et mesure les phases. `fetchWithRedirects()` boucle sur les 3xx. |
| `src/index.ts` | Parse la CLI, orchestre la requête, gère l'exit code. |
| `src/format.ts` | Affichage des en-têtes (`>` / `<`) et du tableau de timings. |

L'idée pédagogique : **séparer la mécanique HTTP du reste**. Si on devait porter ce CLI vers Bun ou Deno, seul `request.ts` aurait à changer.

## 3. Code annoté — `request.ts`

### 3.1 Sélectionner le bon module

```ts
const url = new URL(options.url);
const isHttps = url.protocol === 'https:';
const lib = isHttps ? https : http;
```

`new URL()` valide l'entrée et casse en composantes (host, port, path, query). Si l'URL est mal formée, ça throw — c'est un cas géré dans `index.ts` (exit 2).

### 3.2 Brancher les events socket *avant* l'envoi

```ts
req.on('socket', (socket) => {
  socket.on('lookup', () => { timings.dns = performance.now() - start; });
  socket.on('connect', () => { timings.tcp = performance.now() - start; });
  if (isHttps) {
    (socket as TLSSocket).on('secureConnect', () => {
      timings.tls = performance.now() - start;
    });
  }
});
```

C'est **la seule façon propre** d'avoir DNS / TCP / TLS séparés en Node sans lib externe. La séquence des events est :

```
lookup        → DNS terminé
  ↓
connect       → handshake TCP terminé
  ↓
secureConnect → handshake TLS terminé (HTTPS uniquement)
  ↓
'response'    → TTFB (premier octet du serveur)
  ↓
'data' × N    → réception du body
  ↓
'end'         → total
```

> ⚠️ Si on bind les events après `req.end()`, on rate `lookup` (la résolution DNS commence dès `req.end()`). D'où le `req.on('socket')` immédiat.

### 3.3 Pourquoi `Buffer.concat` et pas `body += chunk`

```ts
const chunks: Buffer[] = [];
res.on('data', (chunk: Buffer) => chunks.push(chunk));
res.on('end', () => {
  resolve({ ..., body: Buffer.concat(chunks), ... });
});
```

`chunk` est un **Buffer binaire**. Faire `body += chunk` force une conversion implicite vers UTF-8 — ce qui **corrompt les images, PDFs, ZIP**. La correction collecte les Buffers bruts et concatène à la fin. C'est le bon réflexe pour tout client HTTP.

### 3.4 Gérer les redirections — méthode et corps

```ts
if (res.status === 307 || res.status === 308) {
  // garder method et body
} else {
  method = 'GET';
  body = undefined;
}
```

Subtilité historique :

- **301 / 302 / 303** : un POST devient un GET (legacy mais respecté par tous les navigateurs / curl).
- **307 / 308** : codes "modernes" introduits pour conserver la méthode + le corps.

Si tu ne respectes pas ça, un POST suivi d'un 302 va re-POST en boucle sur la nouvelle URL — ce qui peut faire double-paiement, double-création, etc. C'est le genre de bug qu'on ne voit pas en local mais qui surgit en prod.

## 4. Code annoté — `index.ts`

### 4.1 Parsing CLI à la main

Pas de lib (`yargs`, `commander`) parce que cet exercice **est** sur la mécanique. La boucle :

```ts
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  switch (arg) {
    case '-v': args.verbose = true; break;
    case '-X': args.method = argv[++i].toUpperCase(); methodExplicit = true; break;
    case '-d': args.body = argv[++i]; if (!methodExplicit) args.method = 'POST'; break;
    // …
  }
}
```

Le `methodExplicit` capture une convention de curl : `-d` **implique** POST sauf si `-X` a déjà été passé. Si on faisait `-d` sans cette logique, l'utilisateur devrait toujours taper `-X POST -d ...`. Petite ergonomie, gros confort.

### 4.2 Content-Length automatique

```ts
if (args.body && !findHeader(args.headers, 'content-length')) {
  args.headers['Content-Length'] = String(Buffer.byteLength(args.body));
}
```

Sans `Content-Length`, Node envoie le body en **chunked transfer-encoding**, ce qui déstabilise certains serveurs. Un client correct calcule la taille et l'annonce.

`Buffer.byteLength(s)` (et pas `s.length`) parce qu'un caractère emoji = 1 char JS mais 4 octets UTF-8. Si tu confonds, le serveur lit moins que ce que tu envoies et la requête traîne / timeout.

### 4.3 Exit codes

```ts
process.exit(res.status >= 200 && res.status < 400 ? 0 : 1);
// ↑ et catch → process.exit(2)
```

| Code | Signification | Convention |
|------|---------------|------------|
| 0 | 2xx ou 3xx (succès / redirect) | `set -e` continue |
| 1 | 4xx ou 5xx (erreur HTTP) | `set -e` stoppe le script |
| 2 | Erreur réseau (DNS, TCP, TLS, timeout) | Distinction utile pour retry |

C'est ce que fait curl. Avec ça, tu peux scripter `mini-curl ... && next-step` proprement.

## 5. Conventions stdout vs stderr

Le détail qui distingue un CLI amateur d'un CLI utilisable :

| Flux | Quoi | Pourquoi |
|------|------|----------|
| **stdout** | Le corps de la réponse, **rien d'autre** | Pour `mini-curl https://api.example.com/users.json > users.json` |
| **stderr** | En-têtes envoyés (`>`), reçus (`<`), redirections, timings, erreurs | Visible dans le terminal, mais ne pollue pas le pipe |

Dans le code :

```ts
console.error(`> ${method} ${path}`);   // ↘ stderr
process.stdout.write(res.body);         // ↘ stdout
```

Test mental : si tu fais `mini-curl https://... | jq '.'`, le pipe doit recevoir **uniquement du JSON**. Un seul `console.log()` mal placé dans `index.ts` casse ça pour tous les utilisateurs avals. Beaucoup de CLIs débutants tombent dans ce piège.

## 6. Validation : 8/8 tests

```bash
cd ../tests/
npm install
npm test
```

Sortie attendue :

```
Tests mini-curl (cible : correction)

  ✓ GET basique → 200 et corps reçu
  ✓ exit code 1 sur 5xx
  ✓ exit code 2 sur erreur réseau (host invalide)
  ✓ -v affiche les en-têtes envoyés et reçus sur stderr
  ✓ suit les redirections 3xx
  ✓ POST avec corps et en-tête custom
  ✓ -d sans -X passe automatiquement en POST
  ✓ affiche les timings en mode verbose

Résultat : 8/8 réussi
```

> ℹ️ **Pourquoi pas Vitest ?** Vitest 2/3 + Node 24 + Windows + `spawnSync` ne tiennent pas debout ensemble (Tinypool worker meurt avec `ERR_IPC_CHANNEL_CLOSED` ou SIGTERM 143). Le runner ici est un mini-driver de 50 lignes : tableau `{name, fn}` + `for` qui try/catch. Pour des tests d'intégration de CLI, c'est aussi bien et beaucoup plus stable cross-OS.

Pour tester ton **canevas** (au lieu de cette correction) :

```bash
TARGET=canevas npm test
```

## 7. Pièges réels rencontrés

Pendant la construction de ce guide, **trois vrais pièges** ont été rencontrés sur ce seul exercice :

1. **Vitest + Node 24 + Windows + `spawnSync`** → Tinypool worker meurt. Solution : runner custom ou `node:test`. [Détails](/pieges/#tests).
2. **`spawnSync` depuis Node, parent et enfant chargent tous les deux tsx** → status 143 (SIGTERM) après 30s, `stdout` vide. Cause : `spawnSync` bloque l'event loop, l'enfant ne peut pas finir son init. Solution : `spawn` async wrappé en Promise.
3. **`npx tsx` sans tsx en devDep** → 30–60s de résolution sur Windows à chaque appel. Solution : ajouter `tsx` aux devDeps de `tests/` pour qu'il soit local.

Tu trouveras les trois sur [/pieges/](/pieges/) — ce ne sont pas des cas d'école, ce sont des bugs vécus dans ce repo.

## 8. Pour aller plus loin

- **HTTP/2** : remplace `https.request` par `http2.connect` du module natif `http2`. L'API est différente (sessions multiplexées) mais les events socket sont similaires.
- **Certificats TLS** : ajoute `--show-cert` qui appelle `socket.getPeerCertificate(true)` pour dumper la chaîne (sujet, émetteur, validité, fingerprint).
- **Cookie jar** : implémente un store en mémoire (`Map<host, Map<name, value>>`) qui parse `Set-Cookie:` et renvoie le `Cookie:` correct au prochain appel sur le même host.
- **Génération curl** : ajoute `--gen-curl` qui imprime la commande `curl` équivalente à coller dans Postman/Insomnia/un script bash.
- **Streaming stdout** : actuellement on attend `'end'` pour résoudre la promesse. Pour les gros téléchargements, branche `res.pipe(process.stdout)` et fais avancer une barre de progression sur stderr.
