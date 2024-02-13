const Router = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

const stRoutes = Router();

stRoutes.get('/status', AppController.getStatus);
stRoutes.get('/stats', AppController.getStats);
stRoutes.post('/users', UsersController.postNew);

module.exports = stRoutes;
