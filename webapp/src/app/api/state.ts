export const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound("REPO_PATH");
export const GITHUB_AUTH = process.env.GITHUB_AUTH ?? envVarNotFound("GITHUB_AUTH");
export const GITHUB_REPO = process.env.GITHUB_REPO ?? envVarNotFound("GITHUB_REPO");
export const GITHUB_OWNER = process.env.GITHUB_OWNER ?? envVarNotFound("GITHUB_OWNER");

function envVarNotFound(varName: string): never {
  throw new Error(`${varName} variable not defined`);
}
