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
    # /api/v1/ -> http://backend:3000/ にマッピング
    location /api/v1/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        # エラーをインターセプト
        proxy_intercept_errors on;
        # 4xxエラーをハンドル
        error_page 400 401 402 403 404 405 406 407 408 409 410 411 412 413 414 415 416 417 418 421 422 423 424 425 426 428 429 431 451 = @api_error;
        error_page 500 501 502 503 504 505 506 507 508 510 511 = @api_error;
    }

    # APIエラーをJSONで返す
    location @api_error {
        default_type application/json;
        return 200 '[]';
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
