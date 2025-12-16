declare module 'string-random' {
  function stringRandom(length?: number, options?: {
    letters?: boolean;
    numbers?: boolean;
    symbols?: boolean;
    exclude?: string;
    charset?: string;
  }): string;
  export = stringRandom;
}