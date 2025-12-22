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

# Nginxプロキシ設定を追加
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # フロントエンド静的ファイル
    location / {
        try_files $uri $uri/ /index.html;
    }

    # バックエンドAPIへのプロキシ
    # /api/v1/ -> http://backend:3000/api/v1/ にマッピング
    location /api/v1/ {
        proxy_pass http://backend:3000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
