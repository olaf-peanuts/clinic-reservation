export interface NurseDto {
  id: string;
  employeeId: string;   // Employee テーブルの ID（外部キー）
  title?: string;
}
