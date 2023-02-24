/**
 * Proxy server URL.
 * It should be replaced with another one if it goes down.
 */
export const PROXY_SERVER_URL = 'https://screeps.xilexio.eu.org'

export function apiURL(world: string) {
    return PROXY_SERVER_URL + (world === 'mmo' ? '' : '/' + world);
}