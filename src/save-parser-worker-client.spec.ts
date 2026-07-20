import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parsePalworldSaveInWorker,
  PALWORLD_SAVE_PARSE_TIMEOUT_MS,
} from "./save-parser-worker-client";

class FakeSaveParserWorker {
  readonly messages: unknown[] = [];
  readonly transfers: Transferable[][] = [];
  terminated = false;
  postMessageError?: Error;
  private messageListener?: (event: MessageEvent) => void;
  private errorListener?: (event: ErrorEvent) => void;

  addEventListener(type: "message" | "error", listener: EventListener): void {
    if (type === "message") {
      this.messageListener = listener as (event: MessageEvent) => void;
    } else {
      this.errorListener = listener as (event: ErrorEvent) => void;
    }
  }

  postMessage(message: unknown, transfer: Transferable[]) {
    if (this.postMessageError) throw this.postMessageError;
    this.messages.push(message);
    this.transfers.push(transfer);
  }

  terminate() {
    this.terminated = true;
  }

  emitMessage(data: unknown) {
    this.messageListener?.({ data } as MessageEvent);
  }

  emitError(message: string) {
    this.errorListener?.({ message } as ErrorEvent);
  }
}

const prepared = {
  v: 1,
  pals: [{ i: "pal-1", s: "Anubis" }],
};

afterEach(() => {
  vi.useRealTimers();
});

describe("parsePalworldSaveInWorker", () => {
  it("transfers the save buffer and terminates after success", async () => {
    const worker = new FakeSaveParserWorker();
    const saveBuffer = new ArrayBuffer(32);
    const result = parsePalworldSaveInWorker({
      saveBuffer,
      createWorker: () => worker,
    });

    expect(worker.messages).toEqual([{ saveBuffer }]);
    expect(worker.transfers).toEqual([[saveBuffer]]);

    worker.emitMessage({ ok: true, prepared });

    await expect(result).resolves.toBe(prepared);
    expect(worker.terminated).toBe(true);
  });

  it("terminates and preserves a serialized parser error", async () => {
    const worker = new FakeSaveParserWorker();
    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => worker,
    });

    worker.emitMessage({
      ok: false,
      error: {
        name: "PalworldSavHeaderError",
        message: "Save limit exceeded.",
        code: "save_limit_exceeded",
      },
    });

    await expect(result).rejects.toMatchObject({
      name: "PalworldSavHeaderError",
      message: "Save limit exceeded.",
      code: "save_limit_exceeded",
    });
    expect(worker.terminated).toBe(true);
  });

  it("terminates when the worker reports an execution error", async () => {
    const worker = new FakeSaveParserWorker();
    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => worker,
    });

    worker.emitError("worker crashed");

    await expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_worker_failed",
    });
    expect(worker.terminated).toBe(true);
  });

  it("terminates and rejects malformed worker responses", async () => {
    const worker = new FakeSaveParserWorker();
    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => worker,
    });

    worker.emitMessage(null);

    await expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_worker_failed",
    });
    expect(worker.terminated).toBe(true);
  });

  it("terminates when transferring the save buffer fails", async () => {
    const worker = new FakeSaveParserWorker();
    worker.postMessageError = new Error("transfer failed");

    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => worker,
    });

    await expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_worker_failed",
    });
    expect(worker.terminated).toBe(true);
  });

  it("terminates and rejects when parsing exceeds the time limit", async () => {
    vi.useFakeTimers();
    const worker = new FakeSaveParserWorker();
    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => worker,
    });
    const assertion = expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_timeout",
    });

    await vi.advanceTimersByTimeAsync(PALWORLD_SAVE_PARSE_TIMEOUT_MS);

    await assertion;
    expect(worker.terminated).toBe(true);
  });

  it("terminates and rejects when parsing is cancelled", async () => {
    const worker = new FakeSaveParserWorker();
    const controller = new AbortController();
    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => worker,
      signal: controller.signal,
    });

    controller.abort();

    await expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_aborted",
    });
    expect(worker.terminated).toBe(true);

    worker.emitMessage({ ok: true, prepared });
    await expect(result).rejects.toMatchObject({
      code: "save_parser_aborted",
    });
  });

  it("does not create a worker when parsing was already cancelled", async () => {
    const controller = new AbortController();
    const createWorker = vi.fn(() => new FakeSaveParserWorker());
    controller.abort();

    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker,
      signal: controller.signal,
    });

    await expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_aborted",
    });
    expect(createWorker).not.toHaveBeenCalled();
  });

  it("rejects when an isolated worker cannot be created", async () => {
    const result = parsePalworldSaveInWorker({
      saveBuffer: new ArrayBuffer(32),
      createWorker: () => {
        throw new Error("unsupported");
      },
    });

    await expect(result).rejects.toMatchObject({
      name: "PalworldSaveParserWorkerError",
      code: "save_parser_worker_unavailable",
    });
  });
});
