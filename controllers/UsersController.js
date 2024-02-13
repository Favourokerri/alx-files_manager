const dbClient = require('../utils/db');
const sha1 = require('sha1');


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
    const userData = await dbClient.db.collection('users').insertOne({ email, password: sha1(password) });

    res.status(201).json({ id: userData.ops[0]._id, email });
  }
}

module.exports = { postNew };
