export function debug(msg: string) {
  // eslint-disable-next-line no-console
  console.debug(msg);
}

export function info(msg: string) {
  // eslint-disable-next-line no-console
  console.info(msg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function err(msg: any) {
  // eslint-disable-next-line no-console
  console.error(msg)
}

export function warn(msg: string) {
  // eslint-disable-next-line no-console
  console.warn(msg)
}
