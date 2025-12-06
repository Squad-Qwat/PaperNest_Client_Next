export interface ProtectedBlockValidationResult {
  valid: boolean;
  error?: string;
}

const MATH_ENV_NAMES = new Set([
  'equation',
  'equation*',
  'align',
  'align*',
  'gather',
  'gather*',
  'multline',
  'multline*',
  'eqnarray',
  'eqnarray*',
]);

function decodeBlockType(rawType: string): string {
  return (rawType || '').trim().toLowerCase();
}

function hasBalancedBraces(text: string): boolean {
  let depth = 0;
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }

  return depth === 0;
}

function hasBalancedSquareBrackets(text: string): boolean {
  let depth = 0;
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }

  return depth === 0;
}

function validateEnvironmentPair(latex: string, expectedType: string): ProtectedBlockValidationResult {
  const beginMatch = latex.match(/\\begin\{([^}]+)\}/);
  const endMatches = [...latex.matchAll(/\\end\{([^}]+)\}/g)].map(match => match[1]);

  if (!beginMatch) {
    return { valid: false, error: 'Missing \\begin{...}.' };
  }

  if (!endMatches.length) {
    return { valid: false, error: 'Missing \\end{...}.' };
  }

  const beginEnv = beginMatch[1];
  const endEnv = endMatches[endMatches.length - 1];

  if (beginEnv !== endEnv) {
    return { valid: false, error: `Environment mismatch: begin {${beginEnv}} but end {${endEnv}}.` };
  }

  if (expectedType === 'equation') {
    if (!MATH_ENV_NAMES.has(beginEnv)) {
      return { valid: false, error: 'Math block must use a supported math environment.' };
    }
    return { valid: true };
  }

  if (expectedType && beginEnv !== expectedType) {
    return { valid: false, error: `Expected ${expectedType} block, found ${beginEnv}.` };
  }

  return { valid: true };
}

export function validateProtectedBlock(latex: string, blockType: string): ProtectedBlockValidationResult {
  const normalizedLatex = (latex || '').trim();
  const type = decodeBlockType(blockType);

  if (!normalizedLatex) {
    return { valid: false, error: 'Block cannot be empty.' };
  }

  if (!hasBalancedBraces(normalizedLatex)) {
    return { valid: false, error: 'Unbalanced curly braces.' };
  }

  if (!hasBalancedSquareBrackets(normalizedLatex)) {
    return { valid: false, error: 'Unbalanced square brackets.' };
  }

  if (type === 'twocolumn') {
    if (!/^\\twocolumn\b/.test(normalizedLatex)) {
      return { valid: false, error: 'twocolumn block must start with \\twocolumn.' };
    }
    return { valid: true };
  }

  if (['table', 'figure', 'thebibliography', 'abstract', 'equation'].includes(type)) {
    return validateEnvironmentPair(normalizedLatex, type);
  }

  if (/\\begin\{[^}]+\}/.test(normalizedLatex)) {
    return validateEnvironmentPair(normalizedLatex, '');
  }

  return { valid: true };
}
