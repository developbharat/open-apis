import { describe, it, expect, mock } from "bun:test";
import { RouteBuilder, Route } from "../src/Route";
import * as t from "@sinclair/typebox";

describe("Route", () => {
  it("initializes", () => {
    expect(Route).toBeInstanceOf(RouteBuilder);
    expect(Route.build).toBeDefined();
  });

  it("create GET /articles route", () => {
    const created = Route.setPath("get", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("create POST /article route", () => {
    const created = Route.setPath("post", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
  });

  it("create PUT /article route", () => {
    const created = Route.setPath("put", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("put");
    expect(created.__handle).toBeFunction();
  });

  it("create PATCH /article route", () => {
    const created = Route.setPath("patch", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("patch");
    expect(created.__handle).toBeFunction();
  });

  it("create DELETE /article route", () => {
    const created = Route.setPath("delete", "/articles")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("delete");
    expect(created.__handle).toBeFunction();
  });

  it("supports middlewares for GET /articles", async () => {
    const middleware1 = mock(async () => {});
    const middleware2 = mock(async () => {});
    const created = Route.setPath("get", "/articles")
      .setMiddlewares(middleware1, middleware2)
      .setHandle(() => {})
      .build();

    await created.__handle({} as any, { json: () => null, writableEnded: false } as any);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
  });

  it("supports handle for GET /articles", async () => {
    const handle = mock(async () => {});
    const created = Route.setPath("get", "/articles").setHandle(handle).build();

    await created.__handle({} as any, { json: () => null, writableEnded: false } as any);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
    expect(handle).toHaveBeenCalled();
  });

  it("supports params for /articles/:id", () => {
    const created = Route.setPath("get", "/articles/:id")
      .setParams(t.Object({ id: t.String({}) }))
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles/:id");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("supports params for /articles/:article_id/comments/:comment_id", () => {
    const created = Route.setPath("get", "/articles/:article_id/comments/:comment_id")
      .setParams(
        t.Object({
          article_id: t.String(),
          comment_id: t.String(),
        }),
      )
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles/:article_id/comments/:comment_id");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("validates params presence from route path /articles/:id", () => {
    const created = () =>
      Route.setPath("get", "/articles/:id")
        .setHandle(() => {})
        .build();

    expect(created).toThrow();
  });

  it("validates validate method for GET /articles", () => {
    const created = () =>
      Route.setPath("unknown" as any, "/articles")
        .setHandle(() => {})
        .build();

    expect(created).toThrow();
  });

  it("treats blank path for route as /", () => {
    const created = Route.setPath("get", "")
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("works for valid request data for POST /articles", async () => {
    const created = Route.setPath("post", "/articles")
      .setRequestData(
        t.Object({
          title: t.String(),
          description: t.String(),
        }),
      )
      .setHandle(() => {})
      .build();

    const func = mock((data) => data);

    await created.__handle(
      { body: { title: "abc", description: "abcd" } } as any,
      { json: func, writableEnded: false } as any,
    );

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(func.mock.results[0].value).toBeTruthy();
  });

  it("fails for invalid request data for POST /articles", async () => {
    const created = Route.setPath("post", "/articles")
      .setRequestData(
        t.Object({
          title: t.String(),
          description: t.String(),
        }),
      )
      .setHandle(() => {})
      .build();

    const func = mock((data) => data);
    await created.__handle({} as any, { json: func } as any);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(func.mock.results[0].value).not.toBe({});
  });

  it("validates request without data for POST /articles", () => {
    const created = Route.setPath("post", "/articles")
      .setHandle(() => {})
      .build();

    const response = { json: () => null } as any;
    const success = () => created.__handle({ body: {} } as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(success).not.toThrowError();
  });

  it("disallows to use Route.setRequestData with GET and OPTIONS method", () => {
    const get = () =>
      Route.setPath("get", "/articles")
        .setRequestData(
          t.Object({
            title: t.String(),
            description: t.String(),
          }),
        )
        .setHandle(() => {})
        .build();

    const options = () =>
      Route.setPath("options", "/articles")
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
