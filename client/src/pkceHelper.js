// --- 1. Helper function ---
function dec2hex(dec) {
  return ('0' + dec.toString(16)).substr(-2);
}

// --- 2. Code Verifier (for PKCE) ---
function generateCodeVerifier() {
  var array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

// --- 3. Code Challenge (for PKCE) ---
function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(v) {
  var hashed = await sha256(v);
  var base64encoded = base64urlencode(hashed);
  return base64encoded;
}

// --- 4. State (for Login CSRF) ---
export function generateState() {
  var array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

// --- 5. Nonce (for Replay Attacks) ---
// THIS IS THE NEW FUNCTION
export function generateNonce() {
  var array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

// --- 6. Main Export (for PKCE) ---
export async function createPkceChallenge() {
  const v = generateCodeVerifier();
  const c = await generateCodeChallenge(v);
  return { verifier: v, challenge: c };
}