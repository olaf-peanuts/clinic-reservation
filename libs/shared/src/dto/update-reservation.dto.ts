import { IsOptional, IsISO8601 } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsISO8601()
  startUtc?: string;

  @IsOptional()
  @IsISO8601()
  endUtc?: string;
}
