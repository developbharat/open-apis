import { describe, it, expect } from "bun:test";
import { init_express } from "../../src/adapters/express";
import request from "supertest";
import express from "express";
import { Route } from "../../src";

describe("Express Examples", () => {
  it("create new article", async () => {
    const app = express();

    const route = Route.setPath("get", "/articles")
      .setHandle(() => ({ success: true }))
      .build();
    init_express(app, [route]);

    const res = await request(app).get("/articles");
    const data = await res.body;
    expect(data).toMatchObject({ success: true });
  });
});
