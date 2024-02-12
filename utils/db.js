const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(url);
    this.connected = false;
    this.connect();
  }

  async connect() {
    await this.client.connect();
    this.db = await this.client.db(this.database);
    this.connected = true;
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const countUsers = await this.db.collection('users').find({}).count();
    return countUsers;
  }

  async nbFiles() {
    const countFiles = await this.db.collection('files').find({}).count();
    return countFiles;
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
