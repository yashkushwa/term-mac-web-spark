
declare module 'xterm-addon-web-links' {
  import { ITerminalAddon } from 'xterm';

  export class WebLinksAddon implements ITerminalAddon {
    constructor(handler?: (event: MouseEvent, uri: string) => void, options?: { urlRegex?: RegExp; hover?: boolean });
    activate(terminal: any): void;
    dispose(): void;
  }
}
