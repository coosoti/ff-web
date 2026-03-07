// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';

export const validate = (schema: AnySchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details?.map((d: any) => d.message),
      });
    }
  };
};