/**
 * Proxy server URL
 */
export const PROXY_SERVER_URL = 'https://screeps.xilexio.eu.org'

export function apiURL(world: string) {
    return PROXY_SERVER_URL + (world === 'mmo' ? '' : '/' + world);
}