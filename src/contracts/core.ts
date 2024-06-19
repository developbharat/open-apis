export interface OpenRequest {
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
  readonly headers: Record<string, string>;
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
