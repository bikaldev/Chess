FROM node:23-alpine

WORKDIR /usr/server

COPY ./package.json ./

RUN npm install

COPY ./ ./

CMD ["npm", "start"]