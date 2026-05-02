# Exercice 4.1 — Stack conteneurisée Docker Compose

> **Axe** : 4 — Outils du développeur
> **Difficulté** : intermédiaire
> **Durée estimée** : 2 à 4 heures
> **Prérequis** : axe 4 entièrement lu, **Docker installé** (voir ci-dessous)

## ⚙️ Avant de commencer — installer Docker

Si Docker n'est pas encore sur ta machine, suis la section [« Installer Docker » de l'axe 4.4](http://localhost:4321/04-outils/04-docker/#installer-docker) ou ce résumé :

| OS | Quoi | Lien |
|----|------|------|
| **Windows** | Docker Desktop (avec WSL2) | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **macOS** | Docker Desktop ou [OrbStack](https://orbstack.dev/) | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Linux** | Docker Engine + Compose plugin (sans Desktop) | [docs.docker.com/engine/install](https://docs.docker.com/engine/install/) |

**Vérifie que ça marche** avant de poursuivre :

```bash
docker --version            # Docker version 27.x.x
docker compose version      # Docker Compose version v2.x.x
docker run hello-world      # doit afficher "Hello from Docker!"
```

Si l'une de ces commandes échoue : retourne à la doc d'installation. **N'avance pas tant que les trois ne passent pas** — le reste de l'exercice ne marchera pas.

> **Windows + WSL2** : lance les commandes `docker compose up` **depuis ton terminal WSL** (Ubuntu), pas depuis PowerShell, pour des perfs optimales sur les bind mounts.

## 🎯 Objectifs pédagogiques

- Écrire des **Dockerfiles** propres avec multi-stage
- Composer une stack avec **Docker Compose**
- Configurer le **hot-reload** dans un conteneur
- Persister les données avec un **volume nommé**
- Utiliser des **healthchecks** et `depends_on` correctement

## 📋 Énoncé

Tu vas construire l'environnement de dev d'une mini-app full-stack :

- **api** : Node.js + Express + TypeScript, exposé sur :3000
- **web** : Vite + page HTML qui appelle l'API
- **db** : PostgreSQL avec données persistantes
- **redis** : pour de futures files de tâches

Le tout doit démarrer avec **une seule commande** : `docker compose up`.

### Comportement attendu

```bash
$ docker compose up
[+] Running 4/4
 ✔ Container stack-db-1     Healthy
 ✔ Container stack-redis-1  Started
 ✔ Container stack-api-1    Started
 ✔ Container stack-web-1    Started

api-1  | API listening on http://0.0.0.0:3000
web-1  | VITE v5.4.0  ready in 312 ms
web-1  |   ➜  Local:   http://localhost:5173/
```

## ✅ Critères d'acceptation

1. **Démarrage** : `docker compose up` lance les 4 services sans erreur.
2. **API joignable** : `curl http://localhost:3000/health` renvoie `{"status":"ok","db":"ok"}`.
3. **Front joignable** : `http://localhost:5173` affiche une page qui appelle l'API et montre le résultat.
4. **Hot-reload API** : modifier un fichier dans `api/src/` recharge automatiquement.
5. **Hot-reload front** : modifier `web/src/` recharge le navigateur (HMR Vite).
6. **Persistance DB** : `docker compose down && up` conserve les données.
7. **Healthcheck DB** : l'API attend que Postgres soit prêt avant de démarrer.
8. **Pas de root** : les conteneurs API et web tournent en utilisateur non-root.

### Bonus

- **Multi-stage** dans le Dockerfile API avec un stage `production`.
- Une commande `docker compose --profile prod up` qui démarre la version compilée.
- **`.dockerignore`** propre pour éviter de copier `node_modules`.

## 🛠 Comment commencer

```bash
cd canevas/
docker compose up --build
```

Le canevas contient :

- `compose.yml` avec des `# TODO` pour configurer chaque service
- `api/Dockerfile` à compléter
- `web/Dockerfile` à compléter
- Code source minimal pour API (Express + TS) et web (Vite vanilla)
- Schema SQL d'init dans `db/init/01-schema.sql`

## 🧪 S'auto-valider

Le script `tests/run.sh` vérifie automatiquement les critères :

```bash
cd tests/
./run.sh canevas      # ou
./run.sh correction
```

## 💡 Indices

<details>
<summary>1. Comment activer le hot-reload pour l'API en TypeScript ?</summary>

Utilise `tsx watch` :

```dockerfile
# Dans api/Dockerfile
CMD ["npx", "tsx", "watch", "src/index.ts"]
```

Et dans compose.yml, monte le code source en bind :

```yaml
api:
  volumes:
    - ./api:/app
    - /app/node_modules    # ← important : ne pas écraser node_modules du conteneur
```
</details>

<details>
<summary>2. Comment faire attendre l'API que Postgres soit prêt ?</summary>

```yaml
db:
  image: postgres:16-alpine
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U app -d app_dev"]
    interval: 5s
    timeout: 3s
    retries: 5

api:
  depends_on:
    db:
      condition: service_healthy
```
</details>

<details>
<summary>3. Comment exposer le HMR de Vite à l'extérieur du conteneur ?</summary>

Vite par défaut bind sur 127.0.0.1, ce qui ne marche pas dans Docker. Il faut lancer avec `--host 0.0.0.0` :

```dockerfile
# web/Dockerfile
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

Et dans `vite.config.ts`, ajouter :

```ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: { usePolling: true }   // utile sous Windows + WSL
  }
});
```
</details>

## 🔑 Correction

Voir [`correction/`](./correction/).

## 📚 Pour aller plus loin

- Ajoute un service **adminer** (UI Postgres) pour inspecter la DB.
- Ajoute un **reverse proxy** (Caddy) qui sert les deux apps sous un même domaine.
- Configure des **profils Compose** : `dev` (avec bind mounts) et `prod` (sans).
