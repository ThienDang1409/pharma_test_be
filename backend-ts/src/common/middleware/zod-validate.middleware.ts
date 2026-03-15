import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../exceptions';

/**
 * Factory function to create Zod validation middleware
 * @param schema - Zod schema to validate against
 * @param source - Where to validate: 'body', 'query', 'params'
 */
export const validateWithZod = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("req.body", req.body)
    try {
      const dataToValidate =
        source === 'body'
          ? req.body ?? {}
          : source === 'query'
            ? req.query ?? {}
            : req.params ?? {};
      const validatedData = schema.parse(dataToValidate);

      // Only replace body data (safe to assign), skip query/params (read-only)
      if (source === 'body') {
        req.body = validatedData;
      }
      // For query and params, Zod validates but doesn't modify the read-only properties
      // The original req.query and req.params remain unchanged but validated

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors nicely
        const errorMessage = error.issues
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        throw new BadRequestError(`Validation failed: ${errorMessage}`);
      }
      throw error;
    }
  };
};
