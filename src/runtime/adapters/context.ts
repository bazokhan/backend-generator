import type { Request, Response } from 'express';
import type { AdapterContext, AdapterDI, IPrismaService } from './types';
import { helpers } from './helpers';

/**
 * Builder class for creating adapter context objects
 * Used by generated controllers to construct context for adapter handlers
 */
export class AdapterContextBuilder {
  constructor(private readonly prisma: IPrismaService) {}

  /**
   * Build the context object for an adapter handler
   *
   * @param body - Request body
   * @param query - Query string parameters
   * @param params - Route parameters
   * @param req - Express request object
   * @param res - Express response object
   * @param files - Uploaded files (for multipart requests)
   * @returns Complete adapter context
   */
  build<TBody = any, TQuery = any, TParams = any>(
    body: TBody,
    query: TQuery,
    params: TParams,
    req: Request,
    res: Response,
    files?: Express.Multer.File | Express.Multer.File[],
  ): AdapterContext<TBody, TQuery, TParams> {
    const di: AdapterDI = {
      prisma: this.prisma,
    };

    const context: AdapterContext<TBody, TQuery, TParams> = {
      url: req.url,
      params,
      query,
      headers: req.headers as Record<string, string | string[] | undefined>,
      body,
      user: (req as any).user,
      req,
      res,
      di,
      helpers,
    };

    if (files !== undefined) {
      context.files = files;
    }

    return context;
  }
}

