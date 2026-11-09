import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getQueryClient } from "@tanstack/marko-query";
import { unregisterQueryClientFactory } from "../src/core/client.js";
import { createdClients, resetProbeFactory } from "./fixtures/probe-factory.js";
import { resetShared } from "./core/utils.js";
import { container, expectText, text } from "./utils.js";

describe("<query-client-factory>", () => {
  let root: HTMLElement;
  let instance: { destroy: () => void } | undefined;

  beforeEach(() => {
    unregisterQueryClientFactory();
    resetShared();
    resetProbeFactory();
  });

  afterEach(() => {
    instance?.destroy();
    instance = undefined;
    root.remove();
  });

  it("mounts a layout with the tag above a page with a query", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { default: Page } = await import("./fixtures/factory-page.marko");
      root = container();
      instance = Page.mount({}, root);

      await expectText(root, "data", "from factory");
      expect(text(root, "status")).toBe("success");
      expect(createdClients).toStrictEqual([getQueryClient()]);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
