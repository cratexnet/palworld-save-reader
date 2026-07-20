import { describe, expect, it } from "vitest";
import { mapSaveParserErrorToMessageKey } from "./save-parser-error-message";

function createCodedError(code: string) {
  return Object.assign(new Error(code), { code });
}

describe("save parser error messages", () => {
  it("separates parser timeouts from worker failures", () => {
    expect(
      mapSaveParserErrorToMessageKey(createCodedError("save_parser_timeout")),
    ).toBe("error.parser_timeout");
    expect(
      mapSaveParserErrorToMessageKey(
        createCodedError("save_parser_worker_failed"),
      ),
    ).toBe("error.parser_failed");
    expect(
      mapSaveParserErrorToMessageKey(
        createCodedError("save_parser_worker_unavailable"),
      ),
    ).toBe("error.parser_failed");
  });

  it("recognizes genuine decompression failures", () => {
    const namedError = new Error(
      "Palworld save payload is truncated: expected more bytes.",
    );
    namedError.name = "PalworldSavDecompressionError";

    expect(mapSaveParserErrorToMessageKey(namedError)).toBe(
      "error.decompression",
    );
    expect(
      mapSaveParserErrorToMessageKey(
        new Error("Could not decompress Palworld zlib payload."),
      ),
    ).toBe("error.decompression");
  });

  it("preserves specific parser blockers and the invalid-save fallback", () => {
    expect(
      mapSaveParserErrorToMessageKey(
        createCodedError("unsupported_oodle_decoder"),
      ),
    ).toBe("error.oodle");
    expect(
      mapSaveParserErrorToMessageKey(
        createCodedError("unsupported_gvas_parser"),
      ),
    ).toBe("error.structure");
    expect(
      mapSaveParserErrorToMessageKey(createCodedError("invalid_request")),
    ).toBe("error.invalid_request");
    expect(mapSaveParserErrorToMessageKey(new Error("Unknown save"))).toBe(
      "error.invalid_save",
    );
  });
});
