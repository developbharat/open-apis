import { Request, Response, Application } from "express-serve-static-core";
import type { IRouteOptions } from "../Route";

export const init_express = (app: Application, routes: IRouteOptions[]) => {
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
            body: req.body,
          },
          res,
        ),
    );
  }
};
