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
  console.log('welll come', filePath);
  const base64Content = Buffer.from(data).toString();
  fs.writeFile(filePath, base64Content, 'base64', (err) => {
    if (err) throw err;
  });
  return filePath;
}

async function postUpload(req, res) {
  const userToken = req.get('X-token');

  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, type, data } = req.body;
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    } if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    } if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    let parentDir = '/';
    if (parentId !== 0) {
      const fileParent = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });

      if (!fileParent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (fileParent && fileParent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
      let p = fileParent.parentId;
      while (p !== 0) {
        // eslint-disable-next-line no-await-in-loop
        const temp = await dbClient.db.collection('files').findOne({ _id: ObjectId(p) });
        p = temp.parentId;
        parentDir = `/${temp._id}${parentDir}`;
      }
      console.log('parent=======', parentDir);
    }
    const defaultFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
    console.log('diffffffff', defaultFolder, process.env.FOLDER_PATH);
    const totalFolders = path.join(defaultFolder, parentDir);
    if (type === 'folder') {
      const newFile = await dbClient.db.collection('files').insertOne({
        name, type, parentId, isPublic, userId,
      });

      fs.mkdirSync(totalFolders, { recursive: true }, (err) => {
        if (err) throw err;
      });
      console.log('heeeyyyyyyyyyyyyyyyyyyyy');
      return res.status(201).json(newFile.ops[0]);
    }

    const information = {
      name, type, parentId, isPublic, userId,
    };
    information.localPath = storeFile(defaultFolder, uuidv4(), data);
    const newFile = await dbClient.db.collection('files').insertOne(information);
    const finalOutput = newFile.ops[0];
    finalOutput.id = finalOutput._id;
    delete finalOutput._id;
    return res.status(201).json(finalOutput);
  }
  return res.status(500).json({ error: 'something went wrong' });
}

// function getShow(req, res) {

// }
// function getIndex(req, res) {

// }
module.exports = {
  postUpload,
  // getShow,
  // getIndex
};
