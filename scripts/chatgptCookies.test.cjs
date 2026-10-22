const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readCookies } = require('./chatgptCookies.cjs');

test('imports extension exports and storageState without unrelated or expired cookies', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wevic-cookies-'));
  const file = path.join(root, 'cookies.json');
  const cookie = { name: 'test-session', value: 'test-value', domain: '.chatgpt.com', path: '/', sameSite: 'no_restriction', secure: true, httpOnly: true, expirationDate: 2000 };
  try {
    fs.writeFileSync(file, JSON.stringify({ cookies: [cookie, { ...cookie, domain: 'unrelated.example' }, { ...cookie, expirationDate: 500 }] }));
    const result = readCookies(file, 1000);
    assert.equal(result.cookies.length, 1);
    assert.equal(result.cookies[0].sameSite, 'None');
    assert.equal(result.cookies[0].expires, 2000);
    fs.writeFileSync(file, JSON.stringify([{ ...cookie, session: true, sameSite: 'Lax' }]));
    assert.equal(readCookies(file, 3000).cookies[0].expires, -1);
    fs.writeFileSync(file, 'malformed-test-secret');
    assert.throws(() => readCookies(file), error => !error.message.includes('malformed-test-secret'));
    fs.writeFileSync(file, JSON.stringify([{ ...cookie, expirationDate: 500 }]));
    assert.throws(() => readCookies(file, 1000), /còn hạn/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
