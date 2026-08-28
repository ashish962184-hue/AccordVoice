/**
 * Validates the request body against a Zod schema.
 * Returns 400 with formatted errors if validation fails.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Validation failed.', details: errors });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validate };
