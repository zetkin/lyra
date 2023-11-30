export function envVarNotFound(varName: string): never {
  throw new Error(`${varName} variable not defined`);
}

export function logDebug(msg: string) {
  // eslint-disable-next-line no-console
  console.debug(msg);
}

export function logInfo(msg: string) {
  // eslint-disable-next-line no-console
  console.info(msg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logError(msg: any) {
  // eslint-disable-next-line no-console
  console.error(msg)
}

export function logWarn(msg: string) {
  // eslint-disable-next-line no-console
  console.warn(msg)
}
