// Browser-native fetch shim for node-fetch consumers (lucid-cardano)
export default globalThis.fetch;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
