# Correction — Stack conteneurisée

> Cette correction couvre **tous les critères d'acceptation** + bonus : multi-stage, user non-root, healthchecks combinés, polling Vite pour Windows.
>
> Lis-la **après avoir tenté le canevas**. Chaque ligne du `compose.yml` et des Dockerfiles a une raison concrète — si tu te contentes de copier sans comprendre, tu ne sauras pas quoi changer quand le projet suivant aura des contraintes différentes.

## Sommaire

1. [Pré-requis et lancement](#1-pré-requis-et-lancement)
2. [Vue d'ensemble de la stack](#2-vue-densemble-de-la-stack)
3. [Le `compose.yml` ligne par ligne](#3-le-composeyml-ligne-par-ligne)
4. [Multi-stage Dockerfile API](#4-multi-stage-dockerfile-api)
5. [Conventions Docker à retenir](#5-conventions-docker-à-retenir)
6. [Validation : 5 catégories de tests](#6-validation--5-catégories-de-tests)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Pré-requis et lancement

```bash
# Démarrage complet (build + run)
docker compose up --build

# Démarrage en arrière-plan (et attendre que tout soit healthy)
docker compose up -d --wait

# Logs d'un service
docker compose logs -f api

# Reset complet (volumes inclus)
docker compose down -v
```

Vérifications après démarrage :

```bash
curl http://localhost:3000/health    # → {"status":"ok","db":"ok"}
curl http://localhost:5173/          # → HTML de la page
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"un livre"}' http://localhost:3000/items
curl http://localhost:3000/items     # → [{"id":1,"name":"un livre",...}]
```

## 2. Vue d'ensemble de la stack

```
┌────────────────────────────────────────────┐
│              compose.yml                   │
│                                            │
│   web (Vite :5173) ────► api (:3000) ───┐  │
│                                          │  │
│                                          ▼  │
│                          db (postgres:5432) │
│                          redis (:6379)      │
└────────────────────────────────────────────┘
                  ▲             ▲
                  │             │
              db-data      (rien — Redis volatile)
              (volume nommé)
```

**Réseau** : tous les services sont sur le même bridge réseau créé par Compose. Ils se résolvent par leur nom de service (`api` peut faire `pg.connect('db')`, sans IP).

**Volumes** : seul `db-data` est nommé (persistant). Les `node_modules` sont des volumes anonymes dont la durée de vie est liée au container.

## 3. Le `compose.yml` ligne par ligne

### 3.1 Service `db` — Postgres avec healthcheck

```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: app
    POSTGRES_PASSWORD: secret
    POSTGRES_DB: app_dev
  volumes:
    - db-data:/var/lib/postgresql/data
    - ./db/init:/docker-entrypoint-initdb.d:ro
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U app -d app_dev"]
    interval: 5s
    timeout: 3s
    retries: 5
    start_period: 10s
```

Trois choses subtiles :

- **`-alpine`** : variante d'image basée sur Alpine Linux. ~80 Mo vs ~400 Mo pour `postgres:16` standard. Pour le dev local, choix par défaut.
- **`docker-entrypoint-initdb.d`** : tout fichier `*.sql` ou `*.sh` dans ce dossier est exécuté **au premier démarrage** d'un volume vide. C'est comme ça qu'on injecte le schéma sans avoir à `psql` à la main.
- **`pg_isready`** vs `psql -c 'SELECT 1'` : `pg_isready` ne fait que vérifier la connexion (rapide, pas de transaction). Pour un healthcheck qui tourne toutes les 5 secondes, c'est plus correct.
- **`start_period: 10s`** : pendant 10s après le démarrage, les échecs de healthcheck ne comptent pas. Postgres met du temps à initialiser sa première DB ; sans ça, on pourrait marquer le container `unhealthy` à tort.

### 3.2 Service `api` — bind mount + volume anonyme

```yaml
api:
  build:
    context: ./api
    target: dev
  volumes:
    - ./api:/app
    - /app/node_modules
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
```

Le **double volume** est *le* truc à comprendre :

```
- ./api:/app             ← bind mount : ton code source local s'écrit dans /app
- /app/node_modules      ← volume anonyme : "couvre" /app/node_modules
```

Sans le 2e, le bind écraserait les `node_modules` installés à l'étape `RUN npm install` du Dockerfile. Et tes `node_modules` côté hôte ne sont **pas** ceux du conteneur Linux (binaires natifs différents si tu es sur Mac/Windows ARM). Donc l'API plante au démarrage avec « Cannot find module 'tsx' ».

Le volume anonyme dit à Docker : « pour ce path précis, garde ce que l'image contient, ignore le bind ». Astuce non-évidente, à mémoriser.

### 3.3 Service `web` — Vite avec --host

```yaml
web:
  build:
    context: ./web
    target: dev
  ports:
    - "5173:5173"
```

Et dans le `web/Dockerfile` :

```dockerfile
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Pourquoi `--host 0.0.0.0` ?** Vite par défaut bind sur `localhost` (127.0.0.1). À l'intérieur d'un container, `localhost` = le container lui-même, pas l'hôte. Donc le port mapping `5173:5173` semble fonctionner mais le serveur n'écoute jamais sur l'interface accessible depuis l'hôte.

Règle générale : **dans un container, toujours bind sur `0.0.0.0`** pour les serveurs HTTP/dev.

### 3.4 Volume nommé pour la persistance

```yaml
volumes:
  db-data:
```

Sans cette section et `db-data:/var/lib/postgresql/data`, les données seraient dans le **layer écrivable du container** — perdues à chaque `docker compose down`. Avec un volume nommé, Docker garde les data dans `/var/lib/docker/volumes/<project>_db-data/_data` jusqu'à `docker compose down -v` explicite.

## 4. Multi-stage Dockerfile API

```dockerfile
# Stage 1 : dev (avec hot-reload)
FROM node:22-alpine AS dev
WORKDIR /app
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
RUN chown -R app:app /app
USER app
COPY --chown=app:app package*.json ./
RUN npm install
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/index.ts"]

# Stage 2 : builder (compile TS → JS)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3 : production (image minimale)
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder --chown=app:app /app/dist ./dist
USER app
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### 4.1 Pourquoi 3 stages ?

| Stage | Rôle | Quand l'utiliser |
|-------|------|------------------|
| `dev` | Hot-reload via `tsx watch`, devDeps inclus | `docker compose up` (target `dev` dans compose.yml) |
| `builder` | Compile TS → JS dans `/app/dist` | Étape intermédiaire — pas utilisée seule |
| `production` | Image minimale, pas de TS, pas de devDeps | `docker build --target production` pour la prod |

Ce qui est gagné en taille :

```bash
docker images | grep stack-api
# stack-api:prod    ~ 200 Mo
# stack-api:dev     ~ 1.1 Go
```

Cinq fois plus léger, ça compte au déploiement (push registry plus rapide, scale-out plus rapide, surface d'attaque réduite).

### 4.2 User non-root — l'ordre compte

```dockerfile
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app   # 1. Créer le user
RUN chown -R app:app /app                                       # 2. Donner les droits
USER app                                                        # 3. Switcher
```

Si tu fais `USER app` avant `chown`, le `chown` échoue (le user `app` ne peut pas chown ce qu'il ne possède pas encore). Erreur de débutant qu'on a tous faite une fois.

### 4.3 `npm ci --omit=dev` en prod

`npm ci` (au lieu de `npm install`) : install reproductible, basé strictement sur `package-lock.json`. Pas de modifications du lock pendant le build → pas de surprise.

`--omit=dev` : ignore les devDependencies. En prod, on n'a pas besoin de `tsx`, `vitest`, `@types/*` etc. — ça réduit l'image et réduit le risque qu'une devDep avec une CVE rentre en prod.

### 4.4 `--chown=app:app` sur les COPY

```dockerfile
COPY --chown=app:app package*.json ./
COPY --from=builder --chown=app:app /app/dist ./dist
```

Sans ça, les fichiers copiés sont owned par `root` (le user actif au moment du COPY). Quand tu fais `USER app` après, tu ne peux pas les modifier — pas grave en lecture seule, mais ça pose problème si l'app écrit dans son dossier (cache, logs locaux).

## 5. Conventions Docker à retenir

| Règle | Pourquoi |
|-------|----------|
| **Toujours bind sur `0.0.0.0`** dans un container | Sinon le service n'est pas joignable depuis l'hôte, même avec port mapping |
| **Toujours utiliser un user non-root** | Réduction de surface d'attaque, principe du moindre privilège |
| **`pg_isready` (et pas `psql ...`) dans les healthchecks** | Plus léger, pas de transaction inutile |
| **Bind mount + volume anonyme** pour les `node_modules` | Sinon les `node_modules` Linux sont écrasés par ceux de l'hôte |
| **`usePolling: true` Vite** sous Windows/WSL | Les events FS ne traversent pas le bind mount cross-OS |
| **`start_period`** dans les healthchecks lents | Évite les `unhealthy` faux-positifs au démarrage |
| **`--omit=dev`** dans le stage prod | Image plus petite, moins de surface d'attaque |
| **Multi-stage** dès qu'on compile (TS, esbuild, webpack…) | Image prod ne contient pas les outils de build |

## 6. Validation : 5 catégories de tests

```bash
cd ../tests/
bash run.sh correction
```

Le script vérifie :

| # | Test | Vérifie quoi |
|---|------|--------------|
| 1 | Services up | Les 4 conteneurs sont en état `running` |
| 2 | API /health | Réponse 200 + `db: "ok"` (l'API peut parler à Postgres) |
| 3 | Front | <http://localhost:5173/> répond 200 |
| 4 | POST + GET items | Insertion → lecture → l'item est bien là (round-trip API + DB) |
| 5 | Persistance | `down` puis `up` → l'item est toujours là (volume nommé OK) |

Pour tester ton **canevas** : `bash run.sh canevas`.

## 7. Pièges réels rencontrés

Six pièges à connaître pour ne plus jamais perdre 30 minutes dessus :

1. **Vite bind sur 127.0.0.1 par défaut** → invisible depuis l'hôte. Fix : `--host 0.0.0.0`.
2. **HMR ne déclenche pas sous Windows/WSL** → events `inotify` ne traversent pas le bind mount. Fix : `watch: { usePolling: true }` dans `vite.config.js`. Coût : ~2 % CPU pendant que le serveur dev tourne.
3. **`node_modules` écrasé par bind mount** → `Cannot find module`. Fix : volume anonyme `/app/node_modules`.
4. **Postgres pas encore prêt quand l'API démarre** → l'API plante au premier query. Fix : `depends_on: { condition: service_healthy }` + healthcheck `pg_isready`.
5. **Conteneur en root** → l'app peut écrire partout, faille = compromission complète du conteneur. Fix : `USER app` après chown des dossiers.
6. **`tsx watch` ne re-bundle pas après modif** → presque toujours le cumul de 2 et 3.

Aucun nouveau piège global pour `pieges.ts` ici (ce sont des classiques Docker bien documentés dans cette correction). Si tu en rencontres un original en faisant l'exercice, capture-le.

## 8. Pour aller plus loin

- **Ajoute un service `adminer`** (UI Postgres léger) sur le port 8080 :
  ```yaml
  adminer:
    image: adminer
    ports: ["8080:8080"]
    depends_on: [db]
  ```
  Tu auras une UI web pour explorer la DB sans installer pgAdmin.

- **Ajoute Caddy comme reverse proxy** : un seul domaine (`localhost`) qui route `/api/*` vers l'API et le reste vers le front. C'est plus proche de la prod, et ça résout les soucis CORS qui apparaissent dès que tu déploies.

- **Profils Compose `dev` et `prod`** :
  ```yaml
  services:
    api-dev:
      profiles: [dev]
      build: { target: dev }
      volumes: [./api:/app, /app/node_modules]
    api-prod:
      profiles: [prod]
      build: { target: production }
  ```
  Lance avec `docker compose --profile dev up` ou `--profile prod up`.

- **Image scratch ou distroless** pour la prod : repars du stage `production` mais base sur `gcr.io/distroless/nodejs22` au lieu de `node:22-alpine`. ~ 90 Mo, pas de shell, pas de package manager → surface d'attaque minimale.

- **Healthcheck Redis avec authentification** : si tu actives `--requirepass`, change le healthcheck en `redis-cli -a $REDIS_PASSWORD ping` (avec un secret monté en variable, pas en clair dans le compose).
