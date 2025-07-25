const logger = require('../config/logger');

const errorHandler = (err, req, res, _next) => {
    logger.error(err.message, { stack: err.stack });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            message: message,
        },
    });
};

module.exports = errorHandler;