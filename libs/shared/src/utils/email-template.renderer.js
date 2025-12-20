"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
/**
 * Mustache / Handlebars ライクな簡易テンプレートエンジン。
 * 本番では mustache パッケージ等に差し替えても構いません。
 */
function renderTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        const placeholder = `{{${key}}}`;
        result = result.split(placeholder).join(String(value));
    }
    return result;
}
