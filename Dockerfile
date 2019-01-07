# builder image
FROM node:8-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --no-optional

COPY . .

RUN npm run build

# production image
FROM node:8-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --no-optional &&\
    npm cache clean --force

COPY --from=builder /usr/src/app/build ./build/

EXPOSE 9100

CMD [ "node", "build/index.js" ]
