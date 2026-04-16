/**
 * Base64 encodes a string to be used in data-test-id attributes.
 */
export function encodePath(path: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(path).toString('base64');
  }
  return btoa(path);
}
