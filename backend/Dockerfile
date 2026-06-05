FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci --omit=dev
COPY . .
EXPOSE 8227
CMD ["npm", "start"]
