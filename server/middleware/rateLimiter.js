const DEFAULT_MESSAGE = "Too many requests, please try again later.";

function createRateLimiter({
    windowMs,
    maxRequests,
    methods,
    message = DEFAULT_MESSAGE,
}) {
    const requests = new Map();
    const allowedMethods = methods
        ? new Set(methods.map((method) => method.toUpperCase()))
        : null;

    setInterval(() => {
        const now = Date.now();

        for (const [key, requestData] of requests.entries()) {
            if (now - requestData.windowStart >= windowMs) {
                requests.delete(key);
            }
        }
    }, windowMs).unref();

    return (req, res, next) => {
        if (allowedMethods && !allowedMethods.has(req.method.toUpperCase())) {
            return next();
        }

        const clientIp = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();
        const currentRequest = requests.get(clientIp);

        if (!currentRequest || now - currentRequest.windowStart >= windowMs) {
            requests.set(clientIp, {
                count: 1,
                windowStart: now,
            });

            return next();
        }

        currentRequest.count += 1;

        if (currentRequest.count > maxRequests) {
            const retryAfterSeconds = Math.ceil(
                (windowMs - (now - currentRequest.windowStart)) / 1000
            );

            res.set("Retry-After", retryAfterSeconds.toString());

            return res.status(429).json({
                success: false,
                message,
                retryAfterSeconds,
            });
        }

        return next();
    };
}

module.exports = { createRateLimiter };
