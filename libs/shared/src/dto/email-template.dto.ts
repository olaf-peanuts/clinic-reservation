export interface EmailTemplateDto {
  id: string;
  name: string;      // 例: "Reminder"
  subject: string;
  body: string;      // Mustache / Handlebars 形式のテンプレート文字列
}
