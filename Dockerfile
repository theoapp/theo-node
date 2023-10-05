# builder image
FROM node:18.18.0-alpine3.18 AS builder

WORKDIR /usr/src/app

COPY .npmrc package*.json ./

RUN npm ci --omit-optional

COPY . .

RUN npm run build

# production image
FROM node:18.18.0-alpine3.18

ENV NODE_ENV=production

WORKDIR /app

COPY .npmrc package*.json ./

RUN npm ci --omit=optional &&\
    npm cache clean --force

COPY --from=builder /usr/src/app/build ./build/

EXPOSE 9100

CMD [ "node", "build/index.js" ]

# Metadata
LABEL org.opencontainers.image.vendor="Authkeys" \
	org.opencontainers.image.url="https://theo.authkeys.io" \
	org.opencontainers.image.source="https://github.com/theoapp/theo-node" \
	org.opencontainers.image.title="Theo Server" \
	org.opencontainers.image.description="The authorized keys manager" \
	org.opencontainers.image.version="2.0.5" \
	org.opencontainers.image.documentation="https://theoapp.readthedocs.io" \
	org.opencontainers.image.licenses='Apache-2.0'
