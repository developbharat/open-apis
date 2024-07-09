import busboy from "busboy";
import { createReadStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { IncomingMessage } from "http";
import path from "path";
import { Transform } from "stream";
import { IOpenRequestBody, IOpenRequestFile } from "../../contracts/core";

class StreamSizeCounter extends Transform {
  public bytesCount = 0;

  _transform(chunk: Uint8Array, _encoding: string, callback: Function) {
    this.bytesCount += chunk.length;
    this.push(chunk);
    callback();
  }
}

export interface IParseFormOptions {
  fileSaveTempDirPath: string;
  saveFilesToDisk: boolean;
}

export const parseForm = async (
  options: IParseFormOptions,
  req: IncomingMessage,
): Promise<IOpenRequestBody> => {
  const data: IOpenRequestBody = {};
  const bb = busboy({ headers: req.headers });

  return await new Promise<IOpenRequestBody>((resolve1, reject1) => {
    bb.on("file", async (fieldname, file, info) => {
      const extension = path.extname(info.filename);

      // write file to disk
      if (options.saveFilesToDisk) {
        // create temp directories incase they don't exist.
        await mkdir(options.fileSaveTempDirPath, { recursive: true });

        const tempFilename = crypto.randomUUID();
        const tempFilePath = path.join(options.fileSaveTempDirPath, tempFilename + extension);

        // write to disk
        const streamSizeCounter = new StreamSizeCounter();
        const writableStream = createWriteStream(tempFilePath);
        await new Promise<void>((resolve, reject) =>
          file
            .pipe(streamSizeCounter)
            .pipe(writableStream)
            .on("finish", resolve)
            .on("error", reject),
        );

        data[fieldname] = {
          filename: info.filename,
          mime: info.mimeType,
          encoding: info.encoding,
          size: streamSizeCounter.bytesCount,
          extension: extension,
          tmpFilePath: tempFilePath,
          stream: createReadStream(tempFilePath),
          isSavedToDisk: true,
        } as IOpenRequestFile;
        return;
      }

      data[fieldname] = {
        filename: info.filename,
        mime: info.mimeType,
        encoding: info.encoding,
        size: 0,
        extension: extension,
        tmpFilePath: "",
        stream: file,
        isSavedToDisk: false,
      } as IOpenRequestFile;
    });

    bb.on("field", (fieldname, value, _info) => (data[fieldname] = value));
    bb.on("close", () => resolve1(data));
    bb.on("error", reject1);
  });
};
