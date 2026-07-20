export const DEFAULT_PORT = 9090;

export function appUrl(port = DEFAULT_PORT) {
  return `http://127.0.0.1:${port}/download`;
}
