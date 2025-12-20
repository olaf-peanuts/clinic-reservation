export interface ReminderConfigDto {
  id: string;
  daysBefore: number;   // X日前
  sendHour: number;     // 0‑23 (UTC)
}
