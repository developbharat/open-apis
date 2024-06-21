import { describe, it, expect } from "bun:test";
import { init_express } from "../../src/adapters/express";
import request from "supertest";
import express from "express";
import { Route } from "../../src";

describe("Express Examples", () => {
  it("create new article", async () => {
    const app = express();

    // enable request data parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const endpoint = Route()
      .setPath("get", "/articles")
      .setHandle(() => ({ success: true }))
      .build();
    init_express(app, [endpoint]);

    const res = await request(app).get("/articles");
    const data = await res.body;
    expect(data).toMatchObject({ success: true });
  });
});
