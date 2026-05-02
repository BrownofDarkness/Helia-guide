# Exercice 2.1 — mini-curl en Node.js

> **Axe** : 2 — Comment fonctionne le Web
> **Difficulté** : intermédiaire
> **Durée estimée** : 2 à 4 heures
> **Prérequis** : axes 1 et 2 lus, **Node.js ≥ 20** (voir ci-dessous)

## ⚙️ Avant de commencer — installer Node.js

Si Node.js n'est pas encore installé sur ta machine :

| OS | Méthode rapide | Recommandée pour gérer plusieurs versions |
|----|----------------|-------------------------------------------|
| **Linux / macOS / WSL** | Installeur officiel : [nodejs.org](https://nodejs.org/) | [`fnm`](https://github.com/Schniz/fnm) (rapide) ou [`nvm`](https://github.com/nvm-sh/nvm) |
| **macOS** | `brew install node@22` | `brew install fnm` |
| **Windows (hors WSL)** | Installeur [nodejs.org](https://nodejs.org/) | [`fnm`](https://github.com/Schniz/fnm) (`winget install Schniz.fnm`) |

> Si tu travailleras sur plusieurs projets Node, utilise plutôt **fnm** ou **nvm** dès le début — voir [axe 4.3](http://localhost:4321/04-outils/03-paquets/#gérer-plusieurs-versions-de-nodejs) pour le détail.

**Vérifie** :

```bash
node --version       # v20.x.x ou plus récent
npm --version        # 10.x.x ou plus récent
```

Si `node --version` affiche moins que `v20`, mets à jour avant de continuer (certaines APIs utilisées dans l'exercice — comme `--import tsx` — n'existent pas avant Node 20).

## 🎯 Objectifs pédagogiques

- Manipuler le module `http`/`https` natif de Node.js
- Lire et interpréter en-têtes, codes de statut, redirections
- Mesurer les phases d'une requête (DNS, TCP, TLS, TTFB)
- Écrire un CLI utilisable et bien typé en TypeScript

## 📋 Énoncé

Tu vas écrire un mini-clone de `curl -v` en Node.js. Au lieu d'utiliser une bibliothèque comme `axios`, tu vas appeler directement les APIs natives `http` / `https` pour comprendre ce qu'elles font.

### Comportement attendu

```bash
$ ./mini-curl https://api.github.com/repos/withastro/astro

> GET /repos/withastro/astro HTTP/1.1
> Host: api.github.com
> User-Agent: mini-curl/1.0
> Accept: */*
>

< HTTP/1.1 200 OK
< content-type: application/json; charset=utf-8
< cache-control: public, max-age=60, s-maxage=60
< ...

{"id":105752473,"name":"astro",...}

✓ Done in 312 ms
  DNS:    14 ms
  TCP:    47 ms
  TLS:    121 ms
  TTFB:   85 ms
  Download: 45 ms
```

## ✅ Critères d'acceptation

Ton CLI doit :

1. Accepter une URL en argument : `./mini-curl <url>`
2. Supporter HTTP **et** HTTPS automatiquement.
3. **Suivre les redirections 3xx** (max 5 sauts), afficher chaque saut.
4. Avec `-v` ou `--verbose` : afficher les en-têtes envoyés (`>`) et reçus (`<`).
5. Avec `-X POST -d '{"hello":"world"}' -H 'Content-Type: application/json'` : faire un POST avec corps et en-têtes custom.
6. Sortir avec **code 0** si statut 2xx, **code 1** si 4xx/5xx, **code 2** si erreur réseau.
7. **Mesurer les temps** : DNS, TCP, TLS, TTFB (Time To First Byte), Download — affichés à la fin.
8. Erreurs claires : URL invalide, host introuvable, timeout, etc.

### Bonus

- `--head` : faire une HEAD au lieu de GET.
- `-o fichier` : sauvegarder la réponse dans un fichier au lieu de stdout.
- `--max-time SEC` : timeout global.

## 🛠 Comment commencer

```bash
cd canevas/
npm install
npx tsx src/index.ts https://example.com
```

Le canevas contient :
- `src/index.ts` : entrée du CLI avec parsing des arguments à compléter
- `src/request.ts` : fonction de requête HTTP à compléter (le cœur)
- `src/format.ts` : helpers d'affichage (déjà fournis)

## 🧪 S'auto-valider

```bash
cd tests/
npm install
npm test
```

## 💡 Indices

<details>
<summary>1. Comment faire une requête avec http natif ?</summary>

```ts
import https from 'node:https';
import http from 'node:http';

const url = new URL('https://example.com');
const lib = url.protocol === 'https:' ? https : http;

const req = lib.request({
  hostname: url.hostname,
  port: url.port,
  path: url.pathname + url.search,
  method: 'GET',
  headers: { 'User-Agent': 'mini-curl/1.0' },
});

req.on('response', (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => console.log(body));
});

req.on('error', (err) => console.error(err));
req.end();
```
</details>

<details>
<summary>2. Comment mesurer DNS, TCP, TLS, TTFB ?</summary>

Le module `http` émet des événements sur la socket :

```ts
let dns = 0, tcp = 0, tls = 0, ttfb = 0;
const start = performance.now();

req.on('socket', (socket) => {
  socket.on('lookup', () => (dns = performance.now() - start));
  socket.on('connect', () => (tcp = performance.now() - start));
  socket.on('secureConnect', () => (tls = performance.now() - start));
});

req.on('response', (res) => {
  ttfb = performance.now() - start;
});
```
</details>

<details>
<summary>3. Comment suivre les redirections ?</summary>

```ts
async function followRedirects(url: string, max = 5): Promise<Response> {
  for (let i = 0; i < max; i++) {
    const res = await doRequest(url);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      url = new URL(res.headers.location, url).toString();
      console.log(`→ Redirect to ${url}`);
      continue;
    }
    return res;
  }
  throw new Error('Too many redirects');
}
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/).

## 📚 Pour aller plus loin

- Variante 1 : ajouter HTTP/2 via le module `http2` natif.
- Variante 2 : afficher les certificats TLS (`socket.getPeerCertificate()`).
- Variante 3 : générer la commande `curl` équivalente pour la copier.
