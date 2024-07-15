import { Trie } from "route-trie";
import { IRouteOptions } from "./Route";
import { OpenRequest, OpenResponse } from "./contracts/core";

export class TrieRouter {
  private endpoints = new Trie({
    ignoreCase: true,
    fixedPathRedirect: false,
    trailingSlashRedirect: true,
  });

  constructor(routes: IRouteOptions[]) {
    routes.forEach((route) => {
      this.endpoints.define(route.path).handle(route.method, route);
    });
  }

  handle(req: OpenRequest, res: OpenResponse) {
    const match = this.endpoints.match(req.url!);
    const route: IRouteOptions | undefined = match.node?.getHandler(req.method!);
    if (!match || !route) {
      res.statusCode = 404;
      res.write("404 Not Found!");
      return;
    }

    // Attach URL Params to request
    (req as any).params = match.params;

    route.__handle(req, res);
  }
}

export const OpenServe = (...endpoints: IRouteOptions[]) => new TrieRouter(endpoints);
