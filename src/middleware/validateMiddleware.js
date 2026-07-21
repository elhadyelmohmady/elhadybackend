import { ApiError } from './errorMiddleware.js';

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    } catch (error) {
        // Zod v4 uses .issues, Zod v3 used .errors — handle both
        const issues = error.issues ?? error.errors ?? [];
        const errors = Array.isArray(issues) && issues.length > 0
            ? issues.map(err => ({
                field: Array.isArray(err.path) ? err.path.join('.') : '',
                message: err.message
            }))
            : [{ field: 'unknown', message: error.message || 'Validation failed' }];
        next(new ApiError('Validation Error', 400, errors));
    }
};
