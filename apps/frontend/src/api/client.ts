import axios from 'axios';

// Axios インスタンス
// バックエンドは同じホストの /api/v1 の下にあると想定
export const api = axios.create({
  baseURL: '/api/v1',
});

// 開発環境用ダミー認証ヘッダー
api.interceptors.request.use(config => {
  // 開発環境では認証をスキップ
  // 本番環境では Azure AD トークンを使用
  return config;
});

// エラーハンドリング: 404の場合はモック データを返す
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 404) {
      // サイレントに空配列を返す
      return Promise.resolve({ data: [], status: 200 });
    }
    return Promise.reject(error);
  }
);

// Reservation API
export const reservationApi = {
  create: async (data: {
    employeeId: string;
    doctorId: number;
    startAt: string; // ISO string
    durationMinutes: number;
  }) => {
    return api.post('/reservations', {
      employeeId: data.employeeId,
      doctorId: data.doctorId,
      startAt: data.startAt,
      durationMinutes: data.durationMinutes,
    });
  },
};

// System Config API
export const systemConfigApi = {
  getDoctorDefaultDuration: async () => {
    return api.get('/config/doctor-default-duration');
  },
  updateDoctorDefaultDuration: async (defaultDurationMinutes: number) => {
    return api.put('/config/doctor-default-duration', {
      defaultDurationMinutes,
    });
  },
  getTimezone: async () => {
    return api.get('/config/timezone');
  },
  updateTimezone: async (timezone: string) => {
    return api.put('/config/timezone', { timezone });
  },
  getExaminationRooms: async () => {
    return api.get('/config/examination-rooms');
  },
  updateExaminationRooms: async (numberOfRooms: number) => {
    return api.put('/config/examination-rooms', { numberOfRooms });
  },
  getDoctorTimingSettings: async () => {
    return api.get('/config/doctor-timing-settings');
  },
  updateDoctorTimingSettings: async (data: {
    minDurationMinutes: number;
    defaultDurationMinutes: number;
    maxDurationMinutes: number;
  }) => {
    return api.put('/config/doctor-timing-settings', data);
  },
};
