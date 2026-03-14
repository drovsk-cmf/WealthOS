import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { webcrypto } from "crypto";

if (!global.TextEncoder) {
  // @ts-ignore node/jsdom compatibility
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  // @ts-ignore node/jsdom compatibility
  global.TextDecoder = TextDecoder;
}

if (!global.crypto) {
  // @ts-ignore node/jsdom compatibility
  global.crypto = webcrypto as Crypto;
}
