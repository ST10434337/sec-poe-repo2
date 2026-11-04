FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY . .

# Run as the unprivileged user that ships with the node image
RUN chown -R node:node /app
USER node

EXPOSE 4000

CMD ["npm", "start"]