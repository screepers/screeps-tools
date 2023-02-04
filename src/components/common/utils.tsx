import {PROXY_SERVER_URL} from './constants';

export const screepsWorlds: {[key: string]: string} = {
    mmo: 'MMO',
    season: 'Season',
};

export function apiURL(world: string) {
    return PROXY_SERVER_URL + (world === 'mmo' ? '' : '/' + world);
}