// Minimal type declarations for lamejs used in demo-voice-orb
// Extend if more APIs are required.

declare module 'lamejs' {
  class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(buffer: Int16Array): Uint8Array;
    flush(): Uint8Array;
  }
  export { Mp3Encoder };
  // Default export pattern support
  const _default: { Mp3Encoder: typeof Mp3Encoder };
  export default _default;
}
