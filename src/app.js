const express = require('express');
require('./db/mongoose.js');
const {json} = require('body-parser');


class App {
  app;
  #logger;
  #port;
  userController;
  taskController;

  constructor(logger, port, userController, taskController) {
    this.app = express();
    this.#logger = logger;
    this.#port = port;
    this.userController = userController;
    this.taskController = taskController;
  }

  #useRoutes() {
    this.app.use('/users', this.userController.router);
    this.app.use('/tasks', this.taskController.router);
  }

  init() {
    this.app.use(json());
    this.#useRoutes();
    this.app.listen(this.#port, () => {
      this.#logger.log(`Server is up on port ${this.#port}`);
    });
  }
}

module.exports = App;
