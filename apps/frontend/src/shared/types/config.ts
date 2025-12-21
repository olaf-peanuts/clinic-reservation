// Doctor Timing Settings
export interface DoctorTimingConfig {
  minDurationMinutes: number;
  defaultDurationMinutes: number;
  maxDurationMinutes: number;
  honorific: string;
}

// Timezone Config
export interface TimezoneConfig {
  timezone: string;
}

// Combined System Config
export interface SystemConfig {
  doctorTiming: DoctorTimingConfig;
  timezone: TimezoneConfig;
}
