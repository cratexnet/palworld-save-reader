import type { PreparedOwnedPalsUpload } from "./prepared-owned-pals-upload";

export const PALWORLD_SAVE_PARSE_TIMEOUT_MS = 60_000;

interface ParseSaveRequest {
  saveBuffer: ArrayBuffer;
}

type ParseSaveResponse =
  | { ok: true; prepared: PreparedOwnedPalsUpload }
  | {
      ok: false;
      error: { name: string; message: string; code?: string };
    };

interface SaveParserWorker {
  addEventListener(
    type: "message" | "error",
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void;
  postMessage(message: unknown, transfer: Transferable[]): void;
  terminate(): void;
}

export class PalworldSaveParserWorkerError extends Error {
  constructor(
    message: string,
    readonly code:
      | "save_parser_timeout"
      | "save_parser_aborted"
      | "save_parser_worker_failed"
      | "save_parser_worker_unavailable",
  ) {
    super(message);
    this.name = "PalworldSaveParserWorkerError";
  }
}

export interface ParsePalworldSaveInWorkerInput {
  saveBuffer: ArrayBuffer;
  createWorker: () => SaveParserWorker;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export function parsePalworldSaveInWorker(
  input: ParsePalworldSaveInWorkerInput,
): Promise<PreparedOwnedPalsUpload> {
  return new Promise((resolve, reject) => {
    if (input.signal?.aborted) {
      reject(createAbortedError());
      return;
    }

    let worker: SaveParserWorker;
    try {
      worker = input.createWorker();
    } catch {
      reject(
        new PalworldSaveParserWorkerError(
          "An isolated save parser worker is unavailable.",
          "save_parser_worker_unavailable",
        ),
      );
      return;
    }

    let settled = false;
    const timeoutId = setTimeout(() => {
      finish(() =>
        reject(
          new PalworldSaveParserWorkerError(
            "Palworld save parsing exceeded the time limit.",
            "save_parser_timeout",
          ),
        ),
      );
    }, input.timeoutMs ?? PALWORLD_SAVE_PARSE_TIMEOUT_MS);

    function finish(callback: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      input.signal?.removeEventListener("abort", handleAbort);
      worker.terminate();
      callback();
    }

    function handleAbort() {
      finish(() => reject(createAbortedError()));
    }

    input.signal?.addEventListener("abort", handleAbort, { once: true });
    if (input.signal?.aborted) {
      handleAbort();
      return;
    }

    worker.addEventListener(
      "message",
      ((event: MessageEvent<ParseSaveResponse>) => {
        if (!isParseSaveResponse(event.data)) {
          finish(() =>
            reject(
              new PalworldSaveParserWorkerError(
                "The save parser worker returned an invalid response.",
                "save_parser_worker_failed",
              ),
            ),
          );
          return;
        }
        finish(() => {
          if (event.data.ok) {
            resolve(event.data.prepared);
            return;
          }
          reject(
            Object.assign(new Error(event.data.error.message), {
              name: event.data.error.name,
              code: event.data.error.code,
            }),
          );
        });
      }) as EventListener,
      { once: true },
    );
    worker.addEventListener(
      "error",
      ((event: ErrorEvent) => {
        finish(() =>
          reject(
            new PalworldSaveParserWorkerError(
              event.message || "The save parser worker failed.",
              "save_parser_worker_failed",
            ),
          ),
        );
      }) as EventListener,
      { once: true },
    );

    try {
      const request: ParseSaveRequest = {
        saveBuffer: input.saveBuffer,
      };
      worker.postMessage(request, [input.saveBuffer]);
    } catch {
      finish(() =>
        reject(
          new PalworldSaveParserWorkerError(
            "The save could not be transferred to the parser worker.",
            "save_parser_worker_failed",
          ),
        ),
      );
    }
  });
}

function createAbortedError() {
  return new PalworldSaveParserWorkerError(
    "Palworld save parsing was cancelled.",
    "save_parser_aborted",
  );
}

function isParseSaveResponse(value: unknown): value is ParseSaveResponse {
  if (!value || typeof value !== "object" || !("ok" in value)) return false;
  if (value.ok === true) {
    return (
      "prepared" in value &&
      value.prepared !== null &&
      typeof value.prepared === "object"
    );
  }
  if (value.ok !== false || !("error" in value)) return false;
  const error = value.error;
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    typeof error.name === "string" &&
    "message" in error &&
    typeof error.message === "string" &&
    (!("code" in error) ||
      error.code === undefined ||
      typeof error.code === "string")
  );
}
