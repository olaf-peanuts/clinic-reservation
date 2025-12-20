export interface DoctorDto {
  id: string;
  employeeId: string;          // Employee テーブルの ID（外部キー）
  title?: string;
  minDurationMin: number;
  defaultDurationMin: number;
  maxDurationMin: number;
}
