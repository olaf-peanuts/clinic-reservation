import axios from 'axios';

// バックエンドのベースパスは /api/v1（docker-compose のバックエンドが同一ホストにある想定）
const api = axios.create({
  baseURL: '/api/v1',
});

export default api;
