class Route {
  path;
  method;
  func;

  constructor(path, method, func) {
    this.path = path;
    this.method = method;
    this.func = func;
  }
}

module.exports = Route;

