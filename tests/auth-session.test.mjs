import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAuthState,
  expireSession,
  finishMockLogin,
  logout,
  startDemoLogin,
  startLogin,
  tickRateLimit,
} from '../src/scripts/auth-session.js';

test('login requires account and password before submitting', () => {
  const state = startLogin(createAuthState(), { account: '', password: '' });

  assert.equal(state.phase, 'signed-out');
  assert.deepEqual(state.errors, {
    account: '請輸入帳號。',
    password: '請輸入密碼。',
  });
});

test('mock success creates an anonymous memory-only session', () => {
  const submitting = startDemoLogin(createAuthState());
  const state = finishMockLogin(submitting, 'success');

  assert.equal(state.phase, 'active');
  assert.equal(state.errors.account, '');
  assert.equal(state.errors.password, '');
  assert.equal('account' in state, false);
  assert.equal('accessToken' in state, false);
  assert.equal('refreshToken' in state, false);
});

test('mock invalid credentials and service outage expose generic recoverable states', () => {
  const submitting = startDemoLogin();

  assert.equal(finishMockLogin(submitting, 'invalid').phase, 'invalid-credentials');
  assert.equal(finishMockLogin(submitting, 'unavailable').phase, 'service-unavailable');
  assert.equal(finishMockLogin(finishMockLogin(submitting, 'unavailable'), 'retry').phase, 'submitting');
});

test('mock rate limit counts down to a usable signed-out form', () => {
  const submitting = startDemoLogin();
  const limited = finishMockLogin(submitting, 'rate-limited', 2);

  assert.equal(limited.phase, 'rate-limited');
  assert.equal(limited.rateLimitRemaining, 2);
  assert.equal(tickRateLimit(limited).rateLimitRemaining, 1);
  assert.equal(tickRateLimit(tickRateLimit(limited)).phase, 'signed-out');
});

test('expired and logout sessions return to signed out without credentials', () => {
  const active = finishMockLogin(startDemoLogin(), 'success');

  assert.equal(expireSession(active).phase, 'expired');
  assert.equal(logout(active).phase, 'signed-out');
  assert.equal(logout(expireSession(active)).phase, 'signed-out');
});
