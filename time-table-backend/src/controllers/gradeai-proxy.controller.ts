import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { prisma } from "../prisma/client";

const GRADEAI_API_URL = process.env.GRADEAI_API_URL?.trim();
if (!GRADEAI_API_URL) {
  throw new Error("GRADEAI_API_URL env var is required");
}

const GRADEAI_SHARED_SECRET = (
  process.env.GRADEAI_SHARED_SECRET?.trim() || process.env.GRADEAI_SECRET?.trim()
);
if (!GRADEAI_SHARED_SECRET) {
  throw new Error("GRADEAI_SHARED_SECRET (or GRADEAI_SECRET) env var is required");
}

/**
 * Middleware to track Content-Length and enforce bounding limits.
 * We enforce 50MB (50 * 1024 * 1024) specifically to avoid crashing Node.
 */
export const enforceStreamLimits = (req: Request, res: Response, next: NextFunction) => {
  const MAX_BYTES = 50 * 1024 * 1024;
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  const transferEncoding = req.headers["transfer-encoding"];

  if (contentLength > MAX_BYTES) {
    return res.status(413).json({ error: "Payload too large" });
  }

  if (!contentLength && transferEncoding !== "chunked") {
    // If no content-length and not chunked, it's possibly safe (just a GET or tiny request).
    // Let it pass.
    return next();
  }

  // If chunked, track bytes natively on the request stream
  if (transferEncoding === "chunked") {
    let bytesReceived = 0;
    req.on("data", (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_BYTES) {
        req.destroy(); // Instant TCP drop, avoiding Express heap overflow
      }
    });
  }

  next();
};

/**
 * Middleware to synchronously fetch teacher identity and set X-Headers
 * BEFORE the proxy middleware consumes the Request.
 */
export const injectTeacherIdentity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role === "TEACHER" && req.user.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: req.user.teacherId } });
      if (teacher) {
        req.headers["x-teacher-identity"] = teacher.name;
      }
    } else if (req.user?.role === "ADMIN") {
      req.headers["x-teacher-identity"] = "ADMIN";
    }
    
    // Inject the mapping secret
    req.headers["x-backend-secret"] = GRADEAI_SHARED_SECRET;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * The standard proxy that pipes to /api/teacher/* or /api/student/*
 */
export const gradeaiProxyController = {
  healthCheck: async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${GRADEAI_API_URL}/healthz`);
      if (!response.ok) throw new Error("GradeAI offline");
      const data = await response.json();
      return res.status(200).json(data);
    } catch {
      return res.status(503).json({ status: "unavailable", message: "AI service unavailable" });
    }
  },

  getOptions: async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${GRADEAI_API_URL}/options`);
      const data = await response.json();
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: "Cannot fetch options" });
    }
  },

  // Using http-proxy-middleware directly for piping routes
  createProxy: (targetPathPrefix: string, timeOutMs: number = 300000) => {
    return createProxyMiddleware({
      target: GRADEAI_API_URL,
      changeOrigin: true,
      proxyTimeout: timeOutMs,
      timeout: timeOutMs,
      pathRewrite: (path, req) => {
        // e.g. /api/gradeai/teacher/add-question -> /api/teacher/add-question
        const expressReq = req as unknown as Request;
        const rawTail = (expressReq.params as any).tail;

        // In Express 5 wildcard routes, params.tail can be an array of segments.
        const tail = Array.isArray(rawTail)
          ? rawTail.join("/")
          : String(rawTail || "").replace(/^\/+/, "");

        const prefix = targetPathPrefix.endsWith("/")
          ? targetPathPrefix.slice(0, -1)
          : targetPathPrefix;

        return tail ? `${prefix}/${tail}` : prefix;
      },
      on: {
        proxyReq: fixRequestBody, // Corrects issues if body-parsers sneaked in
        error: (err, _req, res) => {
          const httpRes = res as unknown as Response;
          if (httpRes.headersSent) return;

          const code = (err as NodeJS.ErrnoException).code;
          const detail = code ? `${err.message} (${code})` : err.message;
          httpRes.status(502).json({
            error: "UPSTREAM_UNAVAILABLE",
            message: "GradeAI service is unavailable",
            detail,
          });
        },
      }
    });
  }
};
