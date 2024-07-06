import "reflect-metadata";
import { ArrayOptions, ObjectOptions, TSchema, Type as t } from "@sinclair/typebox";

// Map to store property keys for each class
const classProperties = new Map<any, string[]>();

export enum ReflectSchemaField {
  REQ_DATA = "schema_request_data",
  REQ_PARAMS = "schema_request_params",
  REQ_HEADERS = "schema_request_headers",
  RES_DATA = "schema_response_data"
}

type IResSchemaOptions =
  | {
    multiple: true;
    options?: ArrayOptions;
  }
  | {
    multiple: false;
    options?: ObjectOptions;
  };

export const ResSchema =
  (options: IResSchemaOptions = { multiple: false }): any =>
    (target: any, _propertyKey: string) => {
      if (!target)
        throw new Error(
          "ResSchema decorator must be used on class instance. Example @ResSchema()\nclass Sample{}",
        );

      // prepare final schema from class properties
      const properties: string[] = classProperties.get(target) || [];

      // function to help us compile schema for request data, response data, request params etc.
      const create_schema = (properties: string[], opts: IResFieldOptions) => {
        const props: Record<string, TSchema> = {};
        properties.forEach((property) => {
          const metadata = Reflect.getMetadata("tschema", target.prototype, property);
          const extras: IResFieldOptions = Reflect.getMetadata("toptions", target.prototype, property);

          // add request params if enabled
          if (opts.asRequestParams && extras.asRequestParams)
            props[property] = metadata;

          if (opts.asRequestData && extras.asRequestData)
            props[property] = metadata;

          if (opts.asResponseData && extras.asResponseData)
            props[property] = metadata;
        });

        const finalSchema = options.multiple
          ? t.Array(t.Object(props), options.options)
          : t.Object(props);

        return finalSchema;
      }

      // build schema for request, response, and params
      const requestDataSchema = create_schema(properties, { asRequestData: true });
      const responseDataSchema = create_schema(properties, { asResponseData: true });
      const paramsSchema = create_schema(properties, { asRequestParams: true });
      const requestHeadersSchema = create_schema(properties, { asRequestHeaders: true });

      // set final schema
      Reflect.defineMetadata(ReflectSchemaField.REQ_DATA, requestDataSchema, target);
      Reflect.defineMetadata(ReflectSchemaField.RES_DATA, responseDataSchema, target);
      Reflect.defineMetadata(ReflectSchemaField.REQ_PARAMS, paramsSchema, target);
      Reflect.defineMetadata(ReflectSchemaField.REQ_HEADERS, requestHeadersSchema, target);
    };

export interface IResFieldOptions {
  asResponseData?: boolean;
  asRequestData?: boolean;
  asRequestParams?: boolean;
  asRequestHeaders?: boolean;
  optional?: boolean;
}

export const ResField =
  <T extends keyof typeof t>(
    type_name: T,
    options?: (typeof t)[T] extends (...args: any[]) => any ? Parameters<(typeof t)[T]>[0] : never,
    extras: IResFieldOptions = {},
  ): any =>
    (target: any, propertyKey: string) => {
      if (!propertyKey)
        throw new Error(
          "ResField decorator must be used on class variables. Example @ResField()\nname: string",
        );

      if (!type_name) {
        throw new Error("You must provide type in @ResField('String')");
      }
      // Property decorator logic
      let tschema = (t[type_name] as any)(options || {});
      if (extras.optional) tschema = t.Optional(tschema);

      Reflect.defineMetadata("tschema", tschema, target, propertyKey);
      Reflect.defineMetadata("toptions", extras, target, propertyKey);

      // Store the property key in the map
      if (!classProperties.has(target.constructor)) {
        classProperties.set(target.constructor, []);
      }
      classProperties.get(target.constructor)!.push(propertyKey);
    };

/*
@ResSchema()
class SampleTest {
  @ResField("String", {}, { asRequestParams: true, asResponseData: true })
  public name: string = "";
  @ResField("String", {}, { asRequestParams: true, optional: true })
  public count: number = 0;
}

@ResSchema()
class AnotherTest {
  @ResField('String')
  public color: string = "";
  @ResField("String")
  public intensity: number = 0;
}

const schema1 = Reflect.getMetadata(ReflectSchemaField.REQ_PARAMS, SampleTest);
const schema2 = Reflect.getMetadata(ReflectSchemaField.REQ_DATA, SampleTest);
const schema3 = Reflect.getMetadata(ReflectSchemaField.RES_DATA, SampleTest);
console.log({ schema1, schema2, schema3 });
*/
