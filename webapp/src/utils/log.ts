export function debug(msg: string) {
  // eslint-disable-next-line no-console
  console.debug('[DEBUG] ' + msg);
}

export function info(msg: string) {
  // eslint-disable-next-line no-console
  console.info('[INFO] ' + msg);
}

export function warn(msg: string) {
  // eslint-disable-next-line no-console
  console.warn('[WARN] ' + msg);
}

export function error(msg: string) {
  // eslint-disable-next-line no-console
  console.error('[ERROR] ' + msg);
}

export function toHex(value: string): string {
  return [...value].map((c) => c.charCodeAt(0).toString(16)).join(' ');
}
