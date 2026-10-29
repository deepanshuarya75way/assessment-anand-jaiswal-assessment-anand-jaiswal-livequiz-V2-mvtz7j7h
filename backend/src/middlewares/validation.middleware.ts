import { type Request, type Response, type NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed.",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({ error: "Internal validation error." });
    }
  };
}
