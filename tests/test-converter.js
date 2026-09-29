const assert = require('assert');
const BaseConverter = require('../js/converter.js');

console.log('--- Running Extended BaseConverter Tests ---');

// 1. Validation Tests
console.log('1. Testing Validation...');
assert.strictEqual(BaseConverter.validate('10110', 2).isValid, true);
assert.strictEqual(BaseConverter.validate('102', 2).isValid, false);
assert.strictEqual(BaseConverter.validate('7654', 8).isValid, true);
assert.strictEqual(BaseConverter.validate('789', 8).isValid, false);
assert.strictEqual(BaseConverter.validate('12390', 10).isValid, true);
assert.strictEqual(BaseConverter.validate('123A', 10).isValid, false);
assert.strictEqual(BaseConverter.validate('1A3F', 16).isValid, true);
assert.strictEqual(BaseConverter.validate('1A3G', 16).isValid, false);

// 2. Conversion Tests
console.log('2. Testing toDecimal & fromDecimal...');
assert.strictEqual(BaseConverter.toDecimal('1011', 2), 11);
assert.strictEqual(BaseConverter.toDecimal('1F', 16), 31);
assert.strictEqual(BaseConverter.toDecimal('12', 8), 10);
assert.strictEqual(BaseConverter.toDecimal('-10', 10), -10);
assert.strictEqual(BaseConverter.toDecimal('10.1', 2), 2.5);

assert.strictEqual(BaseConverter.fromDecimal(11, 2), '1011');
assert.strictEqual(BaseConverter.fromDecimal(31, 16), '1F');
assert.strictEqual(BaseConverter.fromDecimal(10, 8), '12');
assert.strictEqual(BaseConverter.fromDecimal(2.5, 2), '10.1');

// 3. Complements Tests
console.log('3. Testing (r-1)\'s and r\'s Complements...');

// Binary: 1's and 2's complement
// 1010 -> 1's = 0101, 2's = 0110
assert.strictEqual(BaseConverter.getDiminishedRadixComplement('1010', 2), '0101');
assert.strictEqual(BaseConverter.getRadixComplement('1010', 2), '0110');

// Octal: 7's and 8's complement
// 725 -> 7's = 052, 8's = 053
assert.strictEqual(BaseConverter.getDiminishedRadixComplement('725', 8), '052');
assert.strictEqual(BaseConverter.getRadixComplement('725', 8), '053');

// Decimal: 9's and 10's complement
// 450 -> 9's = 549, 10's = 550
assert.strictEqual(BaseConverter.getDiminishedRadixComplement('450', 10), '549');
assert.strictEqual(BaseConverter.getRadixComplement('450', 10), '550');

// Hexadecimal: 15's and 16's complement
// 2AF -> 15's = D50, 16's = D51
assert.strictEqual(BaseConverter.getDiminishedRadixComplement('2AF', 16), 'D50');
assert.strictEqual(BaseConverter.getRadixComplement('2AF', 16), 'D51');

// Test getAllComplements
const allComps = BaseConverter.getAllComplements('10', 10);
assert.strictEqual(allComps[10].rMinus1Comp, '89');
assert.strictEqual(allComps[10].rComp, '90');

// 4. Complement Subtraction Tests
console.log('4. Testing Subtraction using Complements...');

// Case A: M >= N in Binary (1101 - 1010 = 13 - 10 = 3)
const subBinPos = BaseConverter.subtractUsingComplements('1101', '1010', 2);
assert.strictEqual(subBinPos.rMethod.hasEndCarry, true);
assert.strictEqual(subBinPos.rMethod.finalResult, '11'); // 3 in binary
assert.strictEqual(subBinPos.rMinus1Method.hasEndCarry, true);
assert.strictEqual(subBinPos.rMinus1Method.finalResult, '11');

// Case B: M < N in Binary (1010 - 1101 = 10 - 13 = -3)
const subBinNeg = BaseConverter.subtractUsingComplements('1010', '1101', 2);
assert.strictEqual(subBinNeg.rMethod.hasEndCarry, false);
assert.strictEqual(subBinNeg.rMethod.finalResult, '-11');
assert.strictEqual(subBinNeg.rMinus1Method.hasEndCarry, false);
assert.strictEqual(subBinNeg.rMinus1Method.finalResult, '-11');

// Case C: M >= N in Decimal (75 - 25 = 50)
const subDecPos = BaseConverter.subtractUsingComplements('75', '25', 10);
assert.strictEqual(subDecPos.rMethod.hasEndCarry, true);
assert.strictEqual(subDecPos.rMethod.finalResult, '50');
assert.strictEqual(subDecPos.rMinus1Method.hasEndCarry, true);
assert.strictEqual(subDecPos.rMinus1Method.finalResult, '50');

// Case D: M < N in Decimal (25 - 75 = -50)
const subDecNeg = BaseConverter.subtractUsingComplements('25', '75', 10);
assert.strictEqual(subDecNeg.rMethod.hasEndCarry, false);
assert.strictEqual(subDecNeg.rMethod.finalResult, '-50');
assert.strictEqual(subDecNeg.rMinus1Method.hasEndCarry, false);
assert.strictEqual(subDecNeg.rMinus1Method.finalResult, '-50');

// Case E: Hexadecimal subtraction (3F - 1A = 63 - 26 = 37 = 25_16)
const subHexPos = BaseConverter.subtractUsingComplements('3F', '1A', 16);
assert.strictEqual(subHexPos.rMethod.hasEndCarry, true);
assert.strictEqual(subHexPos.rMethod.finalResult, '25');
assert.strictEqual(subHexPos.rMinus1Method.hasEndCarry, true);
assert.strictEqual(subHexPos.rMinus1Method.finalResult, '25');

// 5. Per-Operand Multi-Operator Calculation Tests
console.log('5. Testing Per-Operand Multi-Operator Expressions...');

// Test user's exact example: 1 + 1 - 1 * 1 / 1 = 1
const userExampleInputs = [
  { value: '1', base: 10 },
  { value: '1', base: 10 },
  { value: '1', base: 10 },
  { value: '1', base: 10 },
  { value: '1', base: 10 }
];
const userExampleOps = ['+', '-', '*', '/'];

// In standard precedence: 1 + 1 - ((1 * 1) / 1) = 2 - 1 = 1
const resStandard = BaseConverter.calculateExpression(userExampleInputs, userExampleOps, 'standard');
assert.strictEqual(resStandard.success, true);
assert.strictEqual(resStandard.decimalResult, 1);
assert.strictEqual(resStandard.results[10].value, '1');
assert.strictEqual(resStandard.results[2].value, '1');
console.log('User example Standard evaluation:', resStandard.expression, '=', resStandard.decimalResult);

// In sequential left-to-right: (((1 + 1) - 1) * 1) / 1 = 1
const resSequential = BaseConverter.calculateExpression(userExampleInputs, userExampleOps, 'sequential');
assert.strictEqual(resSequential.success, true);
assert.strictEqual(resSequential.decimalResult, 1);

// Test standard precedence vs sequential when different: 2 + 3 * 4
// Standard: 2 + (3 * 4) = 14
// Sequential: (2 + 3) * 4 = 20
const mixedPrecedenceInputs = [
  { value: '2', base: 10 },
  { value: '3', base: 10 },
  { value: '4', base: 10 }
];
const mixedOps = ['+', '*'];
const testStd = BaseConverter.calculateExpression(mixedPrecedenceInputs, mixedOps, 'standard');
assert.strictEqual(testStd.decimalResult, 14);

const testSeq = BaseConverter.calculateExpression(mixedPrecedenceInputs, mixedOps, 'sequential');
assert.strictEqual(testSeq.decimalResult, 20);

// Test mixed bases with per-operand operators:
// 1011 (base 2 = 11) + 1F (base 16 = 31) - 12 (base 8 = 10) * 2 (base 10 = 2)
// Standard: 11 + 31 - (10 * 2) = 42 - 20 = 22
const mixedBaseInputs = [
  { value: '1011', base: 2 },
  { value: '1F', base: 16 },
  { value: '12', base: 8 },
  { value: '2', base: 10 }
];
const mixedBaseOps = ['+', '-', '*'];
const mixedBaseCalc = BaseConverter.calculateExpression(mixedBaseInputs, mixedBaseOps, 'standard');
assert.strictEqual(mixedBaseCalc.success, true);
assert.strictEqual(mixedBaseCalc.decimalResult, 22);
assert.strictEqual(mixedBaseCalc.results[2].value, '10110');
assert.strictEqual(mixedBaseCalc.results[8].value, '26');
assert.strictEqual(mixedBaseCalc.results[16].value, '16');

// Verify that complement subtraction was recorded for the '-' operator
assert.ok(mixedBaseCalc.complementSubtractions.length > 0);
console.log('Complement subtraction step recorded:', mixedBaseCalc.complementSubtractions[0].operatorStep);

// Test backward compatibility when single operator string is passed
const singleOpCalc = BaseConverter.calculateExpression([
  { value: '10', base: 10 },
  { value: '20', base: 10 },
  { value: '30', base: 10 }
], '+');
assert.strictEqual(singleOpCalc.success, true);
assert.strictEqual(singleOpCalc.decimalResult, 60);

// 6. BCD Engine Tests
console.log('6. Testing BCD Engine (Addition, 9\'s and 10\'s Complements)...');

// A. BCD Validation & Conversion
assert.strictEqual(BaseConverter.validateBCDInput('48', 'decimal').isValid, true);
assert.strictEqual(BaseConverter.validateBCDInput('4A', 'decimal').isValid, false);
assert.strictEqual(BaseConverter.validateBCDInput('0100 1000', 'bcd').isValid, true);
assert.strictEqual(BaseConverter.validateBCDInput('0100 1000', 'bcd').decimalStr, '48');
assert.strictEqual(BaseConverter.validateBCDInput('1010', 'bcd').isValid, false); // 1010 is invalid BCD (10 > 9)
assert.strictEqual(BaseConverter.validateBCDInput('1111', 'bcd').isValid, false); // 1111 is invalid BCD (15 > 9)

assert.strictEqual(BaseConverter.decimalToBCD('48').bcdSpaced, '0100 1000');
assert.strictEqual(BaseConverter.bcdToDecimal('0100 1000'), '48');

// B. BCD Addition without correction: 12 + 23 = 35
const addNoCorr = BaseConverter.addBCD('12', '23');
assert.strictEqual(addNoCorr.success, true);
assert.strictEqual(addNoCorr.sumDecimal, '35');
assert.strictEqual(addNoCorr.sumBCD, '0011 0101');
assert.strictEqual(addNoCorr.nibbleSteps[0].needsCorrection, false);
assert.strictEqual(addNoCorr.nibbleSteps[1].needsCorrection, false);

// C. BCD Addition with >9 correction: 35 + 28 = 63
// 5 + 8 = 13 (>9) -> +6 -> 19 (0011), carry = 1; 3 + 2 + 1 = 6 (0110)
const addWithCorr = BaseConverter.addBCD('35', '28');
assert.strictEqual(addWithCorr.success, true);
assert.strictEqual(addWithCorr.sumDecimal, '63');
assert.strictEqual(addWithCorr.sumBCD, '0110 0011');
assert.strictEqual(addWithCorr.nibbleSteps[0].needsCorrection, true);
assert.strictEqual(addWithCorr.nibbleSteps[0].correctionNibble, '0110');
assert.strictEqual(addWithCorr.nibbleSteps[1].needsCorrection, false);

// D. BCD Addition with binary overflow carry: 8 + 9 = 17
const addBinCarry = BaseConverter.addBCD('8', '9');
assert.strictEqual(addBinCarry.success, true);
assert.strictEqual(addBinCarry.sumDecimal, '17');
assert.strictEqual(addBinCarry.sumBCD, '0001 0111');
assert.strictEqual(addBinCarry.nibbleSteps[0].needsCorrection, true);

// E. Multi-digit BCD Addition with MSD overflow: 99 + 1 = 100
const addCascade = BaseConverter.addBCD('99', '1');
assert.strictEqual(addCascade.success, true);
assert.strictEqual(addCascade.sumDecimal, '100');
assert.strictEqual(addCascade.sumBCD, '0001 0000 0000');
assert.strictEqual(addCascade.hasOverflowCarry, true);

// F. BCD 9's and 10's Complements
// 28 with width 2 -> 9's comp = 71, 10's comp = 72
assert.strictEqual(BaseConverter.getBCD9sComplement('28', 2).decimalStr, '71');
assert.strictEqual(BaseConverter.getBCD9sComplement('28', 2).bcdSpaced, '0111 0001');
assert.strictEqual(BaseConverter.getBCD10sComplement('28', 2).decimalStr, '72');
assert.strictEqual(BaseConverter.getBCD10sComplement('28', 2).bcdSpaced, '0111 0010');

// G. BCD Subtraction via 9's Complement (A >= B): 75 - 28 = 47
const bcdSub9Pos = BaseConverter.subtractBCD9sComplement('75', '28');
assert.strictEqual(bcdSub9Pos.success, true);
assert.strictEqual(bcdSub9Pos.hasEndAroundCarry, true);
assert.strictEqual(bcdSub9Pos.isNegative, false);
assert.strictEqual(bcdSub9Pos.finalDecimal, '47');
assert.strictEqual(bcdSub9Pos.finalBCD, '0100 0111');

// H. BCD Subtraction via 9's Complement (A < B): 28 - 75 = -47
const bcdSub9Neg = BaseConverter.subtractBCD9sComplement('28', '75');
assert.strictEqual(bcdSub9Neg.success, true);
assert.strictEqual(bcdSub9Neg.hasEndAroundCarry, false);
assert.strictEqual(bcdSub9Neg.isNegative, true);
assert.strictEqual(bcdSub9Neg.finalDecimal, '-47');
assert.strictEqual(bcdSub9Neg.finalBCD, '-0100 0111');

// I. BCD Subtraction via 10's Complement (A >= B): 75 - 28 = 47
const bcdSub10Pos = BaseConverter.subtractBCD10sComplement('75', '28');
assert.strictEqual(bcdSub10Pos.success, true);
assert.strictEqual(bcdSub10Pos.hasEndCarry, true);
assert.strictEqual(bcdSub10Pos.isNegative, false);
assert.strictEqual(bcdSub10Pos.finalDecimal, '47');
assert.strictEqual(bcdSub10Pos.finalBCD, '0100 0111');

// J. BCD Subtraction via 10's Complement (A < B): 28 - 75 = -47
const bcdSub10Neg = BaseConverter.subtractBCD10sComplement('28', '75');
assert.strictEqual(bcdSub10Neg.success, true);
assert.strictEqual(bcdSub10Neg.hasEndCarry, false);
assert.strictEqual(bcdSub10Neg.isNegative, true);
assert.strictEqual(bcdSub10Neg.finalDecimal, '-47');
assert.strictEqual(bcdSub10Neg.finalBCD, '-0100 0111');

// K. Equal operands: 25 - 25 = 0
const bcdSub9Eq = BaseConverter.subtractBCD9sComplement('25', '25');
assert.strictEqual(bcdSub9Eq.finalDecimal, '0');
const bcdSub10Eq = BaseConverter.subtractBCD10sComplement('25', '25');
assert.strictEqual(bcdSub10Eq.finalDecimal, '0');

console.log('All Extended BaseConverter and BCD tests passed successfully!');

