/**
 * Mustache / Handlebars ライクな簡易テンプレートエンジン。
 * 本番では mustache パッケージ等に差し替えても構いません。
 */
export function renderTemplate(
  template: string,
  vars: Record<string, unknown>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(String(value));
  }
  return result;
}
