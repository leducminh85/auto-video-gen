const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function readCookies(file = path.resolve('chatgpt-cookie.json'), now = Date.now() / 1000) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  let data;
  try { data = JSON.parse(raw.replace(/^\uFEFF/, '')); }
  catch { throw new Error('chatgpt-cookie.json không phải JSON hợp lệ.'); }
  const source = Array.isArray(data) ? data : data?.cookies;
  if (!Array.isArray(source) || source.length > 500) throw new Error('File cần chứa mảng cookie hoặc đối tượng có trường cookies.');
  const cookies = [];
  for (const cookie of source) {
    if (!cookie || typeof cookie.domain !== 'string') continue;
    const domain = cookie.domain.replace(/^\./, '').toLowerCase();
    if (domain !== 'chatgpt.com' && !domain.endsWith('.chatgpt.com')) continue;
    if (typeof cookie.name !== 'string' || !cookie.name || typeof cookie.value !== 'string') throw new Error('Cookie ChatGPT thiếu tên hoặc giá trị hợp lệ.');
    const expiry = cookie.session ? -1 : Number(cookie.expires ?? cookie.expirationDate ?? -1);
    if (!Number.isFinite(expiry)) throw new Error('Thời hạn cookie ChatGPT không hợp lệ.');
    if (expiry !== -1 && expiry <= now) continue;
    const sameSite = { strict: 'Strict', lax: 'Lax', none: 'None', no_restriction: 'None', unspecified: 'Lax' }[String(cookie.sameSite || 'lax').toLowerCase()];
    if (!sameSite) throw new Error('Thuộc tính sameSite của cookie không được hỗ trợ.');
    cookies.push({ name: cookie.name, value: cookie.value, domain: cookie.domain, path: typeof cookie.path === 'string' && cookie.path.startsWith('/') ? cookie.path : '/',
      httpOnly: !!cookie.httpOnly, secure: !!cookie.secure, sameSite, expires: expiry });
  }
  if (!cookies.length) throw new Error('File không có cookie ChatGPT còn hạn. Hãy xuất lại từ phiên đang đăng nhập.');
  return { cookies, fingerprint: createHash('sha256').update(raw).digest('hex') };
}

async function applyCookies(browser) {
  const imported = readCookies();
  if (!imported || imported.fingerprint === browser.cookieFingerprint) return false;
  try { await browser.context.addCookies(imported.cookies); }
  catch { throw new Error('Không nạp được cookie ChatGPT vào Playwright. Kiểm tra định dạng file xuất.'); }
  browser.cookieFingerprint = imported.fingerprint;
  return true;
}
module.exports = { readCookies, applyCookies };
