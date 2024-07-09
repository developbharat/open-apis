import * as t from "@sinclair/typebox";
import { describe, expect, it, mock } from "bun:test";
import { Route, RouteBuilder } from "../src/Route";

const createMockResponse = () => ({
  writableEnded: false,
  writeHead: mock((_, __) => null),
  write: mock((data) => data),
  end: mock((data) => data),
});

describe("Route", () => {
  it("initializes", () => {
    expect(Route()).toBeInstanceOf(RouteBuilder);
    expect(Route().build).toBeDefined();
  });

  it("create GET /articles route", () => {
    const created = Route()
      .setPath("GET", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("GET");
    expect(created.__handle).toBeFunction();
  });

  it("create POST /article route", () => {
    const created = Route()
      .setPath("POST", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("POST");
    expect(created.__handle).toBeFunction();
  });

  it("create PUT /article route", () => {
    const created = Route()
      .setPath("PUT", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("PUT");
    expect(created.__handle).toBeFunction();
  });

  it("create PATCH /article route", () => {
    const created = Route()
      .setPath("PATCH", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("PATCH");
    expect(created.__handle).toBeFunction();
  });

  it("create DELETE /article route", () => {
    const created = Route()
      .setPath("DELETE", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("DELETE");
    expect(created.__handle).toBeFunction();
  });

  it("supports middlewares for GET /articles", async () => {
    const middleware1 = mock(async () => {});
    const middleware2 = mock(async () => {});
    const created = Route()
      .setPath("GET", "/articles")
      .setMiddlewares(middleware1, middleware2)
      .setHandle(() => {})
      .build();

    const response = createMockResponse();
    await created.__handle({} as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("GET");
    expect(created.__handle).toBeFunction();
    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
  });

  it("supports handle for GET /articles", async () => {
    const handle = mock(async () => {});
    const created = Route().setPath("GET", "/articles").setHandle(handle).build();

    const response = createMockResponse();
    await created.__handle({} as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("GET");
    expect(created.__handle).toBeFunction();
    expect(handle).toHaveBeenCalled();
  });

  it("supports params for /articles/:id", () => {
    const created = Route()
      .setPath("GET", "/articles/:id")
      .setParams(t.Object({ id: t.String({}) }))
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles/:id");
    expect(created.method).toBe("GET");
    expect(created.__handle).toBeFunction();
  });

  it("supports params for /articles/:article_id/comments/:comment_id", () => {
    const created = Route()
      .setPath("GET", "/articles/:article_id/comments/:comment_id")
      .setParams(
        t.Object({
          article_id: t.String(),
          comment_id: t.String(),
        }),
      )
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles/:article_id/comments/:comment_id");
    expect(created.method).toBe("GET");
    expect(created.__handle).toBeFunction();
  });

  it("validates params presence from route path /articles/:id", () => {
    const created = () =>
      Route()
        .setPath("GET", "/articles/:id")
        .setHandle(() => {})
        .build();

    expect(created).toThrow();
  });

  it("validates validate method for GET /articles", () => {
    const created = () =>
      Route()
        .setPath("unknown" as any, "/articles")
        .setHandle(() => {})
        .build();

    expect(created).toThrow();
  });

  it("treats blank path for route as /", () => {
    const created = Route()
      .setPath("GET", "")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/");
    expect(created.method).toBe("GET");
    expect(created.__handle).toBeFunction();
  });

  it("works for valid request data for POST /articles", async () => {
    const created = Route()
      .setPath("POST", "/articles")
      .setRequestData(
        t.Object({
          title: t.String({}),
          description: t.String({}),
        }),
      )
      .setHandle(() => ({}))
      .build();

    const response = createMockResponse();
    await created.__handle({ body: { title: "abc", description: "abcd" } } as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("POST");
    expect(created.__handle).toBeFunction();
    expect(response.write).toHaveBeenCalled();
  });

  it("fails for invalid request data for POST /articles", async () => {
    const created = Route()
      .setPath("POST", "/articles")
      .setRequestData(
        t.Object({
          title: t.String(),
          description: t.String(),
        }),
      )
      .setHandle(() => ({}))
      .build();

    const response = createMockResponse();
    await created.__handle({} as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("POST");
    expect(created.__handle).toBeFunction();
    expect(response.write.mock.results[0].value).not.toBe("{}");
  });

  it("validates request without data for POST /articles", () => {
    const created = Route()
      .setPath("POST", "/articles")
      .setHandle(() => {})
      .build();

    const response = createMockResponse();
    const success = () => created.__handle({ body: {} } as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("POST");
    expect(created.__handle).toBeFunction();
    expect(success).not.toThrowError();
  });

  it("disallows to use Route().setRequestData with GET and OPTIONS method", () => {
    const get = () =>
      Route()
        .setPath("GET", "/articles")
        .setRequestData(
          t.Object({
            title: t.String(),
            description: t.String(),
          }),
        )
        .setHandle(() => {})
        .build();

    const options = () =>
      Route()
        .setPath("OPTIONS", "/articles")
        .setRequestData(
          t.Object({
            title: t.String(),
            description: t.String(),
          }),
        )
        .setHandle(() => {})
        .build();

    expect(get).toThrowError();
    expect(options).toThrowError();
  });
});

// TODO: add test cases for middlewares
