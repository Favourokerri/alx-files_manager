const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');



async function postUpload() {
    const userToken = req.get('X-token');

    if (userToken) {
      const userId = await redisClient.get(`auth_${userToken}`)
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      } else {
        const content = res.body;
        if (!content.name) {
            return res.status(400).json({ error: 'Missing name' });
        } else if (!content.type) {
            return res.status(400).json({ error: 'Missing type' });
        } else if (!content.data && content.type) {
            return res.status(400).json({ error: 'Missing data' });
        }
        if (!content.parentId) {
            return res.status(400).json({ error: 'Parent is not a folder' });
        } 
      }
    }
}

module.exports = { postUpload };
