import { Server } from "..";
import { RequestIdentity, UserIdentity, } from "./server_request";

export class ServerDatabase {
    public static async user_create(user_request: UserIdentity): Promise<string> {
        const request_uuid    = await ServerDatabase.database_uuid()
        const request_new     = user_request;
        request_new.user_uuid = request_uuid;
        // add to database
        await ServerDatabase.database_update("tracking_user", "user_uuid", request_new);
        return request_uuid;
    }

    public static async user_update(user_uuid: string, user_request: UserIdentity): Promise<void> {
        // verify database entry
        const record_old = await ServerDatabase.user_get("user_uuid", user_uuid);
        if (record_old === undefined) return;
        // update entry
        const record_new     = user_request;
        record_new.user_uuid = user_uuid;
        await ServerDatabase.database_update("tracking_user", "user_uuid", record_new);
    }

    public static async user_get(user_field: string, user_value: string): Promise<UserIdentity | undefined> {
        const user_candidate = await ServerDatabase.database_query(`SELECT * FROM tracking_user WHERE ${user_field}=${Server.server_database.escape(user_value)};`);
        if (user_candidate.length <= 0) return undefined;
        return user_candidate[0];
    }

    public static async user_records(user_uuid: string): Promise<RequestIdentity[]> {
        const user_records = await ServerDatabase.database_query(`SELECT * FROM tracking_image WHERE request_owner=${Server.server_database.escape(user_uuid)};`);
        if ((user_records === undefined) || (user_records.length <= 0)) return [];
        return user_records;
    }

    public static async record_create(owner_uuid: string, record_group: number, server_request: RequestIdentity): Promise<string> {
        // initialize entry
        const request_uuid        = await ServerDatabase.database_uuid();
        const request_new         = server_request;
        request_new.request_uuid  = request_uuid;
        request_new.request_owner = owner_uuid;
        request_new.request_group = record_group;
        request_new.request_count = 0;
        // add to database
        await ServerDatabase.database_update("tracking_image", "request_uuid", request_new);
        return request_uuid;
    }

    public static async record_update(request_uuid: string, server_request: RequestIdentity): Promise<void> {
        // verify database entry
        const record_old = await ServerDatabase.record_get(request_uuid);
        if (record_old === undefined) return;
        // update entry
        const record_new = server_request;
        record_new.request_uuid  = request_uuid;
        record_new.request_owner = record_old.request_owner;
        record_new.request_count = (record_old.request_count + 1);
        await ServerDatabase.database_update("tracking_image", "request_uuid", record_new);
    }

    public static async record_get(request_uuid: string): Promise<RequestIdentity | undefined> {
        const record_candidate = await ServerDatabase.database_query(`SELECT * FROM tracking_image WHERE request_uuid=${Server.server_database.escape(request_uuid)};`);
        if (record_candidate.length <= 0) return undefined;
        return record_candidate[0];
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