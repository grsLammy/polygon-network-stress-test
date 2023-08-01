import {createClient, RedisClientType} from 'redis';

const redisClient: RedisClientType = createClient();

export async function connectToRedis(): Promise<RedisClientType> {
  await redisClient.connect();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  return redisClient;
}
