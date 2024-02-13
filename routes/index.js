const Router = require('express');
const AppController = require('../controllers/AppController');

const stRoutes = Router();

stRoutes.get('/status', AppController.getStatus);
stRoutes.get('/stats', AppController.getStats);

module.exports = stRoutes;
