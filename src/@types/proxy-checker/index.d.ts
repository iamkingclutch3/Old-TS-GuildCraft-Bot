declare module 'proxy-checker' {
  export function checkProxy(host: string, port: string, options: {
    url: string,
    regex?: RegExp | string
  }, callback: (host: string, port: string, ok: boolean, statusCode: number, err: string) => void): void;
  export function checkProxiesFromFile(file: File, options: {
    url: string,
    regex?: RegExp | string
  }, callback: (host: string, port: string, ok: boolean, statusCode: number, err: string) => void): void;
}