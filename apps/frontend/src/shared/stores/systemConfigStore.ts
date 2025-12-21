// シンプルな状態管理（複雑な型エラーを避けるため）
const defaultConfig = {
  doctorTiming: {
    minDurationMinutes: 5,
    defaultDurationMinutes: 30,
    maxDurationMinutes: 300,
    honorific: '医師',
  },
  timezone: {
    timezone: 'Asia/Tokyo',
  },
};

let storeConfig = { ...defaultConfig };

export const useSystemConfigStore = () => {
  const getDoctorTiming = () => storeConfig.doctorTiming;
  const getTimezone = () => storeConfig.timezone;
  
  const fetchAllSettings = async () => {
    // No-op for now
  };
  
  const updateDoctorTimingSettings = async (timing: any) => {
    // No-op for now
  };
  
  const updateTimezoneSettings = async (timezone: string) => {
    // No-op for now
  };

  return {
    config: storeConfig,
    loading: false,
    error: null,
    getDoctorTiming,
    getTimezone,
    fetchAllSettings,
    updateDoctorTimingSettings,
    updateTimezoneSettings,
    setConfig: (config: any) => { storeConfig = config; },
    setLoading: () => {},
    setError: () => {},
  };
};
