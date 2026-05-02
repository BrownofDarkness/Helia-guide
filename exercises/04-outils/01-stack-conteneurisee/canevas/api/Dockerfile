# Dockerfile API — multi-stage à compléter

# ─── Stage 1 : dev (avec hot-reload) ──────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app

# TODO : copier package.json et installer (devDependencies incluses)
# COPY ?
# RUN ?

# Le code sera bind-mounté depuis l'extérieur en dev.
EXPOSE 3000
# TODO : commande de démarrage avec hot-reload (tsx watch)
# CMD [...]


# ─── Stage 2 : production (compilé) ───────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# TODO : copier seulement package.json + package-lock.json
# RUN npm ci --omit=dev pour avoir uniquement les deps prod

# TODO : copier le résultat du build depuis un stage builder
# (à toi de créer un stage builder qui compile TS → JS)

# TODO : créer un user non-root et l'utiliser
# RUN addgroup ... && adduser ...
# USER ...

EXPOSE 3000
# CMD ["node", "dist/index.js"]
