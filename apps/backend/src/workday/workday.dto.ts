import { IsArray, ArrayNotEmpty, IsInt, Min, Max } from 'class-validator';

export class SetWorkdaysDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[]; // 例: [1,2,3,4,5]（月〜金）
}
