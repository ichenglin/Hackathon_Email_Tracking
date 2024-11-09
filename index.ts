import * as Path                from "path";
import * as FileSystem          from "fs";
import * as DotEnv              from "dotenv";
import * as Express             from "express";
import * as Cors                from "cors";
import * as DeviceDetector      from "device-detector-js";
import { CityResponse, Reader } from "maxmind";

const ROOT_DIRECTORY = Path.resolve(__dirname, "..");
DotEnv.config({path: ROOT_DIRECTORY + "/.env"});

const geoip  = new Reader<CityResponse>(FileSystem.readFileSync(`${ROOT_DIRECTORY}/mmdb/GeoLite2-City.mmdb`));
const device = new DeviceDetector.default();
const server = Express.default();

// express initial setup
server.set("trust proxy", 1);
server.use(Express.default.json());
server.use(Express.default.urlencoded({extended: true}));
server.set("json spaces", "\t");
server.use(Cors.default());

server.get("/*", async (request, response) => {
    // send file
    response.sendFile(`${ROOT_DIRECTORY}/static/pepe.jpg`);
    // extract information
    const request_ip    = (request.get("x-forwarded-for") as string).split(", ")[0];
    const request_agent = (request.get("user-agent")      as string);
    const request_geo   = (geoip.get(request_ip)          as CityResponse);
    const request_device = (device.parse(request_agent));
    console.log(`IP: ${request_ip} Agent: ${request_agent}`);
    console.log(`Location: ${request_geo.city?.names.en}, ${request_geo.country?.names.en}`);
    console.log(request_device);
});

server.use(async (request, response) => {
    // fallback endpoint
    response.redirect(301, process.env.BACKEND_ORIGIN as string);
});

// deploy on port 3000
server.listen(process.env.BACKEND_PORT);