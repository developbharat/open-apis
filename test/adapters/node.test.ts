import { describe, it, expect } from "bun:test";
import request from "supertest";
import { Route, nodeServerHandle } from "../../src";
import http from "http";

describe("Node Examples", () => {
  it("create new article", async () => {
    const endpoint = Route()
      .setPath("GET", "/articles")
      .setHandle(() => ({ success: true } as any))
      .build();

    const httpServer = http.createServer(
      nodeServerHandle({ endpoints: [endpoint], saveFilesToDisk: false }),
    );

    const res = await request(httpServer).get("/articles");
    const data = await res.body;
    expect(data).toMatchObject({ success: true });
  });
});
