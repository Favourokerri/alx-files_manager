import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const get = promisify(this.client.get).bind(this.client);
    return get(key);
  }

  async set(key, value, duration) {
    const set = promisify(this.client.set).bind(this.client);
    return set(key, value, 'Ex', duration);
  }

  async del(key) {
    const del = promisify(this.client.del).bind(this.client);
    return del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
