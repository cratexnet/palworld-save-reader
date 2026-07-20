export class PalworldBrowserWorkbenchError extends Error {
  constructor(
    message: string,
    readonly code:
      | "unsupported_oodle_decoder"
      | "unsupported_gvas_parser"
      | "invalid_save"
      | "invalid_request",
  ) {
    super(message);
    this.name = "PalworldBrowserWorkbenchError";
  }
}
