import { describe, expect, it, mock } from "bun:test";
import { Route } from "../src/Route";
import { ReflectSchemaField, ResField, ResSchema } from "../src/decorators";
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

    const schema1 = Reflect.getMetadata(ReflectSchemaField.REQ_HEADERS, SampleTest);
    const schema2 = Reflect.getMetadata(ReflectSchemaField.REQ_PARAMS, SampleTest);
    const schema3 = Reflect.getMetadata(ReflectSchemaField.REQ_DATA, SampleTest);
    const schema4 = Reflect.getMetadata(ReflectSchemaField.RES_DATA, SampleTest);

    expect(schema1.type).toBe("object");
    expect(schema2.type).toBe("object");
    expect(schema3.type).toBe("object");
    expect(schema4.type).toBe("object");
    expect(schema1.properties).toBeObject();
    expect(schema2.properties).toBeObject();
    expect(schema3.properties).toBeObject();
    expect(schema4.properties).toBeObject();
  });

  it("Allows use of decorators for .setParams in: GET /articles/:name", () => {
    @ResSchema()
    class ArticleParams {
      @ResField("String", { minLength: 5, maxLength: 40 }, { asRequestParams: true })
      public name: string = "";
    }

    const created = Route()
      .setPath("get", "/articles/:name")
      .setParams(ArticleParams)
      .setHandle(() => { })
      .build();

    expect(created.path).toBe("/articles/:name");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("Allows use of decorators for .setRequestData in: POST /articles", () => {
    @ResSchema()
    class ArticleData {
      @ResField("String", { minLength: 5, maxLength: 40 }, { asRequestData: true })
      public name: string = "";
    }

    const created = Route()
      .setPath("post", "/articles")
      .setRequestData(ArticleData)
      .setHandle(() => { })
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
  });

  it("Allows use of decorators for .setResponseData in: POST /articles", () => {
    @ResSchema()
    class ArticleRes {
      @ResField("String", { minLength: 5, maxLength: 40 }, { asResponseData: true })
      public name: string = "";
    }

    const created = Route()
      .setPath("post", "/articles")
      .setResponseData(ArticleRes)
      .setHandle(() => { })
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
  });

  it("Allows use of decorators for .setRequestHeaders in: GET /articles", () => {
    @ResSchema()
    class ArticleHeaders {
      @ResField("String", { minLength: 5, maxLength: 40 }, { asRequestHeaders: true })
      public authorization: string = "";
    }

    const created = Route()
      .setPath("get", "/articles")
      .setRequestHeaders(ArticleHeaders)
      .setHandle(() => { })
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  });

  it("works for valid request data for POST /articles", async () => {
    @ResSchema()
    class ArticleData {
      @ResField("String", { minLength: 3, maxLength: 40 }, { asRequestData: true })
      public title: string = "";

      @ResField("String", { minLength: 3, maxLength: 40 }, { asRequestData: true })
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
      @ResField("String", { minLength: 3, maxLength: 40 }, { asRequestData: true })
      public title: string = "";

      @ResField("String", { minLength: 3, maxLength: 40 }, { asRequestData: true })
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
      .setHandle(() => { })
      .build();

    const response = createMockResponse();
    const success = () => created.__handle({ body: {} } as any, response);

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("post");
    expect(created.__handle).toBeFunction();
    expect(success).not.toThrowError();
  });
});
