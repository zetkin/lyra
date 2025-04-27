/**
 * Helper function to check if an error is a NodeJS error.
 * This is useful for checking if an error is an instance of NodeJS.ErrnoException
 * to be used for error handling in catch blocks.
 *
 * Usage example:
 * ```ts
 * try {
 * // some code that may throw an error because of a file operation
 * } catch (err) {
 *    if (isNodeError(err) && err.code === 'ENOENT') {
 *      // Handle file not found error
 *    }
 *    throw err;
 *  }
 * ```
 *
 * @param err - The error to check.
 */
export function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
