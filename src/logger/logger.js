const { Logger: LoggerService } = require('tslog');

class Logger extends LoggerService {
  #logger;

  constructor() {
    super();
    this.#logger = new LoggerService({
      displayInstanceName: false,
      displayLoggerName: false,
      displayFunctionName: false,
      displayFilePath: 'hidden',
    });
  }

  log(message) {
    this.#logger.info(message);
  }

  warn(message) {
    this.#logger.warn(message);
  }

  error(message) {
    this.#logger.error(message);
  }
}

module.exports = Logger;
