import { Request, Response, NextFunction } from "express";

export function requestLogger(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  console.log("REQUEST LOGGER REACHED");

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}