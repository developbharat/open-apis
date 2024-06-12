import { FormatRegistry, TSchema, Type } from "@sinclair/typebox";
import { TypeCheck, TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import { IRoute } from "express";
type IMethod = "get" | "post" | "put" | "patch" | "delete" | "options";

type IHandleFunc = () => Promise<any> | any;
type IMiddlewareFunc = () => Promise<void>;
interface IRouteOptions {
  method: IMethod;
  path: string;
  params: {
    isValid: (value: any) => Error | null;
    clean: (value: any) => any;
  };
  req_headers: {
    isValid: (value: any) => Error | null;
    clean: (value: any) => any;
  };
  req_data: {
    isValid: (value: any) => Error | null;
    clean: (value: any) => any;
  };
  res_data: {
    isValid: (value: any) => Error | null;
    clean: (value: any) => any;
  };
  middlewares: Array<IMiddlewareFunc>;
  handle: IHandleFunc;
}

type RouteData = IRouteOptions;

export class Route {
  private method: IMethod | null = null;
  private path: string = "";
  private params: IRouteOptions["params"] = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private requestHeaders: IRouteOptions["req_headers"] = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private requestData: IRouteOptions["req_data"] = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private responseData: IRouteOptions["res_data"] = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private middlewares: Array<IMiddlewareFunc> = [];
  private handle: IHandleFunc | null = null;
  private isCustomRequestDataProvided: boolean = false;

  /**
   * Sets the HTTP method and path for the route.
   *
   * @param {string} method - The HTTP method (e.g. "GET", "POST", etc.)
   * @param {string} path - The path for the route (e.g. "/articles", "/users/:id", etc.)
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setPath("GET", "/articles");
   * ```
   */
  public setPath(method: IMethod, path: string): Route {
    this.method = method;
    this.path = path;
    return this;
  }

  /**
   * Validates the request parameters specified in path, as per provided object.
   *
   * @param {object} params - An object containing the parameter definitions
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setPath("GET", "/articles/:id/:name").setParams({
   *   id: t.string({ length: 10, format: 'uuid', error: "Invalid param value id provided." }),
   *   name: t.string({ minLength: 10, maxLength: 20 })
   * });
   * ```
   */
  public setParams(params: TSchema): Route {
    // set params
    const compiled = TypeCompiler.Compile(params);
    this.params = {
      isValid: (value) =>
        compiled.Check(value) ? null : Error(compiled.Errors(value).First()?.message),
      clean: (value) => Value.Clean(params, value),
    };
    return this;
  }

  /**
   * Validates the Request body as per the provided schema.
   * Before validation (Query String, Request Body) are combined together automatically,
   * so you don't need to worry if your data is in query string or request body.
   *
   * @param {object} data - An object containing the request data definitions
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setRequestData({
   *   title: t.string({ minLength: 10, format: 'alphanum', error: "Invalid title provided." }),
   *   description: t.string({ minLength: 10, maxLength: 2000, error: "Invalid description provided." }),
   *   one_file: t.File({ extname: "png", minSize: '1mb', maxSize: '20mb' }),
   *   multiple_files: t.Files({ extnames: ["png", "jpg", "jpeg"], error: "Invalid file format provided, supported formats are: {{formats}}" })
   * });
   * ```
   */
  public setRequestData(data: TSchema): Route {
    this.isCustomRequestDataProvided = true;
    const compiled = TypeCompiler.Compile(data);
    this.requestData = {
      isValid: (value) =>
        compiled.Check(value) ? null : Error(compiled.Errors(value).First()?.message),
      clean: (value) => Value.Clean(data, value),
    };
    return this;
  }

  /**
   * Validates the request headers for the route.
   *
   * @param {object} headers - An object containing the request header definitions
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setRequestHeaders({
   *   "Content-Type": "application/json"
   * });
   * ```
   */
  public setRequestHeaders(headers: TSchema): Route {
    const compiled = TypeCompiler.Compile(headers);
    this.requestHeaders = {
      isValid: (value) =>
        compiled.Check(value) ? null : Error(compiled.Errors(value).First()?.message),
      clean: (value) => Value.Clean(headers, value),
    };
    return this;
  }

  /**
   * Sets the response headers for the route. Provided headers will be automatically added to response.
   * Some common headers such as content-type will automatically be added.
   *
   * @param {object} headers - An object containing the response header definitions
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setResponseHeaders({
   *   "Content-Type": "application/json"
   * });
   * ```
   */
  public setResponseHeaders(headers: object): Route {
    // TODO: implement this
    return this;
  }

  /**
   * Sets the response data for the route. Validation makes sure data returned from your function matches provided format,
   * and also removes any extra keys incase any extra data is specified.
   *
   * @param {object} data - An object containing the response data definitions
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setResponseData(Article);
   * ```
   */
  public setResponseData(data: TSchema): Route {
    const compiled = TypeCompiler.Compile(data);
    this.responseData = {
      isValid: (value) =>
        compiled.Check(value) ? null : Error(compiled.Errors(value).First()?.message),
      clean: (value) => Value.Clean(data, value),
    };
    return this;
  }

  /**
   * Sets the middlewares for the route.
   * Middlewares are execute prior to request handlers.
   *
   * @param {...Function[]} middlewares - An array of middleware functions
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setMiddlewares(isAuthenticated);
   * ```
   */
  public setMiddlewares(...middlewares: IHandleFunc[]): Route {
    this.middlewares = middlewares;
    return this;
  }

  /**
   * Sets the handle function for the route. This is main function to hanle incoming request after validation passes.
   *
   * @param {Function} middleware - The handle function
   * @returns {Route} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setHandle(() => {
   *   console.log("You will receive valid data here, and feel free to raise any exceptions of type CustomException from this function.");
   * });
   * ```
   */
  public setHandle(handle: IHandleFunc): Route {
    this.handle = handle;
    return this;
  }

  /**
   * Builds the route data.
   * Must be invoked to build route definition.
   *
   * @returns {RouteData} - The built route data
   *
   * Example:
   * ```
   * const routeData = new Route().build();
   * ```
   */
  public build(): RouteData {
    if (!this.method || !this.path) throw new Error("Method and path must be specified for Route.");
    if (!this.handle) throw new Error("Request handler must be specified for Route.");

    if (this.isCustomRequestDataProvided && ["get", "options"].includes(this.method))
      throw new Error("You cannot use setRequestData with GET and OPTIONS requests.");

    return {
      method: this.method,
      path: this.path,
      params: this.params,
      handle: this.handle,
      middlewares: this.middlewares,
      req_data: this.requestData,
      res_data: this.responseData,
      req_headers: this.requestHeaders,
    };
  }
}

// @ResponseFormat()
// export class Article{
//   @ResponseField(Fields.ID)
//   id: number;

//   @ResponseField(Fields.Text)
//   title: string;

//   @ResponseField(Fields.Text)
//   description: string;

//   user_id: number;
// }

export const RouteBuilder = new Route();

// export const CreateArticleRoute = RouteBuilder
//   .setPath("POST", "/articles/:id/:name")
//   .setParams(t.object({
//     id: t.string({ length: 10, format: 'uuid', error: "Invalid param value id provided." }),
//     name: t.string({minLength: 10, maxLength: 20})
//   }))
//   .setRequestData({
//     title: t.string({minLength: 10, format: 'alphanum', error: "Invalid title provided."}),
//     description: t.string({ minLength: 10, maxLength: 2000, error: "Invalid description provided." }),
//     one_file: t.File({extname: "png", minSize: '1mb', maxSize:'20mb']}),
//     multiple_files: t.Files({extnames: ["png", "jpg","jpeg"], error:"Invalid file format provided, supported formats are: {{formats}}"})
//   })
//   .setResponseData(Article)
//   .setMiddlewares(isAuthenticated)
//   .setHandle(() => {
//     console.log("You will receive valid data here, and feel free to raise any exceptions of type CustomException from this function.")
//   })
//   .build();

// export const ListArticlesRoute = RouteBuilder
//   .setPath("GET", "/articles")
//   .setMiddlewares(isAuthenticated)
//   .setResponseData([Article])
//   .setHandle(() => [])
//   .build();

// export const CustomArticleRoute = RouteBuilder
//   .setPath("GET", "/articles/home-screen")
//   .setMiddlewares(isAuthenticated)
//   .setResponseData({
//     custom: true,
//     data: {
//       articles: [Article],
//       success: Fields.Boolean,
//       status: Fields.String,
//       favourites: {
//         articles: [Article],
//         label: Fields.String,
//         description: Fields.String,
//       }
//     }
//   })
//   .setHandle(() => ({
//     articles: [],
//     success: true,
//     status: "Articles returned successfully.",
//     favourites: {
//       articles: [],
//       label: "Favourite Artilces",
//       description: "Articles marked as favourite will be visible in this section."
//     }
//   }))
//   .build();

// export const Routes = [CreateArticleRoute, ListArticlesRoute, CustomArticleRoute]

// Bun.serve({
//   fetch: (request, response) => {
//     Routes.handle(request, response);
//   }
// })
// console.log("Hello via Bun!");
