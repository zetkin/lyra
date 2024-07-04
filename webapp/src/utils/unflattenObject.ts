export interface UnflattenObject {
  [key: string]: string | UnflattenObject;
}

export function unflattenObject(obj: Record<string, string>): UnflattenObject {
  const result: UnflattenObject = {};
  for (const key in obj) {
    const keys = key.split('.');
    let current: UnflattenObject = result;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        current[keys[i]] = obj[key];
      } else {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]] as UnflattenObject;
      }
    }
  }
  return result;
}
