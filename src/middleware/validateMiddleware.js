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
        const errors = (error && Array.isArray(error.errors)) ? error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        })) : [{ field: 'unknown', message: error.message || 'Validation failed' }];
        next(new ApiError('Validation Error', 400, errors));
    }
};
