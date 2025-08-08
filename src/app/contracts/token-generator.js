/**
 * Token Contract Generator
 * Generates customized MAS SATS token contracts from templates
 */

import fs from 'fs';
import path from 'path';

/**
 * Generate a customized token contract from template
 * @param {Object} config - Token configuration
 * @param {string} config.name - Token name
 * @param {string} config.symbol - Token symbol
 * @param {string} config.owner - Contract owner address
 * @param {number} config.decimals - Token decimals (default: 8)
 * @param {number} config.totalSupply - Total token supply (default: 21000000)
 * @returns {string} - Generated contract code
 */
export function generateTokenContract(config) {
  const {
    name,
    symbol,
    owner,
    decimals = 8,
    totalSupply = 21000000
  } = config;

  // Validate inputs
  if (!name || !symbol || !owner) {
    throw new Error('Token name, symbol, and owner are required');
  }

  if (symbol.length > 10) {
    throw new Error('Token symbol must be 10 characters or less');
  }

  if (name.length > 32) {
    throw new Error('Token name must be 32 characters or less');
  }

  // Read the template file
  const templatePath = path.join(process.cwd(), 'src/app/contracts/token-template.clarity');
  
  try {
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace template variables with actual values
    template = template.replace(/ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4/g, owner);
    template = template.replace(/"Sample Token"/g, `"${name}"`);
    template = template.replace(/"SAMPLE"/g, `"${symbol}"`);
    template = template.replace(/sample-token/g, `${symbol.toLowerCase()}-token`);
    template = template.replace(/u8/g, `u${decimals}`);
    template = template.replace(/u2100000000000000/g, `u${totalSupply * Math.pow(10, decimals)}`);
    
    return template;
  } catch (error) {
    console.error('Error reading template file:', error);
    throw new Error('Failed to read contract template');
  }
}

/**
 * Generate a simple test contract for development
 * @param {Object} config - Token configuration
 * @returns {string} - Simple test contract
 */
export function generateSimpleTestContract(config) {
  const { name, symbol, owner } = config;
  
  return `(define-constant contract-owner '${owner})

(define-constant token-name "${name}")
(define-constant token-symbol "${symbol}")

(define-data-var token-name-var (string-ascii 32) token-name)
(define-data-var token-symbol-var (string-ascii 10) token-symbol)

(define-public (get-name)
  (ok (var-get token-name-var))
)

(define-public (get-symbol)
  (ok (var-get token-symbol-var))
)

(define-public (say-hi)
  (ok "Hello from ${name} token!")
)

(define-public (get-owner)
  (ok contract-owner)
)`;
}

/**
 * Get available contract templates
 * @returns {Array} - List of available templates
 */
export function getAvailableTemplates() {
  return [
    {
      id: 'full-token',
      name: 'Full MAS SATS Token',
      description: 'Complete token with transfer, mint, burn, and approval functionality',
      file: 'token-template.clarity'
    },
    {
      id: 'simple-test',
      name: 'Simple Test Token',
      description: 'Basic token for testing and development',
      generator: 'generateSimpleTestContract'
    }
  ];
}

/**
 * Validate token configuration
 * @param {Object} config - Token configuration
 * @returns {Object} - Validation result
 */
export function validateTokenConfig(config) {
  const errors = [];
  
  if (!config.name || config.name.trim() === '') {
    errors.push('Token name is required');
  } else if (config.name.length > 32) {
    errors.push('Token name must be 32 characters or less');
  }
  
  if (!config.symbol || config.symbol.trim() === '') {
    errors.push('Token symbol is required');
  } else if (config.symbol.length > 10) {
    errors.push('Token symbol must be 10 characters or less');
  } else if (!/^[A-Z0-9]+$/.test(config.symbol)) {
    errors.push('Token symbol must contain only uppercase letters and numbers');
  }
  
  if (!config.owner || config.owner.trim() === '') {
    errors.push('Contract owner address is required');
  } else if (!config.owner.startsWith('ST')) {
    errors.push('Contract owner must be a valid Stacks address starting with ST');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
