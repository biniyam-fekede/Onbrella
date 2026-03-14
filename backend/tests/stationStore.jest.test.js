const store = require("../src/store/stationStore");

beforeEach(() => {
  store.clear();
});

describe("stationStore", () => {
  test("createStation stores and getStation returns the station", () => {
    const s = store.createStation("s1", 10, 5);
    expect(s.stationId).toBe("s1");
    expect(s.capacity).toBe(10);
    expect(s.umbrellasAvailable).toBe(5);

    const fetched = store.getStation("s1");
    expect(fetched).toEqual(s);
  });

  test("listStations returns all created stations", () => {
    store.createStation("a", 4, 1);
    store.createStation("b", 6, 2);
    const list = store.listStations();
    expect(list).toHaveLength(2);
    expect(list.map((x) => x.stationId).sort()).toEqual(["a", "b"]);
  });

  test("validation: invalid inputs throw error", () => {
    expect(() => store.createStation("", 5, 1)).toThrow();
    expect(() => store.createStation("x", 0, 0)).toThrow();
    expect(() => store.createStation("x", 5, -1)).toThrow();
    expect(() => store.createStation("x", 5, 6)).toThrow();
  });

  test("decrementUmbrellasAvailable decrements and enforces no-negative", () => {
    store.createStation("s2", 2, 1);
    const afterDec = store.decrementUmbrellasAvailable("s2");
    expect(afterDec.umbrellasAvailable).toBe(0);
    expect(() => store.decrementUmbrellasAvailable("s2")).toThrow(/No available umbrellas/);
  });

  test("incrementUmbrellasAvailable increments and checks capacity", () => {
    store.createStation("s3", 2, 1);
    const afterInc = store.incrementUmbrellasAvailable("s3");
    expect(afterInc.umbrellasAvailable).toBe(2);
    expect(() => store.incrementUmbrellasAvailable("s3")).toThrow(/Station is full/);
  });

  test("operations on unknown station throw error", () => {
    expect(() => store.decrementUmbrellasAvailable("nope")).toThrow(/Station not found/);
    expect(() => store.incrementUmbrellasAvailable("nope")).toThrow(/Station not found/);
    expect(store.getStation("nope")).toBeUndefined();
  });
});