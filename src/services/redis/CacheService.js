/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies */
const redis = require('redis');

class CacheService {
  constructor() {
    // Mengoperasikan Redis server
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    });

    this._client.on('error', (error) => {
      console.error(error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond = 3600) {
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    const result = await this._client.get(key);

    if (result === null) throw new Error('Cache tidak ditemukan');

    return result;
  }

  /*
  Fungsi ini tidak menggunakan keyword async karena tidak ada await di dalamnya,
  Fungsi langsung mengembalikan nilai dari this._client.del, yang sudah berupa Promise.
  */
  delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;
