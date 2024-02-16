// const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

function storeFile(directoryPath, file, data) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
      if (err) throw err;
    });
  }
  const filePath = path.join(directoryPath, file);

  const base64Content = Buffer.from(data).toString();
  fs.writeFile(filePath, base64Content, 'base64', (err) => {
    if (err) throw err;
  });
}

async function postUpload(req, res) {
  const userToken = req.get('X-token');

  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, type, data } = req.body;
    const parentId = req.body.parentId || '0';
    const isPublic = req.body.isPublic || false;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    } if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    } if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId !== '0') {
      const fileParent = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });

      if (!fileParent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (fileParent && fileParent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      const newFile = await dbClient.db.collection('files').insertOne({
        name, type, parentId, isPublic, userId,
      });
      return res.status(201).json(newFile.ops[0]);
    }
    const defaultFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
    storeFile(defaultFolder, uuidv4(), data);
    const information = {
      name, type, parentId, isPublic, userId,
    };
    if (parentId !== '0') {
      information.localPath = path.join(defaultFolder, parentId);
    }
    const newFile = await dbClient.db.collection('files').insertOne(information);
    return res.status(201).json(newFile.ops[0]);
  }
  return res.status(500).json({ error: 'something went wrong' });
}

module.exports = { postUpload };
