import {createClient, RedisClientType} from 'redis';

const client: RedisClientType = createClient();

export async function redisClient(): Promise<RedisClientType> {
  await client.connect();
  client.on('error', (err) => console.log('Redis Client Error', err));
  return client;
}
