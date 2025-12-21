

import { api } from '@/api/client';
import { DoctorTimingConfig, TimezoneConfig } from '../types/config';

export const configApi = {
  // Doctor Timing Settings
  getDoctorTimingSettings: async () => {
    return api.get<DoctorTimingConfig>('/config/doctor-timing-settings');
  },

  updateDoctorTimingSettings: async (data: DoctorTimingConfig) => {
    return api.put<DoctorTimingConfig>('/config/doctor-timing-settings', data);
  },

  // Timezone Settings
  getTimezone: async () => {
    return api.get<TimezoneConfig>('/config/timezone');
  },

  updateTimezone: async (timezone: string) => {
    return api.put<TimezoneConfig>('/config/timezone', { timezone });
  },
};
