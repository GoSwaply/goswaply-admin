const SENSITIVE_KEYS = new Set([
  "password",
  "pin",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "api_key",
  "key",
  "bvn",
  "nin",
  "card",
  "pan",
  "cvv",
  "signature",
  "privatekey",
  "private_key",
  "session",
  "otp",
  "ssn",
  "secretkey",
  "secret_key",
  "webhooksecret",
  "webhook_secret",
]);

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

export function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = isSensitiveKey(k) ? "[REDACTED]" : redactObject(v);
    }
    return result;
  }
  return obj;
}

const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /authorization:\s*\S+/gi,
  /(?:password|pin|bvn|nin|otp|cvv|pan)\s*[:=]\s*\S+/gi,
  /(?:eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g, // JWT
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // card PAN-like
  /\b\d{11}\b/g, // NIN/phone-length
];

export function redactSensitiveText(input: string): string {
  let output = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    output = output.replace(pattern, "[REDACTED]");
  }
  return output;
}

export function safeJsonStringify(value: unknown, indent = 2): string {
  try {
    return JSON.stringify(redactObject(value), null, indent);
  } catch {
    return "[Unserializable value]";
  }
}
