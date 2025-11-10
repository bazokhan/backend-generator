export const adapterRuntimeTemplate = `import type {
  AdapterConfig,
  AdapterHandler,
  AdapterFactoryResult,
  AdapterDirectResponse,
} from './types';

/**
 * Create a JSON-based adapter endpoint
 * 
 * @template TBody - Type of request body (from ctx.body)
 * @template TQuery - Type of query parameters (from ctx.query)
 * @template TParams - Type of route parameters (from ctx.params)
 * 
 * @param config - Configuration for the adapter endpoint
 * @param handler - Async handler function that processes the request
 * @returns Adapter definition
 * 
 * @example
 * // Without types (ctx properties will be 'any')
 * export default adapter.json({
 *   method: 'POST',
 *   path: '/custom-create',
 *   target: 'UserService.createOne',
 * }, async (ctx) => {
 *   const { body, helpers } = ctx;
 *   return { args: body };
 * });
 * 
 * @example
 * // With types (ctx properties will be fully typed)
 * interface CreatePostBody {
 *   title: string;
 *   content: string;
 * }
 * 
 * export default adapter.json<CreatePostBody>({
 *   method: 'POST',
 *   path: '/custom-create',
 *   target: 'PostService.create',
 * }, async (ctx) => {
 *   // ctx.body is now typed as CreatePostBody
 *   const title: string = ctx.body.title; // ✓ No TypeScript error
 *   const slug = helpers.slugify(ctx.body.title);
 *   return { args: { ...ctx.body, slug } };
 * });
 */
export function json<TBody = any, TQuery = any, TParams = any>(
  config: AdapterConfig,
  handler: AdapterHandler<TBody, TQuery, TParams>
): AdapterFactoryResult {
  return {
    config,
    handler: handler as AdapterHandler,
    type: 'json',
  };
}

/**
 * Create a multipart/form-data adapter endpoint for file uploads
 * 
 * @template TBody - Type of request body (from ctx.body)
 * @template TQuery - Type of query parameters (from ctx.query)
 * @template TParams - Type of route parameters (from ctx.params)
 * 
 * @param config - Configuration for the adapter endpoint
 * @param handler - Async handler function that processes the request
 * @returns Adapter definition
 * 
 * @example
 * // Without types
 * export default adapter.multipart({
 *   method: 'POST',
 *   path: '/upload-avatar',
 *   target: 'UserService.update',
 * }, async (ctx) => {
 *   const { body, files } = ctx;
 *   const file = Array.isArray(files) ? files[0] : files;
 *   return { args: { avatarUrl: file.path } };
 * });
 * 
 * @example
 * // With types
 * interface UploadBody {
 *   title: string;
 *   description: string;
 * }
 * 
 * export default adapter.multipart<UploadBody>({
 *   method: 'POST',
 *   path: '/upload',
 *   target: 'FileService.upload',
 * }, async (ctx) => {
 *   // ctx.body is typed as UploadBody
 *   const title: string = ctx.body.title; // ✓ Typed
 *   const file = ctx.files as Multer.File;
 *   return { args: { ...ctx.body, fileUrl: file.path } };
 * });
 */
export function multipart<TBody = any, TQuery = any, TParams = any>(
  config: AdapterConfig,
  handler: AdapterHandler<TBody, TQuery, TParams>
): AdapterFactoryResult {
  return {
    config,
    handler: handler as AdapterHandler,
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
