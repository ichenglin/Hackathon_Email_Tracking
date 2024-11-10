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
            request_ip:   request_ip,
            request_date: Date.now(),
            request_location: {
                location_country: ServerRequest.get_defined(request_geo.country?.names.en),
                location_city:    ServerRequest.get_defined(request_geo.city?.names.en)
            },
            request_browser: {
                browser_name:    ServerRequest.get_defined(request_device.client?.name),
                browser_version: ServerRequest.get_defined(request_device.client?.version)
            },
            request_system: {
                system_name:     ServerRequest.get_defined(request_device.os?.name),
                system_version:  ServerRequest.get_defined(request_device.os?.version),
                system_platform: ServerRequest.get_defined(request_device.os?.platform)
            },
            request_device: {
                device_type: ServerRequest.get_defined(request_device.device?.type),
                device_bot:  (request_device.bot !== null)
            }
        };
    }

    private static get_defined(value_data: (string | undefined)): (string | undefined) {
        return ((value_data !== "") ? value_data : undefined);
    }
}

export interface RequestIdentity {
    request_ip:       string,
    request_date:     number,
    request_location: RequestLocation,
    request_browser:  RequestBrowser,
    request_system:   RequestSystem,
    request_device:   RequestDevice
}

export interface RequestLocation {
    location_country?: string,
    location_city?:    string
}

export interface RequestBrowser {
    browser_name?:    string,
    browser_version?: string
}

export interface RequestSystem {
    system_name?:     string,
    system_version?:  string,
    system_platform?: string
}

export interface RequestDevice {
    device_type?: string,
    device_bot:  boolean
}