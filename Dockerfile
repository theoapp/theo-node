# builder image
FROM node:12-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --no-optional

COPY . .

RUN npm run build

# production image
FROM node:12-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --no-optional &&\
    npm cache clean --force

COPY --from=builder /usr/src/app/build ./build/

EXPOSE 9100

CMD [ "node", "build/index.js" ]

# Metadata
LABEL org.opencontainers.image.vendor="Authkeys" \
	org.opencontainers.image.url="https://theo.authkeys.io" \
	org.opencontainers.image.title="Theo Node Server" \
	org.opencontainers.image.description="The authorized keys manager" \
	org.opencontainers.image.version="0.18.4" \
	org.opencontainers.image.documentation="https://theoapp.readthedocs.io"
