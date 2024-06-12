type IHTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

interface IRouteOptions {
  method: IHTTPMethod;
  path: string;
}

type ParsePath<T extends string> = T extends `${infer Prefix}/${infer Param}/${infer Rest}`
  ? Param extends `:${infer Name}`
    ? Merge<ParsePath<`/${Rest}`>, { [key in Name]: true }>
    : ParsePath<`/${Rest}`>
  : T extends `${infer Prefix}/${infer Param}`
  ? Param extends `:${infer Name}`
    ? { [key in Name]: true }
    : {}
  : {};

type Merge<T, U> = {
  [key in keyof T | keyof U]: key extends keyof T
    ? key extends keyof U
      ? T[key] | U[key]
      : T[key]
    : key extends keyof U
    ? U[key]
    : never;
};

export interface IRequestHeaders {
  "authorization": string;
  "content-type": "application/json" | "plain/text";
}

class OpenRoute<IPath extends `/${string}` = any> {
  private options: IRouteOptions = {
    method: "GET",
    path: "",
  };

  setPath<TPath extends IPath>(method: IHTTPMethod, path: TPath): OpenRoute<TPath> {
    this.options.method = method;
    this.options.path = path;
    return this as unknown as OpenRoute<TPath>;
  }

  setParams(params: ParsePath<IPath>): OpenRoute<IPath> {
    return this;
  }

  // TODO: change type of headers to [most-used-header-keys]: typebox validator
  setHeaders(headers: Record<string, string>): OpenRoute<IPath> {
    return this;
  }

  // TODO: change to Record<string, typebox-validator>
  setRequestData(data: Record<string, string>): OpenRoute<IPath> {
    return this;
  }

  // TODO: change to Record<string, typebox-validator>
  setResponseData(data: Record<string, string>): OpenRoute<IPath> {
    return this;
  }

  // TODO: add return type and generation logic.
  build(): any {
    return null;
  }
}

export const Route = new OpenRoute();

const CreateArticleRoute = Route.setPath("GET", "/articles/:id")
  .setParams({ id: true })
  .setHeaders({ "content-type": "true" })
  .setRequestData({ title: "typebox-string", description: "typebox-string" })
  .setResponseData({
    id: "typebox-string",
    title: "typebox-string",
    description: "typebox-string",
  })
  .build();

console.log("Hello via Bun!");
