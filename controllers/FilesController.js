// const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
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
    const parentId = req.body.parentId || '0';
    const isPublic = req.body.isPublic || false;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    } if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    } if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    let parentDir = '/';
    if (parentId !== '0') {
      const fileParent = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });

      if (!fileParent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (fileParent && fileParent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
      let p = fileParent.parentId;
      while (p !== 0 && p !== '0') {
        // eslint-disable-next-line no-await-in-loop
        const temp = await dbClient.db.collection('files').findOne({ _id: ObjectId(p) });
        p = temp.parentId;
        parentDir = `/${temp._id}${parentDir}`;
      }
    }
    const defaultFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
    const totalFolders = path.join(defaultFolder, parentDir);
    if (type === 'folder') {
      const newFile = await dbClient.db.collection('files').insertOne({
        name, type, parentId, isPublic, userId: ObjectId(userId),
      });

      fs.mkdirSync(totalFolders, { recursive: true }, (err) => {
        if (err) throw err;
      });
      const finalOutput = newFile.ops[0];
      finalOutput.id = finalOutput._id;
      delete finalOutput._id;
      return res.status(201).json(newFile.ops[0]);
    }

    const information = {
      name, type, parentId, isPublic, userId: ObjectId(userId),
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

async function getShow(req, res) {
  const userToken = req.get('X-token');

  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    const finalOutput = file;
    finalOutput.id = finalOutput._id;
    delete finalOutput._id;
    return res.json(finalOutput);
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

async function getIndex(req, res) {
  const userToken = req.get('X-token');

  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const page = req.query.page || 0;

    const skip = (page) * 20;
    const filter = { userId: ObjectId(userId), parentId: '0' };
    if (req.query.parentId) {
      filter.parentId = ObjectId(req.query.parentId);
    }

    const pipeline = [
      { $match: filter },
      { $skip: skip },
      { $limit: 20 },
    ];
    const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();
    const result = [];
    for (const f of files) {
      const finalOutput = f;
      finalOutput.id = finalOutput._id;
      delete finalOutput._id;
      result.push(finalOutput);
    }

    return res.json(result);
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

async function putPublish(req, res) {
  const userToken = req.get('X-token');
  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) }, { $set: { isPublic: true } });
    const file2 = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) });

    const finalOutput = file2;
    finalOutput.id = finalOutput._id;
    delete finalOutput._id;
    return res.json(finalOutput);
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

async function putUnpublish(req, res) {
  const userToken = req.get('X-token');
  if (userToken) {
    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) }, { $set: { isPublic: false } });
    const file2 = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id), userId: ObjectId(userId) });

    const finalOutput = file2;
    finalOutput.id = finalOutput._id;
    delete finalOutput._id;
    return res.json(finalOutput);
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

async function getFile(req, res) {
  const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(req.params.id) });
  console.log(file);
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (file.isPublic === false) {
    const userToken = req.get('X-token');
    if (userToken) {
      const userId = await redisClient.get(`auth_${userToken}`);
      if (!userId || userId !== `${file.userId}`) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

  }
  const mimeType = mime.lookup(file.localPath);

  fs.readFile(file.localPath, (err, data) => {
    if (err) {
        return res.status(404).json({ error: 'Not found' });
    }

    res.setHeader('Content-Type', mimeType);
    return res.send(data);
  });
  // return res.status(404).json({ error: 'Not found' });
}
module.exports = {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
  getFile,
};
