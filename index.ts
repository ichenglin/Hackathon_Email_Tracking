import * as Path                from "path";
import * as FileSystem          from "fs";
import * as DotEnv              from "dotenv";
import * as Express             from "express";
import * as Cors                from "cors";
import * as DeviceDetector      from "device-detector-js";
import { CityResponse, Reader } from "maxmind";
import { ServerRequest } from "./utilities/server_request";

export const ROOT_DIRECTORY = Path.resolve(__dirname, "..");
export const Server = {
    root_directory:  ROOT_DIRECTORY,
    server_instance: Express.default(),
    server_device:   new DeviceDetector.default(),
    server_geoip:    new Reader<CityResponse>(FileSystem.readFileSync(`${ROOT_DIRECTORY}/mmdb/GeoLite2-City.mmdb`))
}
DotEnv.config({path: ROOT_DIRECTORY + "/.env"});

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
    console.log(request_identity);
});

Server.server_instance.use(async (request, response) => {
    // fallback endpoint
    response.redirect(301, process.env.BACKEND_ORIGIN as string);
});

// deploy on port 3000
Server.server_instance.listen(process.env.BACKEND_PORT);