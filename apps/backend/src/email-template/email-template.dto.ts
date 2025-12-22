import {
  IsString,
  Length,
} from 'class-validator';

export class CreateEmailTemplateDto {
  @IsString()
  @Length(1, 100)
  name: string;      // 例: "Reminder"

  @IsString()
  subject: string;

  @IsString()
  bodyHtml: string;      // Mustache / Handlebars テンプレート文字列
}
