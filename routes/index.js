const Router = require('express');
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UsersController');

const stRoutes = Router();

stRoutes.get('/status', AppController.getStatus);
stRoutes.get('/stats', AppController.getStats);
stRoutes.post('/users', UserController.postNew);

module.exports = stRoutes;
