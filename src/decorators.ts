import "reflect-metadata";
import { ArrayOptions, ObjectOptions, TSchema, Type as t } from "@sinclair/typebox";

// Map to store property keys for each class
const classProperties = new Map<any, string[]>();

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
  (target: any, propertyKey: string) => {
    if (!target)
      throw new Error(
        "ResSchema decorator must be used on class instance. Example @ResSchema()\nclass Sample{}",
      );

    // prepare final schema from class properties
    const properties = classProperties.get(target) || [];
    const props: Record<string, TSchema> = {};
    properties.forEach((property) => {
      const metadata = Reflect.getMetadata("tschema", target.prototype, property);
      props[property] = metadata;
    });

    const finalSchema = options.multiple
      ? t.Array(t.Object(props), options.options)
      : t.Object(props);

    // set final schema
    Reflect.defineMetadata("schema", finalSchema, target);
  };

export interface IResFieldOptions {
  name?: string;
  description?: string;
}

export const ResField =
  <T extends keyof typeof t>(
    type_name: T,
    options?: (typeof t)[T] extends (...args: any[]) => any ? Parameters<(typeof t)[T]>[0] : never,
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
    const tschema = (t[type_name] as any)(options || {});
    Reflect.defineMetadata("tschema", tschema, target, propertyKey);

    // Store the property key in the map
    if (!classProperties.has(target.constructor)) {
      classProperties.set(target.constructor, []);
    }
    classProperties.get(target.constructor)!.push(propertyKey);
  };

// @ResSchema()
// class SampleTest {
//   @ResField("String")
//   public name: string = "";

//   @ResField("Optional", t.String())
//   public count: number = 0;
// }

// @ResSchema()
// class AnotherTest {
//   @ResField()
//   public color: string = "";
//   @ResField()
//   public intensity: number = 0;
// }

// const schema1 = Reflect.getMetadata("schema", SampleTest);
// console.log({ schema1 }); // we expect 'i am variable name'

// const schema2 = Reflect.getMetadata("schema", AnotherTest);
// console.log({ schema2 }); // we expect 'i am variable color i am variable intensity'
