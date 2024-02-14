const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function getConnect(req, res) {
  const authorize = req.get('Authorization').split(' ');

  if (authorize[0] === 'Basic') {
    try {
      const decodedAuth = Buffer.from(authorize[1], 'base64').toString('utf-8');
      const splited = decodedAuth.split(':');
      const email = splited[0];
      const password = splited[1];
      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user || user.password !== sha1(password)) {
        console.log(email, password);
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const token = uuidv4();
        redisClient.set(`auth_${token}`, user._id, 24 * 60 * 60);
        res.set('X-Token', token);
        res.status(200).json({ token });
      }
    } catch (e) {
      console.log('=============>>>>>>>>errr<<<<<<<<<<<<<<', e);
    }
  }
}

async function getDisconnect(req, res) {
  const userToken = req.get('X-token');
  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (userId) {
      console.log(userId);
      redisClient.del(`auth_${userToken}`);
      res.status(204).send();
      return;
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = {
  getConnect,
  getDisconnect,
};
