declare module 'screeps-api' {
    type ScreepsAPIOptions = {
        token: string;
        protocol: 'http' | 'https';
        hostname: string;
        port: number;
        path: string;
    };
    
    class ScreepsAPI {
        constructor(opts: ScreepsAPIOptions);
        
        socket: WebSocket & {
            connect(): Promise<any>;
            subscribe(channel: string): void;
            on(event: string, handler: (event: Event) => void): void;
            disconnect(): void;
        };
    }
}