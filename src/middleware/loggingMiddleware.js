import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl, body, params, query } = req;
        const { statusCode } = res;

        const logData = {
            method,
            url: originalUrl,
            status: statusCode,
            duration: `${duration}ms`,
            params: (params && Object.keys(params).length > 0) ? params : undefined,
            query: (query && Object.keys(query).length > 0) ? query : undefined,
            body: (method !== 'GET' && body && Object.keys(body).length > 0) ? body : undefined,
        };

        logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, logData);
    });

    next();
};
