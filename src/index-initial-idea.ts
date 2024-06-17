
interface RouteData{
  handle: Function;
  serialisedHandle: string;
  path: string;
}

export class Route{

  setPath(method: string, path: string): Route{
    return this;
  }

  setParams(params: object): Route{
    return this;
  }

  setRequestData(data: object): Route{
    return this;
  }
  
  setRequestHeaders(headers: object): Route{
    return this;
  }

  setResponseHeaders(headers: object): Route{
    return this;
  }

  setResponseData(data: object): Route{
    return this;
  }
 
  setMiddlewares(...middlewares: Function[]): Route{
    return this;
  }

  setHandle(middleware: Function): Route{
    return this;
  }

  build(): RouteData {
    return {
      handle: () => null,
      serialisedHandle: '',
      path: "/test"
    }
  }
} 

@ResponseFormat()
export class Article{
  @ResponseField(Fields.ID)
  id: number;

  @ResponseField(Fields.Text)
  title: string;

  @ResponseField(Fields.Text)
  description: string;

  user_id: number;
}

const RouteBuilder = () => new Route();

export const CreateArticleRoute = RouteBuilder
  .setPath("POST", "/articles/:id/:name")
  .setParams(t.object({
    id: t.string({ length: 10, format: 'uuid', error: "Invalid param value id provided." }),
    name: t.string({minLength: 10, maxLength: 20})
  }))
  .setRequestData({
    title: t.string({minLength: 10, format: 'alphanum', error: "Invalid title provided."}),
    description: t.string({ minLength: 10, maxLength: 2000, error: "Invalid description provided." }),
    one_file: t.File({extname: "png", minSize: '1mb', maxSize:'20mb']}),
    multiple_files: t.Files({extnames: ["png", "jpg","jpeg"], error:"Invalid file format provided, supported formats are: {{formats}}"})
  })
  .setResponseData(Article)
  .setMiddlewares(isAuthenticated)
  .setHandle(() => {
    console.log("You will receive valid data here, and feel free to raise any exceptions of type CustomException from this function.")
  })
  .build();

export const ListArticlesRoute = RouteBuilder
  .setPath("GET", "/articles")
  .setMiddlewares(isAuthenticated)
  .setResponseData([Article])
  .setHandle(() => [])
  .build();


export const CustomArticleRoute = RouteBuilder
  .setPath("GET", "/articles/home-screen")
  .setMiddlewares(isAuthenticated)
  .setResponseData({
    custom: true, 
    data: {
      articles: [Article],
      success: Fields.Boolean,
      status: Fields.String,
      favourites: {
        articles: [Article],
        label: Fields.String,
        description: Fields.String,
      } 
    }
  })
  .setHandle(() => ({
    articles: [],
    success: true,
    status: "Articles returned successfully.",
    favourites: {
      articles: [],
      label: "Favourite Artilces",
      description: "Articles marked as favourite will be visible in this section."
    }
  }))
  .build();

export const Routes = [CreateArticleRoute, ListArticlesRoute, CustomArticleRoute]

Bun.serve({
  fetch: (request, response) => {
    Routes.handle(request, response);
  }
})
console.log("Hello via Bun!");
