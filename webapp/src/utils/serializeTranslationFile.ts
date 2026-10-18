import { stringify } from 'yaml';

import { UnflattenObject } from './unflattenObject';

/**
 * Serialize translation data to a string, in the format implied by filePath's extension.
 */
export default function serializeTranslationFile(
  data: UnflattenObject,
  filePath: string,
): string {
  if (filePath.endsWith('.json')) {
    return JSON.stringify(data, null, 2) + '\n';
  }

  return stringify(data, {
    doubleQuotedAsJSON: true,
    singleQuote: true,
  });
}
