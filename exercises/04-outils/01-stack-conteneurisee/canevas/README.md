# Canevas — Stack conteneurisée

> Tu vas faire passer une mini-app full-stack (API + front + DB + Redis) de « 4 process à lancer à la main dans 4 terminaux » à « `docker compose up` et tout démarre ». Et surtout : tu vas comprendre **pourquoi** chaque ligne du `compose.yml` est là.

## Ce que tu vas faire

Une stack à 4 services :

| Service | Quoi | Port |
|---------|------|------|
| **db** | PostgreSQL 16 avec données persistantes via volume nommé | 5432 |
| **redis** | Redis 7 (placeholder pour des files de tâches futures) | 6379 |
| **api** | Express + TypeScript avec hot-reload via `tsx watch` | 3000 |
| **web** | Vite (HTML vanilla qui appelle l'API) avec HMR | 5173 |

À la fin, tu auras vécu **6 pièges Docker classiques** au moins une fois (Vite qui bind sur 127.0.0.1, node_modules écrasé par le bind mount, root dans le conteneur, healthcheck qui se déclenche trop tôt, etc.) et tu sauras les éviter au prochain projet.

## Pré-requis

- **Docker ≥ 27** + **Docker Compose v2.x** (`docker compose version`).
- **Pas de Postgres ni Redis local** sur les ports 5432/6379 (sinon collision).

Si Docker n'est pas installé, voir l'énoncé global (`../README.md` § « Avant de commencer »).

> **Windows** : lance `docker compose` **depuis WSL** plutôt que PowerShell pour des perfs correctes sur les bind mounts.

## Démarrer

```bash
docker compose up --build
```

Premier démarrage : 2–4 minutes (téléchargement des images + `npm install`). Les suivants : ~10 secondes grâce au cache.

Vérifie :

- API : <http://localhost:3000/health> → `{"status":"ok","db":"ok"}`
- Front : <http://localhost:5173/> → page qui liste les items et un formulaire d'ajout
- DB : `docker exec -it <db-container> psql -U app -d app_dev -c '\dt'`

## Fichiers à compléter

```
canevas/
  compose.yml         ← TODO : healthcheck DB, depends_on, bind mounts, volume db-data
  api/
    Dockerfile        ← TODO : multi-stage (dev + builder + production), user non-root
    src/index.ts      ← fourni : Express + Postgres pool + 3 routes
  web/
    Dockerfile        ← TODO : npm install + CMD vite avec --host
    index.html        ← fourni : page minimal
    vite.config.js    ← fourni : usePolling pour le HMR sous WSL/Windows
  db/init/
    01-schema.sql     ← fourni : CREATE TABLE items
```

## TODO

Suis les commentaires `# TODO` dans `compose.yml` et les Dockerfiles. En gros :

1. **`api/Dockerfile`** — 3 stages :
   - `dev` : `tsx watch` pour le hot-reload, user non-root, port 3000.
   - `builder` : `npm run build` pour compiler TS → JS.
   - `production` : copie le dist du builder, `npm ci --omit=dev`, image minimale.
2. **`web/Dockerfile`** — 1 stage suffit en dev. CMD : `npm run dev -- --host 0.0.0.0`.
3. **`compose.yml`** — pour chaque service : image ou build, ports, env, volumes.
   - DB : healthcheck `pg_isready`, volume nommé `db-data`.
   - API : `depends_on` healthcheck DB, bind mount du source + volume anonyme `node_modules`.
   - Web : bind mount idem, dépend de l'API.

## Tester

Le canevas a un script qui valide tout :

```bash
cd ../tests/
bash run.sh canevas
```

Il vérifie : 4 services UP, `/health` répond avec DB ok, front sur 5173, POST + GET items fonctionnent, **persistance** après `down`/`up` (le volume nommé doit garder les data).

## Bloqué ?

- **`docker compose up` se plaint de `port 5432 déjà utilisé`** → tu as un Postgres local. Stop-le (`brew services stop postgresql` / `sudo systemctl stop postgresql`) ou change le port host dans le compose : `"5433:5432"`.
- **`api/health` répond 503 avec « DB down »** → tu as oublié `depends_on: condition: service_healthy`. L'API a démarré avant Postgres.
- **HMR Vite ne se déclenche pas quand tu modifies `web/index.html`** → 9 fois sur 10 c'est `--host 0.0.0.0` manquant dans la commande Vite, ou bien `usePolling: true` absent du `vite.config.js`. Sous Docker + Windows/WSL, les events `inotify` ne traversent pas le bind mount → Vite ne sait pas que tu as touché un fichier.
- **`tsx watch` ne se relance pas après modif** → tu as bind-mounté `./api:/app` mais sans le volume anonyme `/app/node_modules`. Le bind a écrasé les `node_modules` installés dans l'image, et `tsx` n'est plus trouvable. Le 2e volume "remet" les `node_modules` du conteneur par-dessus.
- **Erreur de permission au démarrage de l'API** → tu as un `RUN chown` après le `USER app`. L'ordre dans le Dockerfile compte : crée le user, *puis* chown, *puis* USER.
- **`docker compose down -v` puis `up` redémarre vide même si t'as ajouté des items** → c'est normal, `-v` supprime aussi les volumes. Sans `-v`, le volume `db-data` est conservé.

## Ne commit pas

`.env` (n'existe pas dans cet exercice mais reflexe à avoir), volumes Docker — heureusement tout ça est par défaut hors du git.
