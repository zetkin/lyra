export function envVarNotFound(varName: string): never {
  throw new Error(`${varName} variable not defined`);
}
