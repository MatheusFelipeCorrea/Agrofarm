import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError.js";

function isZodSchema(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.safeParse === "function" &&
    "_def" in value
  );
}

export function validate(schema) {
  return validator(schema);
}

/**
 * Aceita `{ body, params, query }` ou um único schema Zod (validação do body).
 */
export function validator(schema) {
  return (req, _res, next) => {
    try {
      const bodySchema = schema?.body ?? (isZodSchema(schema) ? schema : null);
      if (bodySchema) {
        req.body = bodySchema.parse(req.body ?? {});
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError("Dados de entrada invalidos", 400, {
            issues: error.issues,
          }),
        );
        return;
      }

      next(error);
    }
  };
}
