/// <reference types="vite/client" />

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import App from "../app/src/App";
import { ENGLISH_COMMON_MESSAGES, loadPageMessages } from "../app/src/i18n";

describe("standalone search combobox runtime", () => {
  it("renders without mixing controlled and uncontrolled input props", async () => {
    const messages = await loadPageMessages("en");
    const errors: string[] = [];
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args) => {
        errors.push(args.map(String).join(" "));
      });

    try {
      renderToString(
        createElement(App, {
          locale: "en",
          messages,
          common: ENGLISH_COMMON_MESSAGES,
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }

    expect(
      errors.filter((message) =>
        message.includes("both value and defaultValue props"),
      ),
    ).toEqual([]);
  });
});
