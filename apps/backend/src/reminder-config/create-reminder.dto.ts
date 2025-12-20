import {
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateReminderDto {
  @IsInt()
  @Min(0)
  daysBefore: number; // X日前

  @IsInt()
  @Min(0)
  @Max(23)
  sendHour: number;   // UTC 時間（0‑23）
}
