import {
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsString()
  title?: string;

  @IsInt()
  @Min(1)
  minDurationMin: number; // 分単位

  @IsInt()
  @Min(1)
  defaultDurationMin: number;

  @IsInt()
  @Min(1)
  maxDurationMin: number;
}
