const emptyErrors = () => ({ account: '', password: '' });

export function createAuthState() {
  return { phase: 'signed-out', errors: emptyErrors(), rateLimitRemaining: 0 };
}

export function canUseApp(state) {
  return state.phase === 'active';
}

export function startDemoLogin() {
  return { ...createAuthState(), phase: 'submitting' };
}

export function startLogin(state, credentials) {
  const errors = emptyErrors();
  if (!credentials.account.trim()) errors.account = '請輸入帳號。';
  if (!credentials.password) errors.password = '請輸入密碼。';
  if (errors.account || errors.password) return { ...createAuthState(), errors };
  return { ...createAuthState(), phase: 'submitting' };
}

export function finishMockLogin(state, outcome, retryAfterSeconds = 5) {
  if (outcome === 'retry') return { ...createAuthState(), phase: 'submitting' };
  if (state.phase !== 'submitting') return state;
  if (outcome === 'success') return { ...createAuthState(), phase: 'active' };
  if (outcome === 'invalid') return { ...createAuthState(), phase: 'invalid-credentials' };
  if (outcome === 'unavailable') return { ...createAuthState(), phase: 'service-unavailable' };
  if (outcome === 'rate-limited') return { ...createAuthState(), phase: 'rate-limited', rateLimitRemaining: Math.min(600, Math.max(1, Math.floor(retryAfterSeconds))) };
  return { ...createAuthState(), phase: 'service-unavailable' };
}

export function tickRateLimit(state) {
  if (state.phase !== 'rate-limited') return state;
  const rateLimitRemaining = Math.max(0, state.rateLimitRemaining - 1);
  return rateLimitRemaining ? { ...state, rateLimitRemaining } : createAuthState();
}

export function expireSession(state) {
  return state.phase === 'active' ? { ...createAuthState(), phase: 'expired' } : state;
}

export function logout() {
  return createAuthState();
}
