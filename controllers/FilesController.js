// const sha1 = require('sha1');
// const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function postUpload(req, res) {
  const userToken = req.get('X-token');

  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      const content = res.body;
      if (!content.name) {
        res.status(400).json({ error: 'Missing name' });
      } if (!content.type) {
        res.status(400).json({ error: 'Missing type' });
      } if (!content.data && content.type) {
        res.status(400).json({ error: 'Missing data' });
      }
      if (!content.parentId) {
        res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
  }
}

module.exports = { postUpload };
