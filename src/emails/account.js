const nodemailer = require('nodemailer');
const { merge } = require('lodash');
require('dotenv').config();

const transportOptions = {
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.USER_PASS
  }
};

class EmailManager {
  #logger;
  #transporter;

  constructor(logger) {
    this.#logger = logger;
    this.#transporter = nodemailer.createTransport(transportOptions);
  }

  sendWelcomeEmail(email, name) {
    const options = {
      to: email,
      subject: 'Thanks for joining in!',
      text: `Welcome to the app, ${name}. Let me know how you get along with the app`,
    };

    this.#sendMail(options);
  }

  sendCancellationEmail(email, name) {
    const options = {
      to: email,
      subject: 'Sorry to see you go!',
      text: `Goodbye, ${name}. I hope to see you back sometime soon`,
    };

    this.#sendMail(options);
  }

  #sendMail(options) {
    let defaultOptions = {
      from: process.env.EMAIL_SENDER,
    };

    if (options) defaultOptions = merge(defaultOptions, options);

    this.#transporter.sendMail(defaultOptions, (err, info) => {
      if(err) {
        this.#logger.error(err);
        throw new Error(err.message);
      }

      this.#logger.log(info);
    });
  }
}

module.exports = {
  EmailManager,
};
