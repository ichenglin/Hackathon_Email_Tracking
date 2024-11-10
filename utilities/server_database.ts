import { Server } from "..";
import { RequestIdentity, } from "./server_request";

export class ServerDatabase {
    public static async record_create(server_request: RequestIdentity): Promise<string> {
        // initialize entry
        const request_uuid = await ServerDatabase.database_uuid();
        const request_new  = server_request;
        request_new.request_uuid  = request_uuid
        request_new.request_count = 0;
        // add to database
        await ServerDatabase.database_update("tracking_image", "request_uuid", request_new);
        return request_uuid;
    }

    public static async record_update(server_request: RequestIdentity): Promise<void> {
        // initialize entry
        const record_new = (server_request as ServerDatabaseEntry);
    }

    public static async record_get(request_uuid: string): Promise<RequestIdentity | undefined> {
        const request_old = await ServerDatabase.database_query(`SELECT * FROM tracking_image WHERE request_uuid=${request_uuid};`);
        console.log(request_old);
        return undefined;
    }

    private static async database_query(query: string): Promise<any> {
        return await new Promise((resolve, reject) => Server.server_database.query(query, (error, results, fields) => resolve(results)));
    }

    private static async database_update(table: string, key: string, content: ServerDatabaseEntry): Promise<void> {
        const content_keys = Object.keys(content);
        let content_data: {key: string, value: string}[] = [];
        for (let key_index = 0; key_index < content_keys.length; key_index++) {
            const loop_content_key = content_keys[key_index];
            const loop_content     = content[loop_content_key];
            content_data.push({key: loop_content_key, value: Server.server_database.escape(loop_content)});
        }
        const query_insert_keys   = content_data.map(loop_content => loop_content.key  ).join(",");
        const query_insert_values = content_data.map(loop_content => loop_content.value).join(",");
        const query_update        = content_data.filter(loop_content => loop_content.key !== key).map(loop_content => `${loop_content.key} = ${loop_content.value}`).join(",");
        return await ServerDatabase.database_query(`INSERT INTO ${table} (${query_insert_keys}) VALUES (${query_insert_values}) ON DUPLICATE KEY UPDATE ${query_update};`);
    }

    private static async database_uuid(): Promise<string> {
        return (await ServerDatabase.database_query("SELECT uuid();"))[0]["uuid()"];
    }
}

type ServerDatabaseEntry = {[key: string]: any};