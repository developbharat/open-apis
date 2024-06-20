import "reflect-metadata";

// Map to store property keys for each class
const classProperties = new Map<any, string[]>();

export const ResSchema = (): any => (target: any, propertyKey: string) => {
  if (!target)
    throw new Error(
      "ResSchema decorator must be used on class instance. Example @ResSchema()\nclass Sample{}",
    );

  // prepare final schema from class properties
  const properties = classProperties.get(target) || [];
  let classSchema = "";
  properties.forEach((property) => {
    const metadata = Reflect.getMetadata("schema", target.prototype, property);
    if (metadata) {
      classSchema += metadata + " ";
    }
  });

  // set final schema and optionally remove blank out classProperties as they are no longer required.
  Reflect.defineMetadata("schema", classSchema.trim(), target);
};

export const ResField = (): any => (target: any, propertyKey: string) => {
  if (!propertyKey)
    throw new Error(
      "ResField decorator must be used on class variables. Example @Field()\nname: string",
    );

  // Property decorator logic
  Reflect.defineMetadata("schema", `i am variable ${propertyKey}`, target, propertyKey);

  // Store the property key in the map
  if (!classProperties.has(target.constructor)) {
    classProperties.set(target.constructor, []);
  }
  classProperties.get(target.constructor)!.push(propertyKey);
};

// @ResSchema()
// class SampleTest {
//   @ResField()
//   public name: string = "";
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
