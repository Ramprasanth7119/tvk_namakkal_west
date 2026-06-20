const SESSION_SECRET = process.env.SESSION_SECRET || "tvk-west-representative-secret-key-2026";

export interface UserSession {
  username: string;
  role: "SUPER_ADMIN" | "REPRESENTATIVE" | "FIELD_OFFICER";
  constituency: string | null;
}

/**
 * Encodes a string to UTF-8 safe representation.
 */
function toUtf8String(str: string): string {
  try {
    return unescape(encodeURIComponent(str));
  } catch (err) {
    return str;
  }
}

/**
 * Safe Base64 encoding using standard Web APIs.
 */
export function base64Encode(str: string): string {
  if (typeof btoa === "function") {
    return btoa(toUtf8String(str));
  }
  return Buffer.from(str, "utf8").toString("base64");
}

/**
 * Safe Base64 decoding using standard Web APIs.
 */
export function base64Decode(str: string): string {
  if (typeof atob === "function") {
    try {
      const decoded = atob(str);
      return decodeURIComponent(escape(decoded));
    } catch (err) {
      return atob(str);
    }
  }
  return Buffer.from(str, "base64").toString("utf8");
}

/**
 * Pure JavaScript standard SHA-256 implementation.
 * Extremely high-performance, compatible with Node.js and Edge Runtime.
 */
export function sha256(ascii: string): string {
  const safeStr = toUtf8String(ascii);
  
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  const asciiLength = safeStr.length;
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const wordsCount = ((asciiLength + 8) >> 6) + 1;
  const totalWords = wordsCount * 16;
  
  for (let idx = 0; idx < totalWords; idx++) {
    words[idx] = 0;
  }

  for (let idx = 0; idx < asciiLength; idx++) {
    words[idx >> 2] |= (safeStr.charCodeAt(idx) & 0xff) << (24 - (idx % 4) * 8);
  }

  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);

  const totalBits = asciiLength * 8;
  words[totalWords - 1] = totalBits & 0xffffffff;
  words[totalWords - 2] = (totalBits / 0x100000000) & 0xffffffff;

  const w = new Array(64);
  for (let block = 0; block < wordsCount; block++) {
    const blockStart = block * 16;
    for (let idx = 0; idx < 16; idx++) {
      w[idx] = words[blockStart + idx];
    }
    for (let idx = 16; idx < 64; idx++) {
      const s0 = rightRotate(w[idx - 15], 7) ^ rightRotate(w[idx - 15], 18) ^ (w[idx - 15] >>> 3);
      const s1 = rightRotate(w[idx - 2], 17) ^ rightRotate(w[idx - 2], 19) ^ (w[idx - 2] >>> 10);
      w[idx] = (w[idx - 16] + s0 + w[idx - 7] + s1) | 0;
    }

    let [a, bVal, c, d, e, f, g, h] = hash;
    for (let idx = 0; idx < 64; idx++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[idx] + w[idx]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & bVal) ^ (a & c) ^ (bVal & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = bVal;
      bVal = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + bVal) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  let hex = '';
  for (let idx = 0; idx < 8; idx++) {
    hex += ('00000000' + (hash[idx] >>> 0).toString(16)).slice(-8);
  }
  return hex;
}

/**
 * Hashes a password using SHA-256 for secure DB storage.
 */
export function hashPassword(password: string): string {
  return sha256(password);
}

/**
 * Signs a session object into a secure base64.signature cookie value.
 * Fully compatible with Edge & Node.js environments.
 */
export function signSession(session: UserSession): string {
  const payload = JSON.stringify(session);
  const b64Payload = base64Encode(payload);
  const hash = sha256(b64Payload + "." + SESSION_SECRET);
  return `${b64Payload}.${hash}`;
}

/**
 * Verifies and decodes a signed session cookie.
 * Returns null if the signature is invalid or tampered with.
 */
export function verifySession(cookieVal: string): UserSession | null {
  try {
    if (!cookieVal) return null;
    const parts = cookieVal.split(".");
    if (parts.length !== 2) return null;
    const [b64Payload, hash] = parts;
    
    // Verify cryptographic signature
    const expectedHash = sha256(b64Payload + "." + SESSION_SECRET);
    if (hash === expectedHash) {
      const payloadStr = base64Decode(b64Payload);
      return JSON.parse(payloadStr) as UserSession;
    }
    return null;
  } catch (err) {
    return null;
  }
}
