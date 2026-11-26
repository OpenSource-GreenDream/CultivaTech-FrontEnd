export interface JwtPayload {
  sub?: string;
  exp?: number;
  iss?: string;
  iat?: number;
}

export class JwtDecoder {
  static decode(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      throw new Error('INVALID_JWT_FORMAT');
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    let json: string;
    try {
      json = atob(padded);
    } catch {
      throw new Error('INVALID_JWT_PAYLOAD');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(json);
    } catch {
      throw new Error('INVALID_JWT_PAYLOAD');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('INVALID_JWT_PAYLOAD');
    }

    const typedPayload = payload as JwtPayload;
    if (typeof typedPayload.sub !== 'string' || typedPayload.sub.trim() === '') {
      throw new Error('MISSING_JWT_SUBJECT');
    }
    if (typeof typedPayload.exp !== 'number' || !Number.isFinite(typedPayload.exp)) {
      throw new Error('MISSING_JWT_EXPIRATION');
    }

    return typedPayload;
  }
}
