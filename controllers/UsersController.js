const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
  } else if (!password) {
    res.status(400).json({ error: 'Missing password' });
  } else {
    const user = await dbClient.db.collection('users').findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
    } else {
      const userData = await dbClient.db.collection('users').insertOne({ email, password: sha1(password) });

      res.status(201).json({ id: userData.ops[0]._id, email });
    }
  }
}

async function getMe(req, res) {
  const userToken = req.get('X-token');

  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (userId) {
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (user) {
        res.send({ id: user._id, email: user.email });
        return;
      }
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
}
module.exports = { postNew, getMe };
