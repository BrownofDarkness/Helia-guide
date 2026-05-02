# Dockerfile API — multi-stage

# ─── Stage 1 : dev (avec hot-reload) ──────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app

# Création d'un user non-root
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
RUN chown -R app:app /app
USER app

COPY --chown=app:app package*.json ./
RUN npm install

# Le code sera bind-mounté en dev via compose
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/index.ts"]


# ─── Stage 2 : builder (compile TS → JS) ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# ─── Stage 3 : production (image minimale) ────────────────────────────
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
