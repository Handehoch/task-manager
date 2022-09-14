const User = require('../models/user.js');
const Logger = require('../logger/logger.js');
const BaseController = require('./baseController.js');
const Route = require('../route.js');
const auth = require('../middleware/auth.js');
const multer = require('multer');
const sharp = require('sharp');
const { EmailManager } = require('../emails/account');

const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error('Allowed file types: jpg, jpeg, png'));
    }

    callback(undefined, true);
  },
});

require('dotenv').config();

class UserController extends BaseController {
  #logger;
  emailManager;

  constructor() {
    super();
    this.#logger = new Logger();
    this.emailManager = new EmailManager(this.#logger);

    this.#useMiddleware();

    this.bindRoutes([
      new Route('/', 'get', this.getUsers),
      new Route('/me', 'get', this.getMyProfile),
      new Route('/login', 'post', this.login),
      new Route('/logout', 'post', this.logout),
      new Route('/logoutAll', 'post', this.logoutAll),
      new Route('/:id', 'get', this.getUser),
      new Route('/me', 'patch', this.updateUser),
      new Route('/me', 'delete', this.deleteUser),
      new Route('/', 'post', this.createUser),
      new Route('/me/avatar', 'delete', this.deleteAvatar),
      new Route('/:id/avatar', 'get', this.getAvatar),
    ]);
  }

  async getUsers(req, res) {
    try {
      const users = await User.find({});
      this.ok(res, users);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async getUser(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) return res.status(404).send();

      this.#logger.log(user.toJSON());
      this.ok(res, user);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async updateUser(req, res) {
    const updates = Object.keys(req.body);
    const validUpdates = ['name', 'age', 'email', 'password'];

    if (!updates.every((update) => validUpdates.includes(update))) {
      this.error(res, 400, 'Invalid update data.\'');
    }

    try {
      updates.forEach((update) => (req.user[update] = req.body[update]));
      await req.user.save();

      this.#logger.log(req.user);
      this.ok(res, req.user);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async deleteUser(req, res) {
    try {
      this.emailManager.sendCancellationEmail(req.user.email, req.user.name);
      await req.user.remove();
      this.#logger.log(req.user);
      this.ok(res, req.user);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async createUser(req, res) {
    const user = new User(req.body);

    try {
      this.emailManager.sendWelcomeEmail(user.email, user.name);

      await user.save();

      const token = await user.generateAuthToken();

      this.#logger.log(user);
      this.created(res, { user, token });
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 400, { error: e.message });
    }
  }

  async login(req, res) {
    try {
      const user = await User.findByCredentials(
        req.body.email,
        req.body.password
      );
      const token = await user.generateAuthToken();
      this.created(res, { user, token });
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 400, { error: e.message });
    }
  }

  async logout(req, res) {
    try {
      req.user.tokens = req.user.tokens.filter(
        (token) => token.token !== req.token
      );
      await req.user.save();

      this.ok(res, { message: 'Logout successful' });
    } catch (e) {
      this.error(res, 500, e.message);
      this.#logger.error(e.message);
    }
  }

  async logoutAll(req, res) {
    try {
      req.user.tokens = [];
      await req.user.save();

      this.ok(res, { message: 'Logout successful' });
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, e.message);
    }
  }

  async getMyProfile(req, res) {
    try {
      this.#logger.log(req.user.toJSON());
      this.ok(res, req.user);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 501, e.message);
    }
  }

  async setAvatar(req, res) {
    req.user.avatar = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    await req.user.save();
    this.ok(res, { message: 'Avatar set' });
  }

  async deleteAvatar(req, res) {
    if (req.user.avatar === undefined) {
      this.error(res, 400, { message: 'No avatar' });
    }

    try {
      req.user.avatar = undefined;
      await req.user.save();
      this.#logger.log(req.user);
      this.ok(res, { message: 'Avatar successfully deleted' });
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, e.message);
    }
  }

  async getAvatar(req, res) {
    try {
      const user = await User.findById(req.params.id);

      res.set('Content-type', 'image/png');
      this.ok(res, user.avatar);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  #useMiddleware() {
    this.router.use('/me', auth);
    this.router.use('/logout', auth);
    this.router.use('/logoutAll', auth);
    this.router.post(
      '/me/avatar',
      upload.single('avatar'),
      this.setAvatar.bind(this),
      (error, req, res) => {
        res.status(400).send({ error: error.message });
      }
    );
  }
}

module.exports = UserController;
