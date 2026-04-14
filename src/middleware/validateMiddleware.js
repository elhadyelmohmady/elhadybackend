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
        const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        next(new ApiError('Validation Error', 400, errors));
    }
};
