import * as t from "@sinclair/typebox";
import express from "express";
import { RouteBuilder } from "./Route";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const CreateArticleRoute = RouteBuilder.setPath("get", "/articles/:id/:name")
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
  .setMiddlewares()
  .setHandle(() => {
    console.log(
      "You will receive valid data here, and feel free to raise any exceptions of type CustomException from this function.",
    );
    return { name: "jonson" };
  })
  .build();

// handle requests using our route definitions
app.route(CreateArticleRoute.path)[CreateArticleRoute.method](async (req, res) => {
  try {
    // validate params
    const isParamsException = CreateArticleRoute.params.isValid(req.params);
    if (!!isParamsException) throw isParamsException;

    // validate data
    const reqData = { ...req.query, ...req.body };
    const isDataException = CreateArticleRoute.req_data.isValid(reqData);
    if (!!isDataException) throw isDataException;

    // execute middlewares
    for (const middleware of CreateArticleRoute.middlewares) {
      await middleware();
    }

    // execute request handlers
    const result = await CreateArticleRoute.handle();

    // clean result from handler
    const isResultException = CreateArticleRoute.res_data.isValid(result);
    if (!!isResultException) throw isResultException;
    const cleaned = CreateArticleRoute.res_data.clean(result);

    // Return cleaned data
    return res.json(cleaned);
  } catch (error) {
    return res.json({ error: (error as Error).message });
  }
});

app.use(async (req, res, next) => {
  return res.json({ success: true });
});

app.listen(4000, () => {
  console.log("Server started at http://localhost:4000");
});
