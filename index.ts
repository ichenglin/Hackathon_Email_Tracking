import * as Path                from "path";
import * as FileSystem          from "fs";
import * as DotEnv              from "dotenv";
import * as Express             from "express";
import * as Cors                from "cors";
import * as DeviceDetector      from "device-detector-js";
import * as MySQL               from "mysql";
import { CityResponse, Reader } from "maxmind";
import { ServerRequest, UserIdentity } from "./utilities/server_request";
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

Server.server_instance.use("/email_tracking/email/*", async (request, response, next) => {
    const server_response = await new Promise<{success: boolean, reason?: string}>(async (accept, reject) => {
        // verify token exist
        const authenticate_headers = request.get("Authorization");
        const authenticate_matcher = authenticate_headers?.match(/^Bearer (\w+)$/);
        const authenticate_token   = (((authenticate_matcher !== undefined) && (authenticate_matcher !== null)) ? authenticate_matcher[1] : undefined);
        if (authenticate_token === undefined) accept({success: false, reason: "Authorization Failed"});
        // verify token valid
        const authenticate_user = await ServerDatabase.user_get("user_token", (authenticate_token as string));
        if (authenticate_user === undefined) accept({success: false, reason: "Authorization Failed"});
        // assign user uuid
        response.locals.user = authenticate_user;
        accept({success: true});
    });
    if (server_response.success !== true) response.status(401).json(server_response);
    next();
})

Server.server_instance.post("/email_tracking/user/register", async (request, response) => {
    const server_response = await new Promise<{success: boolean, reason?: string}>(async (accept, reject) => {
        // verify parameters
        const login_username = request.body.username;
        const login_password = request.body.password;
        const login_token    = request.body.token;
        if      ((login_username === undefined) || (login_username.length <= 0) || (login_username.length > 16)) accept({success: false, reason: "Invalid Credentials"});
        else if ((login_password === undefined) || (login_password.length <= 0) || (login_password.length > 16)) accept({success: false, reason: "Invalid Credentials"});
        else if ((login_token    === undefined) || (login_token.length !== 500))                                 accept({success: false, reason: "Invalid Credentials"});
        // verify not exist
        const login_exist = await ServerDatabase.user_get("user_username", login_username);
        if (login_exist !== undefined) accept({success: false, reason: "User Already Exist"});
        // create new user
        await ServerDatabase.user_create({
            user_uuid:     "Unknown",
            user_username: login_username,
            user_password: login_password,
            user_token:    login_token
        });
        accept({success: true});
    });
    response.status(200).json(server_response);
});

Server.server_instance.post("/email_tracking/user/login", async (request, response) => {
    const server_response = await new Promise<{success: boolean, reason?: string}>(async (accept, reject) => {
        // verify parameters
        const login_username = request.body.username;
        const login_password = request.body.password;
        const login_token    = request.body.token;
        if      ((login_username === undefined) || (login_username.length <= 0) || (login_username.length > 16)) accept({success: false, reason: "Invalid Credentials"});
        else if ((login_password === undefined) || (login_password.length <= 0) || (login_password.length > 16)) accept({success: false, reason: "Invalid Credentials"});
        else if ((login_token    === undefined) || (login_token.length !== 500))                                 accept({success: false, reason: "Invalid Credentials"});
        // verify exist
        const login_exist = await ServerDatabase.user_get("user_username", login_username);
        if ((login_exist === undefined) || (login_exist.user_password !== login_password)) accept({success: false, reason: "Username or Password Incorrect"});
        // create new user
        (login_exist as UserIdentity).user_token = login_token;
        await ServerDatabase.user_update((login_exist as UserIdentity).user_uuid, (login_exist as UserIdentity));
        accept({success: true});
    });
    response.status(200).json(server_response);
});

Server.server_instance.get("/email_tracking/email/update", async (request, response) => {
    // send file
    response.sendFile(`${ROOT_DIRECTORY}/assets/pepe.jpg`);
    // extract information
    const request_uuid     = request.query.id;
    const request_identity = ServerRequest.get_identity(request);
    if ((typeof request_uuid) !== "string") return; 
    await ServerDatabase.record_update((request_uuid as string), request_identity);
});

Server.server_instance.get("/email_tracking/email/create", async (request, response) => {
    // extract information
    const request_owner    = (response.locals.user as UserIdentity).user_uuid;
    const request_identity = ServerRequest.get_identity(request);
    const request_saved    = await ServerDatabase.record_create(request_owner, request_identity);
    // send file
    response.status(200).send("Created! " + request_saved);
});

// deploy on port 3000
Server.server_instance.listen(process.env.BACKEND_PORT);