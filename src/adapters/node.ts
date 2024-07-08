import type { IncomingMessage, OutgoingMessage } from "http";
import busboy from 'busboy';
import { IOpenRequestBody, IOpenRequestFile } from '../contracts/core'
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { Transform } from "stream";
import { tmpdir } from 'os';
import { mkdir } from 'fs/promises';

export interface INodeServerHandleOptions {
  // useDropzone?: boolean; // TODO: implement this
  fileSaveTempDirPath?: string; // TODO: Document them along with default vaulues
  saveFilesToDisk?: boolean; // TODO: document them along with default values.
}

export const nodeServerHandle = (options: INodeServerHandleOptions) => async (req: IncomingMessage, res: OutgoingMessage) => {
  // parse form data only when required  
  const form = await new Promise<IOpenRequestBody>(async (resolve, _) => {
    if (!["GET", "OPTIONS"].includes(req.method!)) {
      const tempFolder = path.join(tmpdir(), "open-apis", "files");

      // create temp directories incase they don't exist.
      await mkdir(tempFolder, { recursive: true })
      if (options.fileSaveTempDirPath) await mkdir(options.fileSaveTempDirPath, { recursive: true });

      // parse form data
      const opts = {
        saveFilesToDisk: options.saveFilesToDisk ?? true,
        fileSaveTempDirPath: options.fileSaveTempDirPath ?? tempFolder
      } as IParseFormOptions;
      const data = await parseForm(opts, req);
      return resolve(data);
    }
    return resolve({});
  })

  // TODO: convert request to OpenRequest and response to OpenResponse


}

export interface IParseFormOptions {
  fileSaveTempDirPath: string;
  saveFilesToDisk: boolean;
}

class StreamSizeCounter extends Transform {
  public bytesCount = 0;

  _transform(chunk: Uint8Array, _encoding: string, callback: Function) {
    this.bytesCount += chunk.length;
    this.push(chunk);
    callback();
  }
}

export const parseForm = async (options: IParseFormOptions, req: IncomingMessage): Promise<IOpenRequestBody> => {
  const data: IOpenRequestBody = {};
  const bb = busboy({ headers: req.headers });

  return await new Promise<IOpenRequestBody>((resolve1, reject1) => {
    bb.on("file", async (fieldname, file, info) => {
      const extension = path.extname(info.filename);


      // write file to disk
      if (options.saveFilesToDisk) {
        const tempFilename = crypto.randomUUID();
        const tempFilePath = path.join(options.fileSaveTempDirPath, tempFilename + extension);

        // write to disk 
        const streamSizeCounter = new StreamSizeCounter();
        const writableStream = createWriteStream(tempFilePath);
        await new Promise<void>((resolve, reject) => file.pipe(streamSizeCounter).pipe(writableStream).on("finish", resolve).on("error", reject));

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
        tmpFilePath: '',
        stream: file,
        isSavedToDisk: false,
      } as IOpenRequestFile;
    });


    bb.on("field", (fieldname, value, _info) => data[fieldname] = value);
    bb.on("close", () => resolve1(data));
    bb.on("error", reject1);
  })
}

