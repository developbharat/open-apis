import { IncomingMessage, ServerResponse } from "http";
import { tmpdir } from "os";
import path from "path";
import { IRouteOptions } from "../../Route";
import { OpenServe } from "../../TrieRouter";
import { IOpenRequestBody, OpenRequest } from "../../contracts/core";
import { IParseFormOptions, parseForm } from "./parseForm";

export interface INodeServerHandleOptions {
  // useDropzone?: boolean; // TODO: implement this
  fileSaveTempDirPath?: string; // TODO: Document them along with default vaulues
  saveFilesToDisk?: boolean; // TODO: document them along with default values.
  endpoints: IRouteOptions[];
}

export const nodeServerHandle =
  (options: INodeServerHandleOptions) => async (req: IncomingMessage, res: ServerResponse) => {
    // parse form data only when required
    const form = await new Promise<IOpenRequestBody>(async (resolve, _) => {
      if (!["GET", "OPTIONS"].includes(req.method!)) {
        const tempFolder = path.join(tmpdir(), "open-apis", "files");

        // parse form data
        const opts = {
          saveFilesToDisk: options.saveFilesToDisk ?? true,
          fileSaveTempDirPath: options.fileSaveTempDirPath ?? tempFolder,
        } as IParseFormOptions;
        const data = await parseForm(opts, req);
        return resolve(data);
      }
      return resolve({});
    });

    const api = OpenServe(...options.endpoints);
    (req as any).body = form;
    api.handle(req as OpenRequest, res);
  };