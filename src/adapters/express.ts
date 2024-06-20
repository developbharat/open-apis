import { Request, Response, Application } from "express-serve-static-core";
import type { IRouteOptions } from "../Route";
import express from "express";

export const init_express = (app: Application, routes: IRouteOptions[]) => {
  // enable request data parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // set all endpoints
  for (const route of routes) {
    app[route.method](
      route.path,
      (req: Request<any, any, any, Record<string, string>>, res: Response) =>
        route.__handle(
          {
            headers: req.headers as Record<string, string>,
            hostname: req.hostname,
            method: req.method,
            params: req.params,
            path: req.path,
            secure: req.secure,
            query: req.query,
          },
          res,
        ),
    );
  }
};
