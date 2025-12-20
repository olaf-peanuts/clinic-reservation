import {
  IsString,
  Matches,
} from 'class-validator';

export class CreateNurseDto {
  @IsString()
  employeeNumber: string; // Azure AD の社員番号

  @IsString()
  title?: string;
}
