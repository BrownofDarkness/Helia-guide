# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app

# wget pour HEALTHCHECK + tini pour signal handling correct
RUN apk add --no-cache wget tini && \
    addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps" \
    PORT=3000

USER app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
