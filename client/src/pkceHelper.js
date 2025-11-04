// --- 1. Generates a random string for the 'code_verifier' ---
function dec2hex(dec) {
  return ('0' + dec.toString(16)).substr(-2);
}

function generateCodeVerifier() {
  var array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

// --- 2. Hashes the 'code_verifier' to create the 'code_challenge' ---
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

// --- 3. Export the functions ---
export async function createPkceChallenge() {
  const v = generateCodeVerifier();
  const c = await generateCodeChallenge(v);
  return { verifier: v, challenge: c };
}