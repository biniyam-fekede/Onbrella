const reportLogic = require("../src/businessLogic/reportLogic");

describe("reportLogic", () => {
  beforeEach(() => {
    reportLogic.clear();
  });

  it("creates a report with unique id and status open", () => {
    const report = reportLogic.create({ message: "test" });
    expect(report.id).toBeDefined();
    expect(report.status).toBe("open");
    expect(report.createdAt).toBeDefined();
  });

  it("lists all reports", () => {
    reportLogic.create({ message: "one" });
    reportLogic.create({ message: "two" });
    const reportList = reportLogic.listAll();
    expect(reportList.length).toBe(2);
    expect(reportList[0].message).toBe("one");
    expect(reportList[1].message).toBe("two");
  });

  it("gets a report by id", () => {
    const report = reportLogic.create({ message: "find me" });
    const found = reportLogic.get(report.id);
    expect(found).toEqual(report);
    expect(reportLogic.get("nonexistent")).toBeNull();
  });

  it("resolves a report", () => {
    const report = reportLogic.create({ message: "resolve me" });
    const resolved = reportLogic.resolve(report.id, "admin123");
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolverId).toBe("admin123");
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("returns null when resolving nonexistent report", () => {
    expect(reportLogic.resolve("badid", "admin")).toBeNull();
  });
});