import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 document uploads per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many uploads from this IP, please try again after 15 minutes.',
  },
});
