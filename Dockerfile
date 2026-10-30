# builder image
FROM node:24.22.1-alpine3.24 AS builder

USER node

WORKDIR /usr/src/app

COPY --chown=node:node scripts/version-update.mjs ./scripts/
COPY --chown=node:node .npmrc package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

# production installer image
FROM node:24.22.1-alpine3.24 AS prod-installer

USER node

WORKDIR /app

ENV NODE_ENV=production

COPY --chown=node:node package*.json ./
COPY --chown=node:node .npmrc ./
COPY --chown=node:node --from=builder /home/node/.npm/ /home/node/.npm/

RUN npm ci --prefer-offline --no-audit --no-progress

# production image
FROM node:24.22.1-alpine3.24

RUN adduser -D -u 12345 -h /home/nodeapp -s /bin/sh nodeapp && \
        addgroup -g 12321 nodedevs && addgroup node nodedevs && addgroup nodeapp nodedevs

USER node

WORKDIR /app

COPY --chown=node:node .npmrc package.json ./
COPY --from=builder /usr/src/app/build ./build/
COPY --from=prod-installer /app/node_modules ./node_modules/
COPY --chown=node:node api ./api/

USER nodeapp

ENV NODE_ENV=production

HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --start-interval=1s --retries=3 \
        CMD [ "node", "build/healthcheck.js" ]

CMD [ "node", "build/otel.js" ]

# Metadata
LABEL org.opencontainers.image.vendor="Authkeys" \
	org.opencontainers.image.source="https://github.com/theoapp/theo-node" \
	org.opencontainers.image.title="Theo Server" \
	org.opencontainers.image.description="The authorized keys manager" \
	org.opencontainers.image.documentation="https://theoapp.readthedocs.io" \
	org.opencontainers.image.licenses='Apache-2.0'
