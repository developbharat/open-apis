import { IncomingMessage } from "http";
import { IOpenRequestBody } from "../../contracts/core";

export const parseJson = async (req: IncomingMessage) => {
  return await new Promise<IOpenRequestBody>((resolve, reject) => {
    const chunks: any[] = [];
    req
      .on("data", (chunk: any) => chunks.push(chunk))
      .on("end", () => {
        const contents = Buffer.concat(chunks).toString();
        return resolve(JSON.parse(contents));
      })
      .on("error", (err) => {
        return reject(err);
      });
  });
};
