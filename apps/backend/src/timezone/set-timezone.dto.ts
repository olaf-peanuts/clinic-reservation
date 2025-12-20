import {
  IsString,
  Matches,
} from 'class-validator';

export class SetTimezoneDto {
  @IsString()
  userId: string; // Azure AD Object ID

  // IANA タイムゾーン文字列の簡易バリデーション（例: Asia/Tokyo）
  @Matches(
    /^[A-Za-z]+\/[A-Za-z_]+$/,
    { message: '有効な IANA タイムゾーン形式で入力してください' },
  )
  timezone: string;
}
