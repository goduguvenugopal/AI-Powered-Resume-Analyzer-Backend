import { Application } from "express";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

const applySecurityMiddleware = (app: Application): void => {

  // ── Helmet: sets secure HTTP response headers ──────────────────────────────
  app.use(
    helmet({
      // Disables X-Powered-By: Express (hides server tech stack)
      xPoweredBy: false,

      // Prevents browsers from MIME-sniffing the content-type
      noSniff: true,

      // Forces HTTPS for the specified duration (1 year)
      strictTransportSecurity: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },

      // Prevents clickjacking by controlling who can iframe your app
      frameguard: { action: "deny" },

      // Controls what resources the browser is allowed to load (CSP)
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },

      // Enables browser's built-in XSS filter (legacy but still useful)
      xssFilter: true,

      // Prevents IE from executing downloads in the site's context
      ieNoOpen: true,

      // Stops browser from sending Referer header for cross-origin requests
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },

      // Blocks access to browser features/APIs not needed by the app
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
    })
  );

  // ── Compression: gzip/deflate response bodies ──────────────────────────────
  app.use(
    compression({
      // Only compress responses larger than 1KB
      threshold: 1024,
      // Compression level: 6 is the sweet spot (speed vs ratio)
      level: 6,
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    })
  );

  // ── HPP: protect against HTTP Parameter Pollution attacks ──────────────────
  // e.g. ?role=user&role=admin → only last value kept (or whitelist both)
  app.use(
    hpp({
      // Parameters allowed to appear multiple times (e.g. filters, tags)
      whitelist: [],
    })
  );

  // ── Rate Limiting: prevent brute-force & DDoS ──────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // max 100 requests per window per IP
    standardHeaders: true,     // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,      // Disable X-RateLimit-* headers
    message: {
      status: 429,
      message: "Too many requests, please try again later.",
    },
  });

  app.use(globalLimiter);
};

export default applySecurityMiddleware;