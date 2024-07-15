import type { Readable } from "stream";
import type { IncomingMessage, ServerResponse } from "http";

export type IOpenRequestBody = Record<string, string | number | boolean | IOpenRequestFile>;

export interface OpenRequest extends IncomingMessage {
  readonly body: IOpenRequestBody;
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
}

export interface OpenResponse extends ServerResponse {}

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
