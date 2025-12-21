import { IsInt, IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class TimePeriodDto {
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}

export class CreateDoctorScheduleDto {
  @IsInt()
  @IsNotEmpty()
  doctorId: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimePeriodDto)
  timePeriods: TimePeriodDto[];
}
