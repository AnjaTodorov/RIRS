import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  createRegistrationService,
  RegistrationError,
  type RegistrationDependencies,
} from "./registration";

export function createApp(
  deps: RegistrationDependencies,
  { frontendUrl = "http://127.0.0.1:5173/" } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "16kb" }));
  // Old confirmation emails may target the API's origin. A Location without a
  // fragment lets the browser carry its existing fragment to the frontend.
  // Tokens stay in the browser; they are never part of the server request.
  app.get("/", (_req, res) => res.redirect(302, frontendUrl));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  const register = createRegistrationService(deps);
  app.post(
    "/api/auth/register",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Preveč poskusov registracije. Poskusite znova pozneje.",
      },
    }),
    async (req, res, next) => {
      try {
        res.status(201).json(await register(req.body));
      } catch (error) {
        next(error);
      }
    },
  );
  app.use((_req, res) => {
    res.status(404).json({ message: "Pot ne obstaja." });
  });
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof RegistrationError) {
        res
          .status(error.status)
          .json({ message: error.message, fields: error.fields });
      } else if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({ message: "Neveljavna zahteva JSON." });
      } else if (
        typeof error === "object" &&
        error &&
        "type" in error &&
        error.type === "entity.too.large"
      ) {
        res.status(413).json({ message: "Zahteva je prevelika." });
      } else {
        // Never log request bodies, credentials, SDK errors, or connection strings.
        console.error(
          "Registration request failed:",
          error instanceof Error ? error.name : "UnknownError",
        );
        res.status(503).json({
          message: "Storitev trenutno ni na voljo. Poskusite znova pozneje.",
        });
      }
    },
  );
  return app;
}
