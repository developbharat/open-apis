import { Readable } from "stream";

export type IOpenRequestBody = Record<string, string | number | boolean | IOpenRequestFile>;

export interface OpenRequest {
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
  readonly headers: Record<string, string>;
  readonly body: IOpenRequestBody;
  readonly secure: boolean;
  readonly path: string;
  readonly hostname: string;
  readonly method: string;
}

export interface OpenResponse {
  setHeader(name: string, value: string): any;
  statusCode: number;
  writableEnded: boolean;
  write(data: string): any;
  end(data?: string): any;
}

export interface IOpenRequestFile {
  filename: string;
  tmpFilePath: string;
  encoding: string;
  extension: string;
  mime: string;
  size: number;
  stream: Readable;
  isSavedToDisk: boolean;
}
