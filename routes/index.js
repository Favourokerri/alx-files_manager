const Router = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

const stRoutes = Router();

stRoutes.get('/status', AppController.getStatus);
stRoutes.get('/stats', AppController.getStats);
stRoutes.post('/users', UsersController.postNew);
stRoutes.get('/connect', AuthController.getConnect);
stRoutes.get('/disconnect', AuthController.getDisconnect);
stRoutes.get('/users/me', UsersController.getMe);
stRoutes.post('/files', FilesController.postUpload);

module.exports = stRoutes;
