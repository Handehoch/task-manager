const App = require('./src/app.js');
const Logger = require('./src/logger/logger.js');
const UserController = require('./src/controllers/userController.js');
const TaskController = require('./src/controllers/taskController.js');

(async function main() {
  const app = new App(
    new Logger(),
      // eslint-disable-next-line no-undef
    process.env.PORT || 8080,
    new UserController(),
    new TaskController()
  );

  app.init();
})();
