import {
  IsString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  azureObjectId?: string;

  @IsString()
  @IsOptional()
  honorific?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  minDurationMinutes?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  defaultDurationMinutes?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxDurationMinutes?: number;
}
