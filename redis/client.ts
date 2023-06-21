import { createClient } from 'redis';


let client: ReturnType<typeof createClient> | undefined = undefined

const getRedisClient = async () => {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_CONNECTION_STRING
          });
        await client.connect()
        console.log('Redis client connected')
    }
    return client
}

export default getRedisClient