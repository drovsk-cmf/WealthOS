import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

if (!global.TextEncoder) {
  // @ts-ignore node/jsdom compatibility
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  // @ts-ignore node/jsdom compatibility
  global.TextDecoder = TextDecoder;
}
