import { randomUUID } from 'crypto';

/**
 * Custom exception for adapter assertion failures
 * This is a simple Error subclass to avoid depending on @nestjs/common in runtime
 */
class AdapterAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdapterAssertionError';
  }
}

/**
 * Generate a UUID v4
 */
function uuid(): string {
  return randomUUID();
}

/**
 * Convert string to URL-friendly slug
 *
 * @param text - Text to slugify
 * @returns Slugified text
 *
 * @example
 * slugify('Hello World!') // 'hello-world'
 * slugify('Foo & Bar') // 'foo-and-bar'
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/_+/g, '-') // Replace underscores with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Extract file extension from filename
 *
 * @param filename - Filename to extract extension from
 * @returns File extension (without dot)
 *
 * @example
 * ext('image.jpg') // 'jpg'
 * ext('document.pdf') // 'pdf'
 */
function ext(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts[parts.length - 1] || '') : '';
}

/**
 * Pick specific properties from an object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only the specified keys
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 */
function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Assert a condition, throw AdapterAssertionError if false
 *
 * @param condition - Condition to assert
 * @param message - Error message if assertion fails
 * @throws AdapterAssertionError if condition is falsy
 *
 * @example
 * assert(user.email, 'Email is required');
 * assert(age >= 18, 'Must be 18 or older');
 */
function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new AdapterAssertionError(message || 'Assertion failed');
  }
}

/**
 * Helper utilities object exported to adapter context
 * Note: upload utilities are placeholders and should be implemented by the user
 *
 * Important: This object preserves the assertion signature for assert()
 * Type it explicitly to avoid losing the 'asserts' type guard
 */
export const helpers = {
  uuid,
  slugify,
  ext,
  pick,
  assert,
  upload: {
    // Placeholder - users should implement their own upload logic
    // Example implementation:
    // async minio(file: Express.Multer.File, bucket: string = 'default'): Promise<string> {
    //   const minioClient = new Minio.Client({ ... });
    //   const filename = `${uuid()}-${file.originalname}`;
    //   await minioClient.putObject(bucket, filename, file.buffer);
    //   return `https://minio.example.com/${bucket}/${filename}`;
    // }
  },
} as const;

