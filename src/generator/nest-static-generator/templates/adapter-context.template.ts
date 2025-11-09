export const adapterContextTemplate = `import type { Request, Response } from 'express';
import type { PrismaService } from '@/infrastructure/database/prisma.service';
import type { AdapterContext, AdapterDI } from './types';
import { helpers } from './helpers';

/**
 * Builder class for creating adapter context objects
 * Used by generated controllers to construct context for adapter handlers
 */
export class AdapterContextBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customDI: Record<string, any> = {}
  ) {}

  /**
   * Build the context object for an adapter handler
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param files - Uploaded files (for multipart requests)
   * @returns Complete adapter context
   */
  build(
    req: Request,
    res: Response,
    files?: Express.Multer.File | Express.Multer.File[]
  ): AdapterContext {
    const di: AdapterDI = {
      prisma: this.prisma,
      ...this.customDI,
    };

    return {
      url: req.url,
      params: req.params,
      query: req.query,
      headers: req.headers as Record<string, string | string[] | undefined>,
      body: req.body,
      files,
      user: (req as any).user,
      req,
      res,
      di,
      helpers,
    };
  }
}
`;

