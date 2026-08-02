/**
 * Module resolve hooks for the node test runner.
 *
 * `npm test` runs the TypeScript sources directly via `--experimental-strip-types`,
 * which knows nothing about tsconfig `paths` or extensionless imports. This maps
 * the project's `@/*` alias onto `src/*` and retries bare relative specifiers
 * with a TypeScript extension, so gateway code can be imported under test
 * exactly as the bundler sees it. Resolution only — no transformation.
 */

const SRC = new URL('../src/', import.meta.url).href;
const EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

export async function resolve(specifier, context, next) {
  const mapped = specifier.startsWith('@/') ? SRC + specifier.slice(2) : specifier;

  try {
    return await next(mapped, context);
  } catch (error) {
    for (const extension of EXTENSIONS) {
      try {
        return await next(mapped + extension, context);
      } catch {
        // try the next candidate
      }
    }
    throw error;
  }
}
