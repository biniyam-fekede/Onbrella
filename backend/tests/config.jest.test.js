/**
 * Config module tests.
 */

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("defaults to port 5001 when PORT not set", () => {
    delete process.env.PORT;
    const config = require("../src/config");
    expect(config.port).toBe(5001);
  });

  test("uses PORT env var when set", () => {
    process.env.PORT = "8080";
    jest.resetModules();
    const config = require("../src/config");
    expect(config.port).toBe(8080);
  });

  test("defaults to localhost:3000 for hardwareUrl when HARDWARE_URL not set", () => {
    delete process.env.HARDWARE_URL;
    delete process.env.PORT;
    jest.resetModules();
    const config = require("../src/config");
    expect(config.hardwareUrl).toBe("http://localhost:3000");
  });

  test("uses HARDWARE_URL env var when set", () => {
    process.env.HARDWARE_URL = "http://mock:3000";
    jest.resetModules();
    const config = require("../src/config");
    expect(config.hardwareUrl).toBe("http://mock:3000");
  });
});
