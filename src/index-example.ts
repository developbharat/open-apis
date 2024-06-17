import * as t from "@sinclair/typebox";
import express from "express";
import { Route } from "./Route";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const CreateArticleRoute = Route.setPath("get", "/articles/:id/:name")
  .setParams(
    t.Object({
      id: t.String({
        length: 3,
        error: "Invalid param value id provided.",
      }),
      name: t.String({ minLength: 5, maxLength: 20 }),
    }),
  )
  // .setRequestData(
  //   t.Object({
  //     title: t.String({ minLength: 10, error: "Invalid title provided." }),
  //     description: t.String({
  //       minLength: 10,
  //       maxLength: 2000,
  //       error: "Invalid description provided.",
  //     }),
  //     // one_file: t.File({extname: "png", minSize: '1mb', maxSize:'20mb']}),
  //     // multiple_files: t.Files({extnames: ["png", "jpg","jpeg"], error:"Invalid file format provided, supported formats are: {{formats}}"})
  //   }),
  // )
  .setResponseData(
    t.Object({
      name: t.String({ minLength: 5 }),
    }),
  )
  .setMiddlewares(async (req, res) => {
    console.log("hello brother...");
    throw new Error("I am throwing this");
    return res.end();
  })
  .setHandle(() => {
    console.log(
      "You will receive valid data here, and feel free to raise any exceptions of type CustomException from this function.",
    );
    return { name: "jonson", age: 20, marks: 400 };
  })
  .build();

// handle requests using our route definitions
app.route(CreateArticleRoute.path)[CreateArticleRoute.method](CreateArticleRoute.__handle);

app.use(async (req, res, next) => {
  return res.json({ success: true });
});

app.listen(4000, () => {
  console.log("Server started at http://localhost:4000");
});

import { Type, JavaScriptTypeBuilder, SchemaOptions } from "@sinclair/typebox";

class MyClass {
  @Field("String", {})
  name: string;

  @Field("Number")
  age: number;
}

function Field<T extends keyof JavaScriptTypeBuilder>(type: T, props: SchemaOptions) {
  return (target: any, propertyKey: string) => {
    (target.constructor as any).schema = (target.constructor as any).schema || {};
    (target.constructor as any).schema[propertyKey] = {
      type: type,
      props: props,
    };
  };
}

const example = new MyClass();
example.name = "hello";
example.age = 20;

// console.log({ name: example.name, age: example.age });

const mySchema = Type.Object((MyClass as any).schema);

console.log(mySchema);
