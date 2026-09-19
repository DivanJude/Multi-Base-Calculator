/**
 * Multi-Base Converter, Arithmetic & Complements Engine
 * Supports Binary (Base 2), Octal (Base 8), Decimal (Base 10), and Hexadecimal (Base 16)
 * Handles both integers and floating-point/fractional numbers, as well as negative signs.
 * Features:
 * - Real-time validation and multi-radix translation
 * - Diminished radix ((r-1)'s) and Radix (r's) complement generation across all 4 bases
 * - Step-by-step subtraction using both r's and (r-1)'s complements with end-carry logic
 * - Per-operand multi-operator arithmetic with Standard (PEMDAS) and Sequential evaluation modes
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BaseConverter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BASES = {
    2: { name: 'Binary', radix: 2, charSet: '01', subscript: '₂', prefix: '0b', rName: "2's", rMinus1Name: "1's" },
    8: { name: 'Octal', radix: 8, charSet: '01234567', subscript: '₈', prefix: '0o', rName: "8's", rMinus1Name: "7's" },
    10: { name: 'Decimal', radix: 10, charSet: '0123456789', subscript: '₁₀', prefix: '', rName: "10's", rMinus1Name: "9's" },
    16: { name: 'Hexadecimal', radix: 16, charSet: '0123456789ABCDEF', subscript: '₁₆', prefix: '0x', rName: "16's", rMinus1Name: "15's" }
  };

  /**
   * Validates an input string against a given base.
   * @param {string} value - The input number string
   * @param {number|string} base - Radix (2, 8, 10, 16)
   * @returns {{ isValid: boolean, error: string|null, sanitized: string }}
   */
  function validate(value, base) {
    const radix = parseInt(base, 10);
    const baseInfo = BASES[radix];

    if (!baseInfo) {
      return { isValid: false, error: `Unsupported base: ${base}`, sanitized: '' };
    }

    if (value === null || value === undefined) {
      return { isValid: false, error: 'Value is required.', sanitized: '' };
    }

    const trimmed = String(value).trim();
    if (trimmed === '') {
      return { isValid: false, error: 'Value cannot be empty.', sanitized: '' };
    }

    // Check for negative or positive sign
    let clean = trimmed;
    let sign = '';
    if (clean.startsWith('+') || clean.startsWith('-')) {
      sign = clean[0] === '-' ? '-' : '';
      clean = clean.slice(1).trim();
    }

    if (clean === '') {
      return { isValid: false, error: 'Number must contain digits after sign.', sanitized: '' };
    }

    if (clean === '.') {
      return { isValid: false, error: 'Invalid number: only a decimal point was provided.', sanitized: '' };
    }

    // Check multiple decimal points
    const dotCount = (clean.match(/\./g) || []).length;
    if (dotCount > 1) {
      return { isValid: false, error: 'Invalid number: cannot contain more than one radix point (.).', sanitized: '' };
    }

    const parts = clean.split('.');
    const integerPart = parts[0] || '0';
    const fracPart = parts[1] !== undefined ? parts[1] : null;

    // Check characters against allowed set
    const validCharSet = new Set(baseInfo.charSet.split('').concat(baseInfo.charSet.toLowerCase().split('')));

    for (let i = 0; i < integerPart.length; i++) {
      const char = integerPart[i];
      if (!validCharSet.has(char)) {
        return {
          isValid: false,
          error: `Invalid character '${char}' for ${baseInfo.name} (Base ${radix}). Allowed: [${baseInfo.charSet}]`,
          sanitized: ''
        };
      }
    }

    if (fracPart !== null) {
      if (fracPart.length === 0) {
        return { isValid: false, error: 'Radix point must be followed by at least one digit.', sanitized: '' };
      }
      for (let i = 0; i < fracPart.length; i++) {
        const char = fracPart[i];
        if (!validCharSet.has(char)) {
          return {
            isValid: false,
            error: `Invalid character '${char}' in fractional part for ${baseInfo.name} (Base ${radix}). Allowed: [${baseInfo.charSet}]`,
            sanitized: ''
          };
        }
      }
    }

    const sanitized = (sign === '-' ? '-' : '') + (clean.startsWith('.') ? '0' + clean : clean).toUpperCase();
    return { isValid: true, error: null, sanitized };
  }

  /**
   * Parses a number string of any supported base into an IEEE-754 decimal (Base 10) float.
   * @param {string} value 
   * @param {number|string} base 
   * @returns {number}
   */
  function toDecimal(value, base) {
    const valResult = validate(value, base);
    if (!valResult.isValid) {
      throw new Error(valResult.error);
    }

    const radix = parseInt(base, 10);
    const sanitized = valResult.sanitized;
    const isNegative = sanitized.startsWith('-');
    const clean = isNegative ? sanitized.slice(1) : sanitized;

    const [intPartStr, fracPartStr] = clean.split('.');

    // Parse integer part
    let intVal = 0;
    for (let i = 0; i < intPartStr.length; i++) {
      const digitChar = intPartStr[i];
      const digitVal = parseInt(digitChar, radix);
      intVal = intVal * radix + digitVal;
    }

    // Parse fractional part if present
    let fracVal = 0;
    if (fracPartStr && fracPartStr.length > 0) {
      for (let i = 0; i < fracPartStr.length; i++) {
        const digitChar = fracPartStr[i];
        const digitVal = parseInt(digitChar, radix);
        fracVal += digitVal / Math.pow(radix, i + 1);
      }
    }

    const total = intVal + fracVal;
    return isNegative ? -total : total;
  }

  /**
   * Converts a Base 10 decimal number to a specified target base string.
   * @param {number} decimalValue 
   * @param {number|string} targetBase 
   * @param {number} [maxFracDigits=8] 
   * @returns {string}
   */
  function fromDecimal(decimalValue, targetBase, maxFracDigits = 8) {
    const radix = parseInt(targetBase, 10);
    if (!BASES[radix]) {
      throw new Error(`Unsupported target base: ${targetBase}`);
    }

    if (isNaN(decimalValue)) return 'NaN';
    if (!isFinite(decimalValue)) return decimalValue > 0 ? 'Infinity' : '-Infinity';

    const isNegative = decimalValue < 0;
    const absVal = Math.abs(decimalValue);

    const intPart = Math.floor(absVal);
    let fracPart = absVal - intPart;

    // Convert integer part
    let intStr = intPart.toString(radix).toUpperCase();

    // Convert fractional part
    let fracStr = '';
    const epsilon = 1e-12;

    if (fracPart > epsilon && maxFracDigits > 0) {
      const fracDigits = [];
      let count = 0;

      while (fracPart > epsilon && count < maxFracDigits) {
        fracPart *= radix;
        const digit = Math.floor(fracPart + 1e-11);
        const char = digit.toString(radix).toUpperCase();
        fracDigits.push(char);
        fracPart -= digit;
        count++;
      }

      // Trim trailing zeroes in fractional string if any
      let joined = fracDigits.join('');
      while (joined.endsWith('0')) {
        joined = joined.slice(0, -1);
      }
      fracStr = joined;
    }

    const result = (isNegative ? '-' : '') + intStr + (fracStr ? '.' + fracStr : '');
    return result;
  }

  /**
   * Converts a value in fromBase to all supported bases.
   * @param {string} value 
   * @param {number|string} fromBase 
   * @returns {{ [radix: number]: { name: string, value: string, subscript: string, decimalVal: number } }}
   */
  function convertToAllBases(value, fromBase) {
    const valResult = validate(value, fromBase);
    if (!valResult.isValid) {
      throw new Error(valResult.error);
    }

    const decVal = toDecimal(value, fromBase);
    const results = {};

    [2, 8, 10, 16].forEach((radix) => {
      const formatted = fromDecimal(decVal, radix);
      results[radix] = {
        name: BASES[radix].name,
        radix,
        value: formatted,
        subscript: BASES[radix].subscript,
        subscripted: formatted + BASES[radix].subscript,
        decimalVal: decVal
      };
    });

    return results;
  }

  // =========================================================================
  // COMPLEMENTS ENGINE: (r-1)'s and r's Complements for All Number Systems
  // =========================================================================

  /**
   * Computes the (r - 1)'s complement (Diminished Radix Complement) of a number string in base r.
   * Formula: (r^n - 1) - N (subtract each digit from r - 1).
   * For fractions: subtract each fractional digit from r - 1 as well.
   * 
   * @param {string} value 
   * @param {number|string} base 
   * @param {number} [targetWidth] - Optional padding width for integer portion
   * @returns {string}
   */
  function getDiminishedRadixComplement(value, base, targetWidth) {
    const valResult = validate(value, base);
    if (!valResult.isValid) throw new Error(valResult.error);

    const radix = parseInt(base, 10);
    const clean = valResult.sanitized.startsWith('-') ? valResult.sanitized.slice(1) : valResult.sanitized;
    const [intPart, fracPart] = clean.split('.');

    const width = Math.max(intPart.length, targetWidth || intPart.length);
    const paddedInt = intPart.padStart(width, '0');
    const maxDigitVal = radix - 1;

    let compInt = '';
    for (let i = 0; i < paddedInt.length; i++) {
      const d = parseInt(paddedInt[i], radix);
      const compD = maxDigitVal - d;
      compInt += compD.toString(radix).toUpperCase();
    }

    if (fracPart !== undefined && fracPart.length > 0) {
      let compFrac = '';
      for (let i = 0; i < fracPart.length; i++) {
        const d = parseInt(fracPart[i], radix);
        const compD = maxDigitVal - d;
        compFrac += compD.toString(radix).toUpperCase();
      }
      return compInt + '.' + compFrac;
    }

    return compInt;
  }

  /**
   * Computes the r's complement (Radix Complement) of a number string in base r.
   * Formula: (r-1)'s complement + r^(-m) where m is the number of fractional digits.
   * For integers (m = 0): (r-1)'s complement + 1.
   * 
   * @param {string} value 
   * @param {number|string} base 
   * @param {number} [targetWidth]
   * @returns {string}
   */
  function getRadixComplement(value, base, targetWidth) {
    const valResult = validate(value, base);
    if (!valResult.isValid) throw new Error(valResult.error);

    const radix = parseInt(base, 10);
    const clean = valResult.sanitized.startsWith('-') ? valResult.sanitized.slice(1) : valResult.sanitized;
    const [intPart, fracPart] = clean.split('.');

    const rMinus1Comp = getDiminishedRadixComplement(clean, radix, targetWidth);

    // Add 1 to the least significant digit of the rMinus1Comp string
    if (fracPart !== undefined && fracPart.length > 0) {
      const [cInt, cFrac] = rMinus1Comp.split('.');
      const combined = cInt + cFrac;
      const added = addOneToDigits(combined, radix, cInt.length);
      return added.slice(0, cInt.length) + '.' + added.slice(cInt.length);
    } else {
      const added = addOneToDigits(rMinus1Comp, radix, rMinus1Comp.length);
      return added;
    }
  }

  /**
   * Helper to add 1 to a fixed-length string of digits in base r, discarding overflow beyond width if applicable.
   */
  function addOneToDigits(digitsStr, radix, expectedWidth) {
    let carry = 1;
    const resChars = [];

    for (let i = digitsStr.length - 1; i >= 0; i--) {
      const d = parseInt(digitsStr[i], radix);
      const sum = d + carry;
      if (sum >= radix) {
        resChars.unshift((sum - radix).toString(radix).toUpperCase());
        carry = 1;
      } else {
        resChars.unshift(sum.toString(radix).toUpperCase());
        carry = 0;
      }
    }

    // In modular radix arithmetic for r's complement with fixed length, overflow beyond width is discarded.
    let result = resChars.join('');
    if (carry === 1 && result.length < expectedWidth) {
      result = '1' + result;
    }
    return result;
  }

  /**
   * Returns comprehensive r's and (r-1)'s complements for a given number across all 4 number systems.
   * @param {string} value 
   * @param {number|string} fromBase 
   * @returns {{ [radix: number]: { name: string, radix: number, rName: string, rMinus1Name: string, value: string, rComp: string, rMinus1Comp: string } }}
   */
  function getAllComplements(value, fromBase) {
    const valResult = validate(value, fromBase);
    if (!valResult.isValid) throw new Error(valResult.error);

    const decVal = toDecimal(value, fromBase);
    const complements = {};

    [2, 8, 10, 16].forEach(radix => {
      const baseStr = fromDecimal(decVal, radix);
      const clean = baseStr.startsWith('-') ? baseStr.slice(1) : baseStr;
      
      // Compute complements for this base
      const rMinus1Comp = getDiminishedRadixComplement(clean, radix);
      const rComp = getRadixComplement(clean, radix);

      complements[radix] = {
        name: BASES[radix].name,
        radix,
        rName: BASES[radix].rName,
        rMinus1Name: BASES[radix].rMinus1Name,
        value: baseStr,
        rMinus1Comp,
        rComp,
        subscript: BASES[radix].subscript
      };
    });

    return complements;
  }

  // =========================================================================
  // COMPLEMENT SUBTRACTION: Step-by-Step Subtraction using r's & (r-1)'s Complements
  // =========================================================================

  /**
   * Performs subtraction of two numbers in base r using both r's and (r-1)'s complement methods.
   * Minuend M - Subtrahend N in base r.
   * 
   * @param {string} minuendVal 
   * @param {string} subtrahendVal 
   * @param {number|string} base 
   * @returns {{
   *   base: number,
   *   baseName: string,
   *   minuend: string,
   *   subtrahend: string,
   *   alignedWidth: number,
   *   paddedMinuend: string,
   *   paddedSubtrahend: string,
   *   rMethod: {
   *     name: string,
   *     subtrahendComp: string,
   *     rawSum: string,
   *     hasEndCarry: boolean,
   *     endCarry: string,
   *     resultMagnitude: string,
   *     isNegative: boolean,
   *     finalResult: string,
   *     explanation: string[],
   *   },
   *   rMinus1Method: {
   *     name: string,
   *     subtrahendComp: string,
   *     rawSum: string,
   *     hasEndCarry: boolean,
   *     endCarry: string,
   *     resultMagnitude: string,
   *     isNegative: boolean,
   *     finalResult: string,
   *     explanation: string[],
   *   },
   *   finalDecimal: number
   * }}
   */
  function subtractUsingComplements(minuendVal, subtrahendVal, base) {
    const radix = parseInt(base, 10);
    const baseInfo = BASES[radix] || BASES[10];

    const valM = validate(minuendVal, radix);
    const valN = validate(subtrahendVal, radix);
    if (!valM.isValid) throw new Error(`Minuend error: ${valM.error}`);
    if (!valN.isValid) throw new Error(`Subtrahend error: ${valN.error}`);

    const decM = toDecimal(minuendVal, radix);
    const decN = toDecimal(subtrahendVal, radix);
    const diffDecimal = decM - decN;

    // Work with magnitudes
    const cleanM = valM.sanitized.startsWith('-') ? valM.sanitized.slice(1) : valM.sanitized;
    const cleanN = valN.sanitized.startsWith('-') ? valN.sanitized.slice(1) : valN.sanitized;

    // Integer widths
    const [mInt] = cleanM.split('.');
    const [nInt] = cleanN.split('.');
    const alignedWidth = Math.max(mInt.length, nInt.length);

    const paddedM = cleanM.padStart(alignedWidth, '0');
    const paddedN = cleanN.padStart(alignedWidth, '0');

    // -------------------------------------------------------------
    // Method 1: r's Complement Subtraction (e.g. 2's, 8's, 10's, 16's)
    // -------------------------------------------------------------
    const rCompN = getRadixComplement(paddedN, radix, alignedWidth);
    
    // Add paddedM + rCompN in base r
    const addR = addInBase(paddedM, rCompN, radix, alignedWidth);
    const hasEndCarryR = addR.carryOut > 0;
    
    let resultMagR = '';
    let isNegR = false;
    const explanationR = [];

    explanationR.push(`Step 1: Align both operands to ${alignedWidth} digits: M = ${paddedM}, N = ${paddedN}`);
    explanationR.push(`Step 2: Find the ${baseInfo.rName} complement of subtrahend N: ${baseInfo.rName} comp of ${paddedN} = ${rCompN}`);
    explanationR.push(`Step 3: Add minuend M to the ${baseInfo.rName} complement of N: ${paddedM} + ${rCompN} = ${addR.sumWithCarry}`);

    if (hasEndCarryR) {
      isNegR = false;
      resultMagR = addR.sumWithoutCarry;
      explanationR.push(`Step 4: End-Carry occurs (carry = 1). This indicates M ≥ N (positive result).`);
      explanationR.push(`Step 5: Discard the End-Carry (remove the leftmost 1) to obtain the result: ${trimLeadingZeroes(resultMagR)}`);
    } else {
      isNegR = true;
      // Result is in r's complement form; take r's complement to get magnitude
      resultMagR = getRadixComplement(addR.sumWithoutCarry, radix, alignedWidth);
      explanationR.push(`Step 4: No End-Carry occurs (carry = 0). This indicates M < N (negative result).`);
      explanationR.push(`Step 5: The sum is in ${baseInfo.rName} complement form. Take the ${baseInfo.rName} complement of the sum: ${baseInfo.rName} comp of ${addR.sumWithoutCarry} = ${resultMagR}`);
      explanationR.push(`Step 6: Place a negative sign in front: -${trimLeadingZeroes(resultMagR)}`);
    }

    const trimmedMagR = trimLeadingZeroes(resultMagR) || '0';
    const finalResultR = (isNegR && trimmedMagR !== '0' ? '-' : '') + trimmedMagR;

    // -------------------------------------------------------------
    // Method 2: (r-1)'s Complement Subtraction (e.g. 1's, 7's, 9's, 15's)
    // -------------------------------------------------------------
    const rMinus1CompN = getDiminishedRadixComplement(paddedN, radix, alignedWidth);
    
    // Add paddedM + rMinus1CompN in base r
    const addRMinus1 = addInBase(paddedM, rMinus1CompN, radix, alignedWidth);
    const hasEndCarryRMinus1 = addRMinus1.carryOut > 0;
    
    let resultMagRMinus1 = '';
    let isNegRMinus1 = false;
    const explanationRMinus1 = [];

    explanationRMinus1.push(`Step 1: Align both operands to ${alignedWidth} digits: M = ${paddedM}, N = ${paddedN}`);
    explanationRMinus1.push(`Step 2: Find the ${baseInfo.rMinus1Name} complement of subtrahend N: ${baseInfo.rMinus1Name} comp of ${paddedN} = ${rMinus1CompN}`);
    explanationRMinus1.push(`Step 3: Add minuend M to the ${baseInfo.rMinus1Name} complement of N: ${paddedM} + ${rMinus1CompN} = ${addRMinus1.sumWithCarry}`);

    if (hasEndCarryRMinus1) {
      isNegRMinus1 = false;
      // Perform End-Around Carry: add 1 to the sum without carry
      const endAroundSum = addInBase(addRMinus1.sumWithoutCarry, '1', radix, alignedWidth);
      resultMagRMinus1 = endAroundSum.sumWithoutCarry;
      explanationRMinus1.push(`Step 4: End-Carry occurs (carry = 1). This indicates M ≥ N (positive result).`);
      explanationRMinus1.push(`Step 5: Perform End-Around Carry: remove the end carry and add 1 to the least significant digit: ${addRMinus1.sumWithoutCarry} + 1 = ${trimLeadingZeroes(resultMagRMinus1)}`);
    } else {
      isNegRMinus1 = true;
      // Result is in (r-1)'s complement form; take (r-1)'s complement to get magnitude
      resultMagRMinus1 = getDiminishedRadixComplement(addRMinus1.sumWithoutCarry, radix, alignedWidth);
      explanationRMinus1.push(`Step 4: No End-Carry occurs (carry = 0). This indicates M < N (negative result).`);
      explanationRMinus1.push(`Step 5: The sum is in ${baseInfo.rMinus1Name} complement form. Take the ${baseInfo.rMinus1Name} complement of the sum: ${baseInfo.rMinus1Name} comp of ${addRMinus1.sumWithoutCarry} = ${resultMagRMinus1}`);
      explanationRMinus1.push(`Step 6: Place a negative sign in front: -${trimLeadingZeroes(resultMagRMinus1)}`);
    }

    const trimmedMagRMinus1 = trimLeadingZeroes(resultMagRMinus1) || '0';
    const finalResultRMinus1 = (isNegRMinus1 && trimmedMagRMinus1 !== '0' ? '-' : '') + trimmedMagRMinus1;

    return {
      base: radix,
      baseName: baseInfo.name,
      subscript: baseInfo.subscript,
      minuend: cleanM,
      subtrahend: cleanN,
      alignedWidth,
      paddedMinuend: paddedM,
      paddedSubtrahend: paddedN,
      rMethod: {
        name: `${baseInfo.rName} Complement Method`,
        subtrahendComp: rCompN,
        rawSum: addR.sumWithCarry,
        hasEndCarry: hasEndCarryR,
        endCarry: hasEndCarryR ? '1' : '0',
        resultMagnitude: resultMagR,
        isNegative: isNegR,
        finalResult: finalResultR,
        explanation: explanationR
      },
      rMinus1Method: {
        name: `${baseInfo.rMinus1Name} Complement Method`,
        subtrahendComp: rMinus1CompN,
        rawSum: addRMinus1.sumWithCarry,
        hasEndCarry: hasEndCarryRMinus1,
        endCarry: hasEndCarryRMinus1 ? '1' : '0',
        resultMagnitude: resultMagRMinus1,
        isNegative: isNegRMinus1,
        finalResult: finalResultRMinus1,
        explanation: explanationRMinus1
      },
      finalDecimal: diffDecimal
    };
  }

  /**
   * Helper to add two numbers in base r with digit alignment.
   */
  function addInBase(aStr, bStr, radix, width) {
    const padA = aStr.padStart(width, '0');
    const padB = bStr.padStart(width, '0');
    let carry = 0;
    const res = [];

    for (let i = width - 1; i >= 0; i--) {
      const da = parseInt(padA[i], radix);
      const db = parseInt(padB[i], radix);
      const sum = da + db + carry;
      res.unshift((sum % radix).toString(radix).toUpperCase());
      carry = Math.floor(sum / radix);
    }

    const sumWithoutCarry = res.join('');
    const sumWithCarry = (carry > 0 ? carry.toString(radix).toUpperCase() : '') + sumWithoutCarry;

    return {
      carryOut: carry,
      sumWithoutCarry,
      sumWithCarry
    };
  }

  function trimLeadingZeroes(str) {
    if (!str) return '0';
    let trimmed = str.replace(/^0+/, '');
    return trimmed === '' ? '0' : trimmed;
  }

  // =========================================================================
  // ARITHMETIC CALCULATION: Per-Operand Multi-Operator Arithmetic
  // =========================================================================

  /**
   * Computes multi-base arithmetic across multiple operands with individual operators.
   * e.g., V1 op1 V2 op2 V3 ...
   * 
   * @param {Array<{ value: string, base: number|string }>} inputs 
   * @param {Array<string>|string} operators - Array of N-1 operators ('+', '-', '*', '/') or single operator string
   * @param {'standard'|'sequential'} [evalMode='standard'] - PEMDAS/BODMAS or Left-to-Right
   * @returns {{
   *   success: boolean,
   *   error?: string,
   *   expression?: string,
   *   decimalSteps?: string[],
   *   decimalResult?: number,
   *   results?: { [radix: number]: { name: string, radix: number, value: string, subscript: string, subscripted: string } },
   *   complementSubtractions?: Array<ReturnType<typeof subtractUsingComplements>>
   * }}
   */
  function calculateExpression(inputs, operators, evalMode = 'standard') {
    if (!Array.isArray(inputs) || inputs.length < 3) {
      return { success: false, error: 'A minimum of 3 inputs is required for calculation.' };
    }

    const numOpsNeeded = inputs.length - 1;
    let opsList = [];

    if (Array.isArray(operators)) {
      opsList = operators.slice(0, numOpsNeeded);
      while (opsList.length < numOpsNeeded) {
        opsList.push('+');
      }
    } else if (typeof operators === 'string') {
      opsList = Array(numOpsNeeded).fill(operators);
    } else {
      opsList = Array(numOpsNeeded).fill('+');
    }

    const validOps = new Set(['+', '-', '*', '/']);
    for (let op of opsList) {
      if (!validOps.has(op)) {
        return { success: false, error: `Invalid operator '${op}'. Allowed: +, -, *, /` };
      }
    }

    // Validate and convert all inputs to decimal
    const decimalValues = [];
    const formattedExpressionParts = [];

    const opSymbolMap = {
      '+': '+',
      '-': '−',
      '*': '×',
      '/': '÷'
    };

    for (let i = 0; i < inputs.length; i++) {
      const item = inputs[i];
      const valResult = validate(item.value, item.base);
      if (!valResult.isValid) {
        return {
          success: false,
          error: `Input #${i + 1} (${BASES[item.base]?.name || item.base}): ${valResult.error}`
        };
      }

      const decVal = toDecimal(item.value, item.base);
      decimalValues.push(decVal);

      const sub = BASES[item.base]?.subscript || `_{${item.base}}`;
      formattedExpressionParts.push(`${valResult.sanitized}${sub}`);
    }

    // Build the full human-readable expression
    let fullExpression = formattedExpressionParts[0];
    for (let i = 0; i < opsList.length; i++) {
      const opSym = opSymbolMap[opsList[i]] || opsList[i];
      fullExpression += ` ${opSym} ${formattedExpressionParts[i + 1]}`;
    }

    // Step-by-step resolution
    const decimalSteps = [];
    decimalSteps.push(`Initial Values in Decimal:`);
    for (let i = 0; i < decimalValues.length; i++) {
      decimalSteps.push(`  Input ${i + 1}: ${formattedExpressionParts[i]} = ${decimalValues[i]}₁₀`);
    }

    let finalDecimalResult = 0;

    if (evalMode === 'sequential') {
      // -------------------------------------------------------------
      // Sequential Left-to-Right Evaluation: (((V1 op1 V2) op2 V3)...)
      // -------------------------------------------------------------
      decimalSteps.push(`\nLeft-to-Right Sequential Evaluation:`);
      let currentVal = decimalValues[0];

      for (let i = 0; i < opsList.length; i++) {
        const op = opsList[i];
        const nextVal = decimalValues[i + 1];
        const prevVal = currentVal;

        switch (op) {
          case '+':
            currentVal = currentVal + nextVal;
            break;
          case '-':
            currentVal = currentVal - nextVal;
            break;
          case '*':
            currentVal = currentVal * nextVal;
            break;
          case '/':
            if (nextVal === 0) {
              return {
                success: false,
                error: `Division by zero encountered at Input #${i + 2} (${formattedExpressionParts[i + 1]} = 0₁₀). Division by zero is mathematically undefined.`,
                expression: fullExpression
              };
            }
            currentVal = currentVal / nextVal;
            break;
        }

        currentVal = parseFloat(currentVal.toPrecision(12));
        decimalSteps.push(`  Step ${i + 1}: ${prevVal} ${opSymbolMap[op]} ${nextVal} = ${currentVal}₁₀`);
      }

      finalDecimalResult = currentVal;
    } else {
      // -------------------------------------------------------------
      // Standard Precedence (BODMAS / PEMDAS): * and / before + and -
      // -------------------------------------------------------------
      decimalSteps.push(`\nStandard Precedence (PEMDAS/BODMAS) Evaluation:`);

      // Working copies of numbers and operators
      const numStack = [...decimalValues];
      const opStack = [...opsList];

      // Pass 1: Handle * and / from left to right
      let i = 0;
      let pass1Step = 1;
      while (i < opStack.length) {
        const op = opStack[i];
        if (op === '*' || op === '/') {
          const a = numStack[i];
          const b = numStack[i + 1];
          let res = 0;

          if (op === '*') {
            res = a * b;
          } else {
            if (b === 0) {
              return {
                success: false,
                error: `Division by zero encountered: ${a} ÷ ${b}. Division by zero is mathematically undefined.`,
                expression: fullExpression
              };
            }
            res = a / b;
          }

          res = parseFloat(res.toPrecision(12));
          decimalSteps.push(`  Pass 1 (×/÷) #${pass1Step++}: ${a} ${opSymbolMap[op]} ${b} = ${res}₁₀`);

          numStack.splice(i, 2, res);
          opStack.splice(i, 1);
        } else {
          i++;
        }
      }

      // Pass 2: Handle + and - from left to right
      let pass2Step = 1;
      let currentVal = numStack[0];
      for (let j = 0; j < opStack.length; j++) {
        const op = opStack[j];
        const nextVal = numStack[j + 1];
        const prevVal = currentVal;

        if (op === '+') {
          currentVal = currentVal + nextVal;
        } else if (op === '-') {
          currentVal = currentVal - nextVal;
        }

        currentVal = parseFloat(currentVal.toPrecision(12));
        decimalSteps.push(`  Pass 2 (+/−) #${pass2Step++}: ${prevVal} ${opSymbolMap[op]} ${nextVal} = ${currentVal}₁₀`);
      }

      finalDecimalResult = currentVal;
    }

    // Convert final result to all 4 bases
    const results = {};
    [2, 8, 10, 16].forEach((radix) => {
      const formatted = fromDecimal(finalDecimalResult, radix);
      results[radix] = {
        name: BASES[radix].name,
        radix,
        value: formatted,
        subscript: BASES[radix].subscript,
        subscripted: formatted + BASES[radix].subscript
      };
    });

    // Check for any subtraction operations in the expression to generate complement subtraction walkthroughs
    const complementSubtractions = [];
    for (let i = 0; i < opsList.length; i++) {
      if (opsList[i] === '-') {
        try {
          const itemM = inputs[i];
          const itemN = inputs[i + 1];
          // Provide complement subtraction in the base of input M (or decimal if mixed)
          const baseToUse = itemM.base;
          const subResult = subtractUsingComplements(itemM.value, itemN.value, baseToUse);
          complementSubtractions.push({
            pairIndex: i + 1,
            operatorStep: `${formattedExpressionParts[i]} − ${formattedExpressionParts[i + 1]}`,
            details: subResult
          });
        } catch (e) {
          // If mixed base prevents direct single-base representation without conversion, convert N to base M
          try {
            const itemM = inputs[i];
            const itemN = inputs[i + 1];
            const decN = toDecimal(itemN.value, itemN.base);
            const nInBaseM = fromDecimal(decN, itemM.base);
            const subResult = subtractUsingComplements(itemM.value, nInBaseM, itemM.base);
            complementSubtractions.push({
              pairIndex: i + 1,
              operatorStep: `${formattedExpressionParts[i]} − ${formattedExpressionParts[i + 1]} (in ${BASES[itemM.base].name})`,
              details: subResult
            });
          } catch (err) {
            // pass
          }
        }
      }
    }

    return {
      success: true,
      expression: fullExpression,
      decimalSteps,
      decimalResult: finalDecimalResult,
      results,
      complementSubtractions
    };
  }

  return {
    BASES,
    validate,
    toDecimal,
    fromDecimal,
    convertToAllBases,
    getDiminishedRadixComplement,
    getRadixComplement,
    getAllComplements,
    subtractUsingComplements,
    calculateExpression
  };
});
