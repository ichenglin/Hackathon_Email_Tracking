import { Server } from "..";

export class ServerCache {
    public static async cache_get(cache_id: string): Promise<any | undefined> {
        cache_id = cache_id.toUpperCase();
        const cache_response = await Server.server_cache.get(cache_id);
        if (cache_response === null) return undefined;
        return (JSON.parse(cache_response) as ServerCacheData).cache_data;
    }

    public static async cache_set(cache_id: string, cache_data: any, cache_lifespan?: number): Promise<void> {
        cache_id = cache_id.toUpperCase();
        if (cache_data     === undefined) return;
        if (cache_lifespan === undefined) cache_lifespan = parseInt(process.env.REDIS_CACHE_LIFESPAN as string);
        await Server.server_cache.setEx(cache_id, cache_lifespan, JSON.stringify({
            cache_data:      cache_data,
            cache_birthdate: Date.now(),
            cache_lifespan:  cache_lifespan
        } as ServerCacheData));
    }
}

interface ServerCacheData {
    cache_data:      any,
    cache_birthdate: number,
    cache_lifespan:  number
}