FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install && npm run build 

ENV NODE_ENV=production
CMD [ "node", "server/build/index.js" ]
