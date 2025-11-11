/**
 * Adapter runtime module
 * 
 * This module provides the runtime functions and types for creating custom adapter endpoints.
 * Import from '@tgraph/backend-generator/runtime/adapters' in your adapter files.
 * 
 * @example
 * import { adapter } from '@tgraph/backend-generator/runtime/adapters';
 * import type { AdapterContext } from '@tgraph/backend-generator/runtime/adapters';
 * 
 * export default adapter.json({
 *   method: 'POST',
 *   path: '/custom',
 *   target: 'UserService.create',
 * }, async (ctx: AdapterContext) => {
 *   return { args: ctx.body };
 * });
 */

// Export adapter factory functions
export { adapter, json, multipart, response } from './runtime';

// Export context builder (used by generated controllers)
export { AdapterContextBuilder } from './context';

// Export helper utilities
export { helpers } from './helpers';

// Export all types
export type {
  HttpMethod,
  AdapterType,
  AdapterConfig,
  IPrismaService,
  AdapterHelpers,
  AdapterDI,
  AdapterContext,
  AdapterDirectResponse,
  AdapterResult,
  AdapterHandler,
  AdapterFactoryResult,
} from './types';

