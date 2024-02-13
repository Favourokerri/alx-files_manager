const crypto = require('crypto');
const dbClient = require('../utils/db');

function hashPassword(password) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(password);
  return sha1.digest();
}

async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
  } else if (!password) {
    res.status(400).json({ error: 'Missing password' });
  }
  const user = await dbClient.db.collection('users').findOne({ email });
  if (user) {
    res.status(400).json({ error: 'Already exist' });
  } else {
    const userData = await dbClient.db.collection('users').insertOne({ email, password: hashPassword(password) });

    res.status(201).json({ id: userData.ops[0]._id, email });
  }
}

module.exports = { postNew };
