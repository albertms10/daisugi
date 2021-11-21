import Redis from 'ioredis';

import { CacheStore } from '../withCache';
import { result } from '../result';
import { Code } from '../Code';

export class RedisCacheStore implements CacheStore {
  private redisClient: Redis.Redis;

  constructor() {
    // For production environments, you should use a properly configured Redis client.
    this.redisClient = new Redis({
      host: '',
    });
  }

  async get(key: string) {
    try {
      const response = await this.redisClient.get(key);

      if (response === null) {
        return result.fail({
          code: Code.NotFound,
          message: `RedisCacheStore.get ${Code.NotFound}`,
        });
      }

      return result.ok(JSON.parse(response));
    } catch (error) {
      return result.fail({
        code: Code.UnexpectedError,
        message: `RedisCacheStore.get ${
          (error as Error).message
        }`,
      });
    }
  }

  async set(key: string, value: object, maxAgeMs: number) {
    try {
      const response = await this.redisClient.set(
        key,
        JSON.stringify(value),
        'PX', // TTL in ms.
        maxAgeMs,
      );

      return result.ok(response);
    } catch (error) {
      return result.fail({
        code: Code.UnexpectedError,
        message: `RedisCacheStore.set ${
          (error as Error).message
        }`,
      });
    }
  }
}
