import { describe, expect, it, mock } from "bun:test";
import { Route } from "../src/Route";
import { ResField, ResSchema } from "../src/decorators";
import { Article } from "../src/index-initial-idea";

const createMockResponse = () => ({
  writableEnded: false,
  setHeader: mock(() => null),
  statusCode: 200,
  write: mock((data) => data),
  end: mock((data) => data),
});

describe("Decorators", () => {
  it("initializes", () => {
    @ResSchema()
    class SampleTest {
      @ResField("String")
      public name: string = "";

      @ResField("Integer", { minimum: 0, maximum: 10 })
      public count: number = 0;
    }

    const schema = Reflect.getMetadata("schema", SampleTest);
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeObject();
  });

  it("Allows use of decorators for .setParams in: GET /articles/:name", () => {
    @ResSchema()
    class ArticleParams {
      @ResField("String", { minLength: 5, maxLength: 40 })
      public name: string = "";
    }

    const created = Route()
      .setPath("get", "/articles/:name")
      .setParams(ArticleParams)
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles/:name");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("Allows use of decorators for .setRequestData in: POST /articles", () => {
    @ResSchema()
    class ArticleData {
      @ResField("String", { minLength: 5, maxLength: 40 })
      public name: string = "";
    }

    const created = Route()
      .setPath("post", "/articles")
      .setRequestData(ArticleData)
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
  });

  it("Allows use of decorators for .setResponseData in: POST /articles", () => {
    @ResSchema()
    class ArticleRes {
      @ResField("String", { minLength: 5, maxLength: 40 })
      public name: string = "";
    }

    const created = Route()
      .setPath("post", "/articles")
      .setResponseData(ArticleRes)
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
  });

  it("Allows use of decorators for .setRequestHeaders in: GET /articles", () => {
    @ResSchema()
    class ArticleHeaders {
      @ResField("String", { minLength: 5, maxLength: 40 })
      public authorization: string = "";
    }

    const created = Route()
      .setPath("get", "/articles")
      .setRequestHeaders(ArticleHeaders)
      .setHandle(() => {})
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("works for valid request data for POST /articles", async () => {
    @ResSchema()
    class ArticleData {
      @ResField("String", { minLength: 3, maxLength: 40 })
      public title: string = "";

      @ResField("String", { minLength: 3, maxLength: 40 })
      public description: string = "";
    }

    const created = Route()
      .setPath("post", "/articles")
      .setRequestData(ArticleData)
      .setHandle(() => ({}))
      .build();

    const response = createMockResponse();
    await created.__handle({ body: { title: "abc", description: "abcd" } } as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(response.write).toHaveBeenCalled();
  });

  it("fails for invalid request data for POST /articles", async () => {
    @ResSchema()
    class ArticleData {
      @ResField("String", { minLength: 3, maxLength: 40 })
      public title: string = "";

      @ResField("String", { minLength: 3, maxLength: 40 })
      public description: string = "";
    }

    const created = Route()
      .setPath("post", "/articles")
      .setRequestData(ArticleData)
      .setHandle(() => ({}))
      .build();

    const response = createMockResponse();
    await created.__handle({} as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(response.write.mock.results[0].value).not.toBe("{}");
  });

  it("validates request without data for POST /articles", () => {
    const created = Route()
      .setPath("post", "/articles")
      .setHandle(() => {})
      .build();

    const response = createMockResponse();
    const success = () => created.__handle({ body: {} } as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(success).not.toThrowError();
  });
});
