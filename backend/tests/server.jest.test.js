/**
 * Unit tests for the backend entry point (src/server.js).
 */

// mocks must be setup before requiring the module under test
jest.mock("../src/app", () => ({
  // mimic express application object; invoke the callback immediately
  listen: jest.fn((port, cb) => {
    if (typeof cb === "function") cb();
    return { close: jest.fn() };
  }),
}));

jest.mock("../src/config", () => ({ port: 5555 }));

const { backendInitialized, start, app } = require("../src/server");
const config = require("../src/config");

describe("server module", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("backendInitialized returns expected string", () => {
    expect(backendInitialized()).toBe("backend initialized");
  });

  test("start() calls app.listen with the configured port and logs", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const serverObj = start();

    expect(app.listen).toHaveBeenCalledWith(config.port, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith(
      `On-Brella backend listening on port ${config.port}`
    );
    expect(serverObj).toEqual({ close: expect.any(Function) });

    consoleSpy.mockRestore();
  });

  test("start returns whatever app.listen returns", () => {
    const dummy = { foo: "bar" };
    app.listen.mockReturnValue(dummy);
    const result = start();
    expect(result).toBe(dummy);
  });

  // exercise the "run directly" path by spawning a separate node process
  test("executing server.js directly triggers the startup branch", (done) => {
    const { spawn } = require("child_process");
    const proc = spawn(process.execPath, ["src/server.js"], {
      cwd: __dirname + "/..",
      env: { ...process.env, PORT: "0" },
    });
    let sawLog = false;
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      if (text.includes("On-Brella backend listening on port")) {
        sawLog = true;
        proc.kill();
      }
    });
    proc.on("exit", () => {
      expect(sawLog).toBe(true);
      done();
    });
  });
});
