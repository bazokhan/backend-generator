import type { Request, Response } from 'express';

/**
 * HTTP methods supported by adapters
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Adapter type - determines how the request body is parsed
 */
export type AdapterType = 'json' | 'multipart';

/**
 * Configuration object for an adapter endpoint
 */
export interface AdapterConfig {
  /** HTTP method for the endpoint */
  method: HttpMethod;

  /** Route path (relative to the controller base path) */
  path: string;

  /** Target service method in format "ServiceName.methodName" or null to bypass */
  target?: string | null;

  /** Authentication guard name(s) to apply */
  auth?: string | string[];

  /** Fields to select in the response (Prisma select) */
  select?: string[];

  /** Relations to include in the response (Prisma include) */
  include?: string[];

  /** Optional description for OpenAPI documentation */
  description?: string;

  /** Optional summary for OpenAPI documentation */
  summary?: string;

  /** Optional tags for OpenAPI documentation */
  tags?: string[];
}

/**
 * Minimal Prisma service interface
 * Users' PrismaService will satisfy this through structural typing
 * This avoids importing from user code (node_modules can't import from user code)
 */
export interface IPrismaService {
  [key: string]: any;
}

/**
 * Helper utilities available in adapter context
 */
export interface AdapterHelpers {
  /** Generate a UUID v4 */
  uuid(): string;

  /** Convert string to URL-friendly slug */
  slugify(text: string): string;

  /** Extract file extension from filename */
  ext(filename: string): string;

  /** Pick specific properties from an object */
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;

  /** Assert a condition, throw BadRequestException if false */
  assert(condition: any, message?: string): asserts condition;

  /** Upload utilities (user-implemented) */
  upload: {
    /** Upload file to MinIO or S3 */
    minio?(file: Express.Multer.File, bucket?: string): Promise<string>;

    /** Upload file to local storage */
    local?(file: Express.Multer.File, directory?: string): Promise<string>;

    [key: string]: any;
  };
}

/**
 * Dependency injection container available in adapter context
 */
export interface AdapterDI {
  /** Prisma client instance */
  prisma: IPrismaService;

  /** Custom repositories or services can be added by user */
  [key: string]: any;
}

/**
 * Context object passed to adapter handlers
 */
export interface AdapterContext<TBody = any, TQuery = any, TParams = any> {
  /** Full request URL */
  url: string;

  /** Route parameters */
  params: TParams;

  /** Query string parameters */
  query: TQuery;

  /** Request headers */
  headers: Record<string, string | string[] | undefined>;

  /** Request body (parsed JSON or form data) */
  body: TBody;

  /** Uploaded file(s) for multipart requests */
  files?: Express.Multer.File | Express.Multer.File[];

  /** Authenticated user (from guard/strategy) */
  user?: any;

  /** Raw Express request object */
  req: Request;

  /** Raw Express response object */
  res: Response;

  /** Dependency injection container */
  di: AdapterDI;

  /** Helper utilities */
  helpers: AdapterHelpers;
}

/**
 * Result returned by adapter handler when bypassing service (direct response)
 */
export interface AdapterDirectResponse {
  /** Response status code */
  status: number;

  /** Response body */
  body: any;

  /** Optional response headers */
  headers?: Record<string, string>;

  /** Internal marker for type discrimination */
  __isDirectResponse: true;
}

/**
 * Union type for adapter handler results
 * Either returns the service DTO directly, or a direct response
 */
export type AdapterResult<TResult = any> = TResult | AdapterDirectResponse;

/**
 * Adapter handler function signature
 * Supports both synchronous and asynchronous handlers
 */
export type AdapterHandler<
  TBody = any,
  TQuery = any,
  TParams = any,
  TResult = any,
> = (
  context: AdapterContext<TBody, TQuery, TParams>,
) => Promise<AdapterResult<TResult>> | AdapterResult<TResult>;

/**
 * Adapter runtime factory return type
 */
export interface AdapterFactoryResult<
  TBody = any,
  TQuery = any,
  TParams = any,
  TResult = any,
> {
  config: AdapterConfig;
  handler: AdapterHandler<TBody, TQuery, TParams, TResult>;
  type: AdapterType;
}

