export declare function shouldThrowError<T extends (...args: Array<any>) => boolean>(throwError: boolean | T | undefined, params: Parameters<T>): boolean;
