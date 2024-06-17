import { describe, it, expect } from 'bun:test'
import { RouteBuilder, Route } from '../src/Route'

describe('Route', () => {
  it('initializes', () => {
    expect(Route).toBeInstanceOf(RouteBuilder)
    expect(Route.build).toBeDefined()
  })

  it('create GET /articles route', () => {
    const created = Route.setPath("get", "/articles")
      .setHandle(() => { })
      .build();

    expect(created.path).toBe("/articles");
    expect(created.method).toBe("get");
    expect(created.__handle).toBeFunction();
  })
})
