const { Router } = require('express');
const Logger = require('../logger/logger.js');

class BaseController {
  #logger;
  #router;

  constructor() {
    this.#logger = new Logger();
    this.#router = new Router();
  }

  get router() {
    return this.#router;
  }

  #send(res, code, message) {
    return res.status(code).send(message);
  }

  created(res, message) {
    return this.#send(res, 201, message);
  }

  ok(res, message) {
    return this.#send(res, 200, message);
  }

  error(res, code, message) {
    return this.#send(res, code, message);
  }

  notFound(req, res) {
    return this.#send(res, 404, 'Page nor found');
  }

  bindRoutes(routes) {
    this.#logger.warn(this.constructor.name);
    for (const route of routes) {
      this.#logger.log(`[${route.method}] ${route.path}`);
      this.router[route.method](route.path, route.func.bind(this));
    }
  }
}

module.exports = BaseController;
