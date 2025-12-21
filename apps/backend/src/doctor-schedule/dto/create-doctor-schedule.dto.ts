import { IsInt, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TimePeriod {
  @IsString()
  startTime: string; // HH:mm format

  @IsString()
  endTime: string; // HH:mm format
}

export class CreateDoctorScheduleDto {
  @IsInt()
  doctorId: number;

  @IsString()
  date: string; // YYYY-MM-DD format

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimePeriod)
  timePeriods: TimePeriod[];
}
