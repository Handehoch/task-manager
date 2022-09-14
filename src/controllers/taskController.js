const Task = require('../models/task');
const BaseController = require('./baseController.js');
const Logger = require('../logger/logger.js');
const Route = require('../route.js');
const auth = require('../middleware/auth.js');

class TaskController extends BaseController {
  #logger;

  constructor() {
    super();
    this.#logger = new Logger();

    this.#useMiddleware();

    this.bindRoutes([
      new Route('/', 'get', this.getTasks),
      new Route('/:id', 'get', this.getTask),
      new Route('/:id', 'patch', this.updateTask),
      new Route('/:id', 'delete', this.deleteTask),
      new Route('/', 'post', this.createTask),
    ]);
  }

  async getTasks(req, res) {
    const match = {};
    const sort = {};

    if (req.query.completed) {
      match.completed = req.query.completed === 'true';
    }

    if(req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1: 1;
    }

    try {
      // const tasks = await Task.find({owner: req.user._id});
      await req.user.populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      });
      this.ok(res, req.user.tasks);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async getTask(req, res) {
    try {
      const task = await Task.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!task) return this.error(res, 404, {});

      this.#logger.log(task);
      this.ok(res, task);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async updateTask(req, res) {
    const updates = Object.keys(req.body);
    const validUpdates = ['description', 'completed'];

    if (!updates.every((value) => validUpdates.includes(value))) {
      return res.status(400).send({ error: 'Invalid update data.' });
    }

    try {
      const task = await Task.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!task) return this.error(res, 404, {});

      updates.forEach((update) => (task[update] = req.body[update]));
      await task.save();

      this.#logger.log(task);
      this.ok(res, task);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async deleteTask(req, res) {
    try {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!task) return this.error(res, 404, {});

      this.#logger.log(task);
      this.ok(res, task);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 500, { error: e.message });
    }
  }

  async createTask(req, res) {
    const task = new Task({
      ...req.body,
      owner: req.user._id,
    });

    try {
      await task.save();
      this.#logger.log(task);
      this.created(res, task);
    } catch (e) {
      this.#logger.error(e.message);
      this.error(res, 400, { error: e.message });
    }
  }

  #useMiddleware() {
    this.router.post('/', auth);
    this.router.get('/', auth);
    this.router.use('/:id', auth);
  }
}

module.exports = TaskController;
