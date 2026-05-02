FROM node:22-alpine AS dev
WORKDIR /app

RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
RUN chown -R app:app /app
USER app

COPY --chown=app:app package*.json ./
RUN npm install

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
