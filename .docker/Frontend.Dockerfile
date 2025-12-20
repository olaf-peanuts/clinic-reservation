# ---------- Builder ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY apps/frontend ./apps/frontend
COPY libs/shared ./libs/shared
COPY tsconfig.base.json .

WORKDIR /app/apps/frontend

RUN npm install --legacy-peer-deps && npm run build   # Vite が dist ディレクトリを生成

# ---------- Runtime ----------
FROM nginx:alpine

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
