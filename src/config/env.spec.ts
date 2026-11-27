import { validateEnv } from './env.js';

describe('validateEnv', () => {
  it('applies defaults for an empty environment', () => {
    const env = validateEnv({});
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
  });

  it('coerces PORT from a string', () => {
    expect(validateEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects an invalid download URL with a readable message', () => {
    expect(() => validateEnv({ ANDROID_DOWNLOAD_URL: 'not a url' })).toThrow(
      /ANDROID_DOWNLOAD_URL/,
    );
  });
});
