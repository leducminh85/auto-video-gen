const test = require('node:test');
const assert = require('node:assert/strict');
const { connectionStatus } = require('./chatgptStatus.cjs');
test('requires authenticated session and visible composer before declaring ready', () => {
  assert.equal(connectionStatus({ authenticated: true, composerVisible: true, sessionChecked: true }).connected, true);
  assert.equal(connectionStatus({ authenticated: false, composerVisible: true, sessionChecked: true }).state, 'login_required');
  assert.equal(connectionStatus({ authenticated: true, composerVisible: false, sessionChecked: true }).state, 'page_not_ready');
  assert.equal(connectionStatus({ authenticated: true, challenge: true, sessionChecked: true }).state, 'verification_required');
  assert.equal(connectionStatus({ sessionChecked: false }).state, 'session_unavailable');
});
