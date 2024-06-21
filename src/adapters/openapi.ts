import { type IRouteOptions } from "../Route";

interface ICreateSchemaOptions {
  title?: string;
  description?: string;
  version?: string;
  servers?: string[];
}

export const create_openapi_schema = (
  routes: IRouteOptions[],
  options?: ICreateSchemaOptions,
): string => {
  const route = routes[0].openapi_schema;

  const clean = (data: any) => JSON.parse(JSON.stringify(data));

  const params = Object.entries((route.parameters as any).properties).map(([key, value], index) => {
    return {
      in: "path",
      name: key,
      required: route.parameters!.required.includes(key),
      schema: clean(route.parameters!.properties[key]),
    };
  });
  const schema = {
    [route.path]: {
      [route.method]: {
        summary: route.summary,
        responses: !route.response
          ? undefined
          : {
              [route.response?.code]: {
                description: "",
                content: {
                  [route.response_content_type || "application/json"]: {
                    schema: clean(route.response?.schema),
                  },
                },
              },
            },
        parameters: !route.parameters ? undefined : params,
        requestBody: !route.body
          ? undefined
          : {
              description: "Data required for request body",
              content: {
                [route.accepts_content_type || "application/json"]: {
                  schema: clean(route.body),
                },
              },
            },
      },
    },
  };

  const complete_schema = {
    openapi: "3.0.2",
    info: {
      title: options?.title || "OpenAPI Docs",
      description: options?.description || "Openapi api description",
      version: options?.version || "1.0.0",
    },
    servers: options?.servers?.map((item) => ({ url: item })),
    paths: clean(schema),
  };

  return JSON.stringify(complete_schema, null, 2);
};

// const endpoint = Route()
//   .setPath("post", "/articles/:name")
//   .setParams(
//     t.Object({
//       name: t.String({ minLength: 4 }),
//     }),
//   )
//   .setRequestData(
//     t.Object({
//       title: t.String({ minLength: 5, maxLength: 255 }),
//       count: t.Integer(),
//       description: t.Optional(t.String()),
//     }),
//   )
//   .setResponseData(t.Object({ title: t.String() }))
//   .setHandle(() => {})
//   .build();

// const schema = create_openapi_schema([endpoint], {
//   title: "Open Apis Example",
//   description: "Exploring apis with examples",
//   servers: ["https://prod.example.com", "https://dev.example.com"],
// });
// console.log(schema);
