import * as Express     from "express";
import { CityResponse } from "maxmind";
import { Server }       from "..";

export class ServerRequest {
    public static get_identity(server_request: Express.Request): RequestIdentity {
        const request_ip     = (server_request.get("x-forwarded-for") as string).split(", ")[0];
        const request_agent  = (server_request.get("user-agent")      as string);
        const request_geo    = (Server.server_geoip.get(request_ip)   as CityResponse);
        const request_device = (Server.server_device.parse(request_agent));
        return {
            request_uuid:     "Uninitialized",
            request_owner:    "Uninitialized",
            request_group:    0,
            request_ip:       request_ip,
            request_date:     (Date.now() / 1E3),
            request_count:    0,
            location_country: ServerRequest.get_defined(request_geo.country?.names.en),
            location_city:    ServerRequest.get_defined(request_geo.city?.names.en),
            browser_name:     ServerRequest.get_defined(request_device.client?.name),
            browser_version:  ServerRequest.get_defined(request_device.client?.version),
            system_name:      ServerRequest.get_defined(request_device.os?.name),
            system_version:   ServerRequest.get_defined(request_device.os?.version),
            system_platform:  ServerRequest.get_defined(request_device.os?.platform),
            device_type:      ServerRequest.get_defined(request_device.device?.type),
            device_bot:       (request_device.bot !== null)
        };
    }

    private static get_defined(value_data: (string | undefined)): (string | undefined) {
        return ((value_data !== "") ? value_data : undefined);
    }
}

export interface UserIdentity {
    user_uuid:     string,
    user_username: string,
    user_password: string,
    user_token:    string
}

export interface RequestIdentity {
    // request
    request_uuid:      string,
    request_owner:     string,
    request_group:     number,
    request_ip:        string,
    request_date:      number,
    request_count:     number,
    // location
    location_country?: string,
    location_city?:    string,
    // browser
    browser_name?:     string,
    browser_version?:  string,
    // system
    system_name?:      string,
    system_version?:   string,
    system_platform?:  string,
    // device
    device_type?:      string,
    device_bot:        boolean
}