import { IsUUID, IsString, Matches, IsISO8601 } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  doctorId: string;

  @IsString()
  employeeNumber: string; // フロントは社員番号で指定、バックエンド側で Employee に変換

  @IsUUID()
  nurseId?: string;       // 任意（未設定でも OK）

  @IsISO8601()
  startUtc: string;

  @IsISO8601()
  endUtc: string;
}
