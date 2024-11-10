import * as Path                from "path";
import * as FileSystem          from "fs";
import * as DotEnv              from "dotenv";
import * as Express             from "express";
import * as Cors                from "cors";
import * as DeviceDetector      from "device-detector-js";
import * as MySQL               from "mysql";
import { CityResponse, Reader } from "maxmind";
import { ServerRequest } from "./utilities/server_request";
import { ServerDatabase } from "./utilities/server_database";

export const ROOT_DIRECTORY = Path.resolve(__dirname, "..");
DotEnv.config({path: ROOT_DIRECTORY + "/.env"});
export const Server = {
    root_directory:  ROOT_DIRECTORY,
    server_instance: Express.default(),
    server_device:   new DeviceDetector.default(),
    server_geoip:    new Reader<CityResponse>(FileSystem.readFileSync(`${ROOT_DIRECTORY}/mmdb/GeoLite2-City.mmdb`)),
    server_database: MySQL.createConnection({
        host:     process.env.MYSQL_HOST,
        user:     process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: {
            ca: FileSystem.readFileSync(`${ROOT_DIRECTORY}/${process.env.MYSQL_SSL}`),
            rejectUnauthorized: false
        }
    })
}

// express initial setup
Server.server_instance.set("trust proxy", 1);
Server.server_instance.use(Express.default.json());
Server.server_instance.use(Express.default.urlencoded({extended: true}));
Server.server_instance.set("json spaces", "\t");
Server.server_instance.use(Cors.default());

Server.server_instance.get("/*", async (request, response) => {
    // send file
    response.sendFile(`${ROOT_DIRECTORY}/assets/pepe.jpg`);
    // extract information
    const request_identity = ServerRequest.get_identity(request);
    const request_uuid     = await ServerDatabase.record_create(request_identity);
    const test = ServerDatabase.record_get(request_uuid);
    console.log(request_identity);
    console.log(test);
});

Server.server_instance.use(async (request, response) => {
    // fallback endpoint
    response.redirect(301, process.env.BACKEND_ORIGIN as string);
});

// deploy on port 3000
Server.server_instance.listen(process.env.BACKEND_PORT);