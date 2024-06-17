import { TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import { OpenRequest, OpenResponse } from "./contracts/core";
type IMethod = "get" | "post" | "put" | "patch" | "delete" | "options";

type IHandleFunc = () => Promise<any> | any;
type IMiddlewareFunc = (req: OpenRequest, res: OpenResponse) => Promise<any>;

interface ICleanRouteData {
  isValid: (value: any) => Error | null;
  clean: (value: any) => any;
}

interface IRouteOptions {
  method: IMethod;
  path: string;
  __handle: (req: OpenRequest, res: OpenResponse) => any;
}

class RouteBuilder {
  private method: IMethod | null = null;
  private path: string = "";
  private params: ICleanRouteData = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private requestHeaders: ICleanRouteData = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private requestData: ICleanRouteData = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private responseData: ICleanRouteData = {
    clean: (value) => value,
    isValid: (value) => null,
  };
  private middlewares: Array<IMiddlewareFunc> = [];
  private handle_func: IHandleFunc | null = null;
  private isCustomRequestDataProvided: boolean = false;

  /**
   * Sets the HTTP method and path for the route.
   *
   * @param {string} method - The HTTP method (e.g. "GET", "POST", etc.)
   * @param {string} path - The path for the route (e.g. "/articles", "/users/:id", etc.)
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setPath("GET", "/articles");
   * ```
   */
  public setPath(method: IMethod, path: string): RouteBuilder {
    this.method = method;
    this.path = path;
    return this;
  }

  /**
   * Validates the request parameters specified in path, as per provided object.
   *
   * @param {object} params - An object containing the parameter definitions
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setPath("GET", "/articles/:id/:name").setParams({
   *   id: t.string({ length: 10, format: 'uuid', error: "Invalid param value id provided." }),
   *   name: t.string({ minLength: 10, maxLength: 20 })
   * });
   * ```
   */
  public setParams(params: TSchema): RouteBuilder {
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
   * @returns {RouteBuilder} - The current route instance
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
  public setRequestData(data: TSchema): RouteBuilder {
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
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setRequestHeaders({
   *   "Content-Type": "application/json"
   * });
   * ```
   */
  public setRequestHeaders(headers: TSchema): RouteBuilder {
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
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setResponseHeaders({
   *   "Content-Type": "application/json"
   * });
   * ```
   */
  public setResponseHeaders(headers: object): RouteBuilder {
    // TODO: implement this
    return this;
  }

  /**
   * Sets the response data for the route. Validation makes sure data returned from your function matches provided format,
   * and also removes any extra keys incase any extra data is specified.
   *
   * @param {object} data - An object containing the response data definitions
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setResponseData(Article);
   * ```
   */
  public setResponseData(data: TSchema): RouteBuilder {
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
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setMiddlewares(isAuthenticated);
   * ```
   */
  public setMiddlewares(...middlewares: IMiddlewareFunc[]): RouteBuilder {
    this.middlewares = middlewares;
    return this;
  }

  /**
   * Sets the handle function for the route. This is main function to hanle incoming request after validation passes.
   *
   * @param {Function} middleware - The handle function
   * @returns {RouteBuilder} - The current route instance
   *
   * Example:
   * ```
   * const route = new Route().setHandle(() => {
   *   console.log("You will receive valid data here, and feel free to raise any exceptions of type CustomException from this function.");
   * });
   * ```
   */
  public setHandle(handle: IHandleFunc): RouteBuilder {
    this.handle_func = handle;
    return this;
  }

  /**
   * Builds the route data.
   * Must be invoked to build route definition.
   *
   * @returns {IRouteOptions} - The built route data
   *
   * Example:
   * ```
   * const routeData = new Route().build();
   * ```
   */
  public build(): IRouteOptions {
    if (!this.method || !this.path) throw new Error("Method and path must be specified for Route.");
    if (!this.handle_func) throw new Error("Request handler must be specified for Route.");

    if (this.isCustomRequestDataProvided && ["get", "options"].includes(this.method))
      throw new Error("You cannot use setRequestData with GET and OPTIONS requests.");

    return {
      method: this.method,
      path: this.path,
      __handle: this.__handle.bind(this),
    };
  }

  // Replace with actual data
  public async __handle(req: OpenRequest, res: OpenResponse): Promise<any> {
    try {
      // validate headers
      const isHeadersException = this.requestHeaders.isValid(req.headers);
      if (!!isHeadersException) throw isHeadersException;

      // validate params
      const isParamsException = this.params.isValid(req.params);
      if (!!isParamsException) throw isParamsException;

      // validate data
      const reqData = { ...req.query, ...req.body };
      const isDataException = this.requestData.isValid(reqData);
      if (!!isDataException) throw isDataException;

      // execute middlewares
      for (const middleware of this.middlewares) {
        if (res.writableEnded) return;
        await middleware(req, res);
      }
      if (res.writableEnded) return;

      // execute request handlers
      const result = await this.handle_func!();

      // clean result from handler
      const isResultException = this.responseData.isValid(result);
      if (!!isResultException) throw isResultException;
      const cleaned = this.responseData.clean(result);

      // Return cleaned data
      return res.json(cleaned);
    } catch (error) {
      return res.json({ error: (error as Error).message });
    }
  }
}

export const Route = new RouteBuilder();

