import {
  STOCKFISH_ENGINE_SOURCE,
  buildEngineEvaluationView,
  parseStockfishBestMoveLine,
  parseStockfishInfoLine
} from "../src/domain/chess/engine-evaluation.mjs";

type EngineEvaluationView = ReturnType<typeof buildEngineEvaluationView>;
type ParsedStockfishInfo = ReturnType<typeof parseStockfishInfoLine>;

type EvaluationOptions = Readonly<{
  movetimeMs?: number;
  timeoutMs?: number;
}>;

type LineWaiter = {
  predicate: (line: string) => boolean;
  resolve: (line: string) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

type ActiveAnalysis = {
  fen: string;
  latestInfo: ParsedStockfishInfo;
  resolve: (view: EngineEvaluationView) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

const DEFAULT_WORKER_PATH = "/vendor/stockfish/stockfish-18-lite-single.js";
const DEFAULT_MOVETIME_MS = 650;
const DEFAULT_TIMEOUT_MS = 7000;

export class BrowserStockfishEvaluator {
  private readonly workerPath: string;
  private worker: Worker | null = null;
  private bootPromise: Promise<void> | null = null;
  private waiters: LineWaiter[] = [];
  private activeAnalysis: ActiveAnalysis | null = null;

  constructor(workerPath = DEFAULT_WORKER_PATH) {
    this.workerPath = workerPath;
  }

  async evaluateFen(fen: string, options: EvaluationOptions = {}) {
    await this.ensureReady();

    if (this.activeAnalysis) {
      this.activeAnalysis.reject(new Error("Stockfish analysis superseded by a newer position."));
      clearTimeout(this.activeAnalysis.timeoutId);
      this.activeAnalysis = null;
      this.post("stop");
    }

    const movetimeMs = options.movetimeMs ?? DEFAULT_MOVETIME_MS;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return new Promise<EngineEvaluationView>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.activeAnalysis?.fen === fen) {
          this.activeAnalysis = null;
          this.post("stop");
        }
        reject(new Error("Stockfish analysis timed out."));
      }, timeoutMs);

      this.activeAnalysis = {
        fen,
        latestInfo: null,
        resolve,
        reject,
        timeoutId
      };

      this.post("ucinewgame");
      this.post(`position fen ${fen}`);
      this.post(`go movetime ${movetimeMs}`);
    });
  }

  dispose() {
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timeoutId);
      waiter.reject(new Error("Stockfish evaluator disposed."));
    }

    this.waiters = [];

    if (this.activeAnalysis) {
      clearTimeout(this.activeAnalysis.timeoutId);
      this.activeAnalysis.reject(new Error("Stockfish evaluator disposed."));
      this.activeAnalysis = null;
    }

    this.worker?.terminate();
    this.worker = null;
    this.bootPromise = null;
  }

  private async ensureReady() {
    if (this.bootPromise) {
      return this.bootPromise;
    }

    if (!this.worker) {
      this.worker = new Worker(this.workerPath);
      this.worker.addEventListener("message", this.handleMessage);
      this.worker.addEventListener("error", this.handleWorkerError);
      this.worker.addEventListener("messageerror", this.handleWorkerError);
    }

    this.bootPromise = this.bootWorker();
    return this.bootPromise;
  }

  private async bootWorker() {
    const uciReady = this.waitForLine((line) => line === "uciok", "Stockfish did not confirm UCI mode.");
    this.post("uci");
    await uciReady;

    const engineReady = this.waitForLine((line) => line === "readyok", "Stockfish did not become ready.");
    this.post("isready");
    await engineReady;
  }

  private waitForLine(predicate: (line: string) => boolean, timeoutMessage: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise<string>((resolve, reject) => {
      const waiter: LineWaiter = {
        predicate,
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          this.waiters = this.waiters.filter((candidate) => candidate !== waiter);
          reject(new Error(timeoutMessage));
        }, timeoutMs)
      };

      this.waiters.push(waiter);
    });
  }

  private readonly handleMessage = (event: MessageEvent) => {
    const line = typeof event.data === "string" ? event.data : String(event.data ?? "");

    if (!line) {
      return;
    }

    this.resolveWaiters(line);
    this.updateActiveAnalysis(line);
  };

  private resolveWaiters(line: string) {
    const matched: LineWaiter[] = [];

    for (const waiter of this.waiters) {
      if (waiter.predicate(line)) {
        matched.push(waiter);
      }
    }

    if (matched.length === 0) {
      return;
    }

    this.waiters = this.waiters.filter((waiter) => !matched.includes(waiter));

    for (const waiter of matched) {
      clearTimeout(waiter.timeoutId);
      waiter.resolve(line);
    }
  }

  private updateActiveAnalysis(line: string) {
    if (!this.activeAnalysis) {
      return;
    }

    const parsedInfo = parseStockfishInfoLine(line);
    if (parsedInfo) {
      this.activeAnalysis.latestInfo = parsedInfo;
      return;
    }

    if (!line.startsWith("bestmove ")) {
      return;
    }

    const active = this.activeAnalysis;
    this.activeAnalysis = null;
    clearTimeout(active.timeoutId);

    active.resolve(
      buildEngineEvaluationView({
        fen: active.fen,
        info: active.latestInfo,
        bestMove: parseStockfishBestMoveLine(line),
        source: STOCKFISH_ENGINE_SOURCE
      })
    );
  }

  private readonly handleWorkerError = () => {
    const error = new Error("Stockfish worker is unavailable.");

    for (const waiter of this.waiters) {
      clearTimeout(waiter.timeoutId);
      waiter.reject(error);
    }
    this.waiters = [];

    if (this.activeAnalysis) {
      clearTimeout(this.activeAnalysis.timeoutId);
      this.activeAnalysis.reject(error);
      this.activeAnalysis = null;
    }

    this.worker?.terminate();
    this.worker = null;
    this.bootPromise = null;
  };

  private post(command: string) {
    this.worker?.postMessage(command);
  }
}
