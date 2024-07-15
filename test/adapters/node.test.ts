import { describe, it, expect } from "bun:test";
import request from "supertest";
import { Route, nodeServerHandle, t } from "../../src";
import http from "http";

describe("Node Examples", () => {
  it("GET /article works", async () => {
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

  it("POST /article works", async () => {
    const endpoint = Route()
      .setPath("POST", "/articles")
      .setRequestData(
        t.Object({
          name: t.String(),
        }),
      )
      .setHandle((req) => ({ success: true, name: req.body.name } as any))
      .build();

    const httpServer = http.createServer(
      nodeServerHandle({ endpoints: [endpoint], saveFilesToDisk: false }),
    );

    const res = await request(httpServer)
      .post("/articles")
      .send({ name: "abcd" })
      .set("Content-Type", "application/json");

    const data = await res.body;
    expect(data).toMatchObject({ success: true, name: "abcd" });
  });

  it("POST /article/:id works", async () => {
    const endpoint = Route()
      .setPath("POST", "/article/:id")
      .setParams(
        t.Object({
          id: t.String({ minLength: 3 }),
        }),
      )
      .setRequestData(
        t.Object({
          name: t.String(),
        }),
      )
      .setHandle((req) => ({ success: true, id: req.params.id } as any))
      .build();

    const httpServer = http.createServer(
      nodeServerHandle({ endpoints: [endpoint], saveFilesToDisk: false }),
    );

    const res = await request(httpServer)
      .post("/article/1234")
      .send({ name: "abcd" })
      .set("Content-Type", "application/json");

    const data = await res.body;
    expect(data).toMatchObject({ success: true, id: "1234" });
  });

  it("GET /article?id=10 works", async () => {
    const endpoint = Route()
      .setPath("GET", "/article")
      .setHandle((req) => ({ success: true, id: req.query.id } as any))
      .build();

    const httpServer = http.createServer(
      nodeServerHandle({ endpoints: [endpoint], saveFilesToDisk: false }),
    );

    const res = await request(httpServer)
      .get("/article?id=10")
      .send()
      .set("Content-Type", "application/json");

    const data = await res.body;
    expect(data).toMatchObject({ success: true, id: "10" });
  });
});
