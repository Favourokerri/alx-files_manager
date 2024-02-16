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
stRoutes.get('/files', FilesController.getIndex);
stRoutes.get('/files/:id', FilesController.getShow);
stRoutes.put('/files/:id/publish', FilesController.putPublish);
stRoutes.put('/files/:id/unpublish', FilesController.putUnpublish);
// stRoutes.put('/files/:id/data', FilesController.getFile);
module.exports = stRoutes;
