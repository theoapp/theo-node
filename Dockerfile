# builder image
FROM node:18.18.0-alpine3.18 AS builder

WORKDIR /usr/src/app

COPY .npmrc package*.json ./

RUN npm ci --omit-optional

COPY . .

RUN npm run build

# production image
FROM node:18.18.0-alpine3.18

ENV NODE_APP_PATH=/app
ENV NODE_ENV=production

RUN mkdir ${NODE_APP_PATH} && chown node:node ${NODE_APP_PATH} && chmod 775 ${NODE_APP_PATH} && \
        adduser -D -u 12345 -h /home/nodeapp -s /bin/sh nodeapp && \
        addgroup -g 12321 nodedevs && addgroup node nodedevs && addgroup nodeapp nodedevs

USER node

WORKDIR ${NODE_APP_PATH}

COPY .npmrc package*.json ./

RUN npm ci --omit=optional &&\
    npm cache clean --force

COPY --from=builder /usr/src/app/build ./build/

EXPOSE 9100

USER nodeapp

CMD [ "node", "build/index.js" ]

# Metadata
LABEL org.opencontainers.image.vendor="Authkeys" \
	org.opencontainers.image.url="https://theo.authkeys.io" \
	org.opencontainers.image.source="https://github.com/theoapp/theo-node" \
	org.opencontainers.image.title="Theo Server" \
	org.opencontainers.image.description="The authorized keys manager" \
	org.opencontainers.image.version="2.0.9" \
	org.opencontainers.image.documentation="https://theoapp.readthedocs.io" \
	org.opencontainers.image.licenses='Apache-2.0'
