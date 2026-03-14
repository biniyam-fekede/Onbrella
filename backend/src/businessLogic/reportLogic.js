// we have a unique id for each report that will be the 
// the key in the report map, mapped to a report object for the value
let nextId = 1; 
const reports = new Map(); 

// this function creats and returns a new report object
// with an id, status, and date it was created to be stored in map
// id is incremented each time so it can be a unique key we can usee for report lookup
function create(report) {
  const id = String(nextId++);
  const r = {
    id,
    status: "open", // Initial status
    createdAt: Date.now(),
    ...report,
  };
  reports.set(id, r);
  return r;
}

// this function just takes the reports values and converts
// them to an array
function listAll() {
  return Array.from(reports.values());
}

// this function gets us a report object using its id
function get(id) {
  return reports.get(id) || null;
}

// this function takes the report id  and uses it to get the report object
// and returns a resolved version of the report with the status changed to resolved
// the date it was resolved, and the id of the person thart resolved it
function resolve(id, resolverId) {
  const r = reports.get(id);
  if (!r) return null;
  r.status = "resolved";
  r.resolvedAt = Date.now();
  r.resolverId = resolverId || null;
  return r;
}

// a clear function we can use for testing
function clear() {
  reports.clear();
  nextId = 1;
}

// export all the function so we can use them in other files
module.exports = {
  create,
  listAll,
  get,
  resolve,
  clear,
};