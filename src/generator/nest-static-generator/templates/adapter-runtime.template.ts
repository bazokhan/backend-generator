export const adapterRuntimeTemplate = `import type {
  AdapterConfig,
  AdapterHandler,
  AdapterFactoryResult,
  AdapterDirectResponse,
} from './types';

/**
 * Create a JSON-based adapter endpoint
 * 
 * @param config - Configuration for the adapter endpoint
 * @param handler - Async handler function that processes the request
 * @returns Adapter definition
 * 
 * @example
 * export default adapter.json({
 *   method: 'POST',
 *   path: '/custom-create',
 *   target: 'UserService.createOne',
 *   auth: 'JwtAuthGuard',
 * }, async (ctx) => {
 *   const { body, helpers } = ctx;
 *   const slug = helpers.slugify(body.name);
 *   return { args: { ...body, slug } };
 * });
 */
export function json(
  config: AdapterConfig,
  handler: AdapterHandler
): AdapterFactoryResult {
  return {
    config,
    handler,
    type: 'json',
  };
}

/**
 * Create a multipart/form-data adapter endpoint for file uploads
 * 
 * @param config - Configuration for the adapter endpoint
 * @param handler - Async handler function that processes the request
 * @returns Adapter definition
 * 
 * @example
 * export default adapter.multipart({
 *   method: 'POST',
 *   path: '/upload-avatar',
 *   target: 'UserService.update',
 * }, async (ctx) => {
 *   const { body, files, helpers } = ctx;
 *   const file = Array.isArray(files) ? files[0] : files;
 *   const url = await helpers.upload.minio(file, 'avatars');
 *   return { args: { avatarUrl: url } };
 * });
 */
export function multipart(
  config: AdapterConfig,
  handler: AdapterHandler
): AdapterFactoryResult {
  return {
    config,
    handler,
    type: 'multipart',
  };
}

/**
 * Create a direct response without calling a service method
 * 
 * @param status - HTTP status code
 * @param body - Response body
 * @param headers - Optional response headers
 * @returns Direct response object
 * 
 * @example
 * export default adapter.json({
 *   method: 'POST',
 *   path: '/webhook',
 * }, async (ctx) => {
 *   // Process webhook
 *   await processWebhook(ctx.body);
 *   return adapter.response(200, { success: true });
 * });
 */
export function response(
  status: number,
  body: any,
  headers?: Record<string, string>
): AdapterDirectResponse {
  return {
    status,
    body,
    headers,
    __isDirectResponse: true,
  };
}

/**
 * Main adapter factory object
 */
export const adapter = {
  json,
  multipart,
  response,
};
`;

