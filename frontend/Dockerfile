# Dev : image alignée sur docker-compose (install + vite).
# Pour une image de prod statique, préférez `npm run build` + `nginx` (voir Netlify).
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 5320
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
