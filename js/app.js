/**
 * Application Controller for Multi-Base Calculator & Converter
 * Manages:
 * - Dynamic rows (minimum 3 inputs)
 * - Inter-operand operator selection (e.g. 1+1-1*1/1)
 * - Real-time base conversion and r's / (r-1)'s complement generation
 * - Concise Subtraction via Complements display (r's and (r-1)'s methods)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // State
  let rows = [];
  let operators = []; // Length is rows.length - 1
  let rowIdCounter = 0;
  const evalMode = 'standard'; // Clean standard PEMDAS

  // DOM Elements
  const inputsContainer = document.getElementById('inputs-container');
  const btnAddRow = document.getElementById('btn-add-row');
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const btnClearAll = document.getElementById('btn-clear-all');

  // Mode Navigation Tabs
  const tabBtnMultibase = document.getElementById('tab-btn-multibase');
  const tabBtnBcd = document.getElementById('tab-btn-bcd');
  const viewMultibase = document.getElementById('view-multibase');
  const viewBcd = document.getElementById('view-bcd');

  // BCD DOM Elements
  const bcdDecA = document.getElementById('bcd-dec-a');
  const bcdBinA = document.getElementById('bcd-bin-a');
  const bcdCountA = document.getElementById('bcd-count-a');
  const bcdDecB = document.getElementById('bcd-dec-b');
  const bcdBinB = document.getElementById('bcd-bin-b');
  const bcdCountB = document.getElementById('bcd-count-b');
  const bcdOpAdd = document.getElementById('bcd-op-add');
  const bcdOpSub = document.getElementById('bcd-op-sub');
  const bcdErrorBanner = document.getElementById('bcd-error-banner');
  const bcdErrorMessage = document.getElementById('bcd-error-message');
  const bcdResultsContainer = document.getElementById('bcd-results-container');
  const bcdOutputSubtitle = document.getElementById('bcd-output-subtitle');

  let bcdCurrentOp = '+';

  // Result Elements
  const calcErrorBanner = document.getElementById('calc-error-banner');
  const calcErrorMessage = document.getElementById('calc-error-message');
  const expressionDisplay = document.getElementById('expression-display');
  const resultBin = document.getElementById('result-bin');
  const resultOct = document.getElementById('result-oct');
  const resultDec = document.getElementById('result-dec');
  const resultHex = document.getElementById('result-hex');
  const compSubCard = document.getElementById('complement-subtraction-card');
  const compSubContainer = document.getElementById('complement-subtraction-container');
  const compSelectM = document.getElementById('comp-select-m');
  const compSelectN = document.getElementById('comp-select-n');
  const compSelectBase = document.getElementById('comp-select-base');
  const btnCompSwap = document.getElementById('btn-comp-swap');
  const toastContainer = document.getElementById('toast-container');
  const copyButtons = document.querySelectorAll('.copy-btn');

  let selectedMinuendRowId = null;
  let selectedSubtrahendRowId = null;
  let selectedCompBase = 'auto';

  const BASE_PLACEHOLDERS = {
    2: 'e.g., 1011 or 10.1',
    8: 'e.g., 75 or 12.4',
    10: 'e.g., 42 or -15.5',
    16: 'e.g., 1F or 2A.C'
  };

  /**
   * Returns a concise prefix label for the base selector.
   * @param {number} base 
   * @returns {string}
   */
  function getBaseBadgeText(base) {
    switch (parseInt(base, 10)) {
      case 2: return 'BIN 2';
      case 8: return 'OCT 8';
      case 10: return 'DEC 10';
      case 16: return 'HEX 16';
      default: return `B${base}`;
    }
  }

  /**
   * Initializes the application with default sample rows and mixed operators.
   */
  function init() {
    setupEventListeners();
    loadDemoData();
    initBCD();
  }

  /**
   * Loads initial demonstration data (3 mixed-base inputs and mixed operators).
   */
  function loadDemoData() {
    rows = [
      { id: ++rowIdCounter, value: '1011', base: 2 },
      { id: ++rowIdCounter, value: '1F', base: 16 },
      { id: ++rowIdCounter, value: '12', base: 8 }
    ];
    operators = ['+', '-'];
    selectedMinuendRowId = rows[1].id;
    selectedSubtrahendRowId = rows[2].id;
    selectedCompBase = 'auto';
    renderAllRows();
    updateControlsState();
    calculateIfValid();
  }

  /**
   * Clears all inputs while preserving base selections and operators.
   */
  function clearAllInputs() {
    rows.forEach(row => {
      row.value = '';
    });
    renderAllRows();
    resetResultsDisplay();
    expressionDisplay.textContent = 'Enter valid inputs to view calculation';
    calcErrorBanner.style.display = 'none';
    showToast('All input values cleared.');
  }

  /**
   * Sets up global event listeners.
   */
  function setupEventListeners() {
    // Add row button
    if (btnAddRow) {
      btnAddRow.addEventListener('click', () => {
        addRow('', 10);
      });
    }

    // Reset demo button
    if (btnResetDemo) {
      btnResetDemo.addEventListener('click', () => {
        loadDemoData();
        showToast('Sample demo loaded.');
      });
    }

    // Clear all button
    if (btnClearAll) {
      btnClearAll.addEventListener('click', clearAllInputs);
    }

    // Complement Subtraction input selectors
    if (compSelectM) {
      compSelectM.addEventListener('change', (e) => {
        selectedMinuendRowId = parseInt(e.target.value, 10);
        renderUserSelectedComplementSubtraction();
      });
    }

    if (compSelectN) {
      compSelectN.addEventListener('change', (e) => {
        selectedSubtrahendRowId = parseInt(e.target.value, 10);
        renderUserSelectedComplementSubtraction();
      });
    }

    if (compSelectBase) {
      compSelectBase.addEventListener('change', (e) => {
        selectedCompBase = e.target.value;
        renderUserSelectedComplementSubtraction();
      });
    }

    if (btnCompSwap) {
      btnCompSwap.addEventListener('click', () => {
        const temp = selectedMinuendRowId;
        selectedMinuendRowId = selectedSubtrahendRowId;
        selectedSubtrahendRowId = temp;
        updateComplementSelectors(false);
        renderUserSelectedComplementSubtraction();
        showToast('Swapped Minuend and Subtrahend.');
      });
    }

    // Copy result buttons
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl && targetEl.textContent && targetEl.textContent !== '—') {
          copyToClipboard(targetEl.textContent, button);
        } else {
          showToast('No calculated result to copy yet.', 'info');
        }
      });
    });
  }

  /**
   * Updates state of control buttons (enforces minimum 3 inputs constraint).
   */
  function updateControlsState() {
    const isAtMin = rows.length <= 3;
    const removeButtons = document.querySelectorAll('.btn-remove-row');
    removeButtons.forEach(btn => {
      btn.disabled = isAtMin;
      btn.title = isAtMin ? 'Minimum of 3 inputs required' : 'Remove this input';
    });
  }

  /**
   * Adds a new input row with a connecting operator.
   * @param {string} value 
   * @param {number} base 
   */
  function addRow(value = '', base = 10) {
    const newRow = {
      id: ++rowIdCounter,
      value: value,
      base: parseInt(base, 10)
    };
    rows.push(newRow);
    operators.push('+');

    renderAllRows();
    updateControlsState();
    calculateIfValid();

    // Focus newly added input
    const newInput = document.getElementById(`input-val-${newRow.id}`);
    if (newInput) {
      newInput.focus();
    }
  }

  /**
   * Removes an input row by ID and trims the corresponding operator.
   * @param {number} id 
   */
  function removeRow(id) {
    if (rows.length <= 3) {
      showToast('Cannot remove. A minimum of 3 inputs is required.', 'warning');
      return;
    }

    const removeIndex = rows.findIndex(r => r.id === id);
    if (removeIndex === -1) return;

    rows.splice(removeIndex, 1);
    if (removeIndex === 0) {
      operators.splice(0, 1);
    } else {
      operators.splice(removeIndex - 1, 1);
    }

    renderAllRows();
    updateControlsState();
    calculateIfValid();
  }

  /**
   * Renders all rows and inter-row operator connectors.
   */
  function renderAllRows() {
    inputsContainer.innerHTML = '';

    rows.forEach((row, index) => {
      if (index > 0) {
        const opIndex = index - 1;
        const connector = createOperatorConnectorElement(opIndex);
        inputsContainer.appendChild(connector);
      }

      const rowCard = createRowElement(row, index + 1);
      inputsContainer.appendChild(rowCard);
      bindRowEvents(rowCard, row);
      validateAndUpdateRow(row);
    });

    updateControlsState();
  }

  /**
   * Creates an inter-row operator selector widget connecting row i and row i+1.
   * @param {number} opIndex 
   * @returns {HTMLElement}
   */
  function createOperatorConnectorElement(opIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'operator-connector';
    wrapper.id = `op-connector-${opIndex}`;

    const currentOp = operators[opIndex] || '+';

    wrapper.innerHTML = `
      <div class="connector-badge" role="radiogroup" aria-label="Operator between operands">
        <button type="button" class="inline-op-btn ${currentOp === '+' ? 'active' : ''}" data-op="+" title="Addition (+)">+</button>
        <button type="button" class="inline-op-btn ${currentOp === '-' ? 'active' : ''}" data-op="-" title="Subtraction (−)">−</button>
        <button type="button" class="inline-op-btn ${currentOp === '*' ? 'active' : ''}" data-op="*" title="Multiplication (×)">×</button>
        <button type="button" class="inline-op-btn ${currentOp === '/' ? 'active' : ''}" data-op="/" title="Division (÷)">÷</button>
      </div>
    `;

    const buttons = wrapper.querySelectorAll('.inline-op-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        operators[opIndex] = btn.getAttribute('data-op');
        calculateIfValid();
      });
    });

    return wrapper;
  }

  /**
   * Creates an input row card element.
   * @param {object} row 
   * @param {number} index 
   * @returns {HTMLElement}
   */
  function createRowElement(row, index) {
    const card = document.createElement('article');
    card.className = 'input-row-card';
    card.id = `row-card-${row.id}`;

    const isAtMin = rows.length <= 3;

    card.innerHTML = `
      <div class="row-header">
        <span class="row-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          Number ${index}
        </span>
        <button type="button" class="btn btn-danger-ghost btn-remove-row" data-row-id="${row.id}" ${isAtMin ? 'disabled' : ''} title="${isAtMin ? 'Minimum 3 inputs required' : 'Remove input'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Remove
        </button>
      </div>

      <div class="row-fields">
        <div class="field-group">
          <label class="field-label" for="input-val-${row.id}">Value</label>
          <input 
            type="text" 
            id="input-val-${row.id}" 
            class="text-input" 
            placeholder="${BASE_PLACEHOLDERS[row.base] || 'Enter value'}" 
            value="${escapeHtml(row.value)}" 
            autocomplete="off" 
            spellcheck="false"
          >
          <div class="validation-message" id="val-msg-${row.id}"></div>
        </div>

        <div class="field-group base-select-group">
          <label class="field-label" for="select-base-${row.id}">Number Base</label>
          <div class="custom-select-container">
            <span class="base-badge-prefix" id="base-badge-${row.id}">
              ${getBaseBadgeText(row.base)}
            </span>
            <select id="select-base-${row.id}" class="select-input enhanced-base-select" aria-label="Select number base">
              <option value="2" ${row.base === 2 ? 'selected' : ''}>Binary (Base 2)</option>
              <option value="8" ${row.base === 8 ? 'selected' : ''}>Octal (Base 8)</option>
              <option value="10" ${row.base === 10 ? 'selected' : ''}>Decimal (Base 10)</option>
              <option value="16" ${row.base === 16 ? 'selected' : ''}>Hexadecimal (Base 16)</option>
            </select>
            <div class="select-custom-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Individual Conversion Breakdown & Complements -->
      <div class="conversion-breakdown" id="breakdown-${row.id}">
        <!-- Dynamic conversion pills and complements will appear here -->
      </div>
    `;

    return card;
  }

  /**
   * Binds event listeners for a specific row card.
   * @param {HTMLElement} card 
   * @param {object} row 
   */
  function bindRowEvents(card, row) {
    const inputEl = card.querySelector(`#input-val-${row.id}`);
    const selectEl = card.querySelector(`#select-base-${row.id}`);
    const removeBtn = card.querySelector('.btn-remove-row');
    const badgeEl = card.querySelector(`#base-badge-${row.id}`);

    inputEl.addEventListener('input', (e) => {
      row.value = e.target.value;
      validateAndUpdateRow(row);
      calculateIfValid();
    });

    selectEl.addEventListener('change', (e) => {
      row.base = parseInt(e.target.value, 10);
      if (badgeEl) {
        badgeEl.textContent = getBaseBadgeText(row.base);
      }
      inputEl.placeholder = BASE_PLACEHOLDERS[row.base] || 'Enter value';
      validateAndUpdateRow(row);
      calculateIfValid();
    });

    removeBtn.addEventListener('click', () => {
      removeRow(row.id);
    });
  }

  /**
   * Validates a row, updates inline messages, 4-base conversions, and r's / (r-1)'s complements.
   * @param {object} row 
   * @returns {boolean}
   */
  function validateAndUpdateRow(row) {
    const cardEl = document.getElementById(`row-card-${row.id}`);
    const inputEl = document.getElementById(`input-val-${row.id}`);
    const msgEl = document.getElementById(`val-msg-${row.id}`);
    const breakdownEl = document.getElementById(`breakdown-${row.id}`);

    if (!cardEl || !inputEl || !msgEl || !breakdownEl) return false;

    const trimmed = (row.value || '').trim();

    if (trimmed === '') {
      cardEl.classList.remove('has-error');
      inputEl.classList.remove('input-error');
      msgEl.className = 'validation-message';
      msgEl.innerHTML = `
        <span style="color: var(--text-secondary);">Enter a value to see complements</span>
      `;
      breakdownEl.innerHTML = `
        <div class="complements-header">Complements (r's &amp; (r−1)'s)</div>
        <div class="breakdown-empty">Awaiting input...</div>
      `;
      return false;
    }

    const valResult = BaseConverter.validate(trimmed, row.base);

    if (!valResult.isValid) {
      cardEl.classList.add('has-error');
      inputEl.classList.add('input-error');
      msgEl.className = 'validation-message error';
      msgEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${escapeHtml(valResult.error)}</span>
      `;

      breakdownEl.innerHTML = `
        <div class="complements-header">Complements (r's &amp; (r−1)'s)</div>
        <div class="breakdown-empty" style="color: var(--error-text);">Fix input error above to calculate complements.</div>
      `;
      return false;
    }

    // Valid state
    cardEl.classList.remove('has-error');
    inputEl.classList.remove('input-error');
    msgEl.className = 'validation-message success';
    const baseName = BaseConverter.BASES[row.base]?.name || `Base ${row.base}`;
    msgEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
      <span>Valid ${baseName} number</span>
    `;

    // Calculate complements
    try {
      const complements = BaseConverter.getAllComplements(trimmed, row.base);
      renderBreakdown(breakdownEl, complements, row.base);
      return true;
    } catch (err) {
      msgEl.className = 'validation-message error';
      msgEl.textContent = err.message;
      return false;
    }
  }

  /**
   * Renders the r's and (r-1)'s complements inside a row card.
   * @param {HTMLElement} container 
   * @param {object} complements 
   * @param {number} activeBase 
   */
  function renderBreakdown(container, complements, activeBase) {
    const activeComp = complements[activeBase];
    const baseInfo = BaseConverter.BASES[activeBase];

    const complementsHtml = `
      <div class="complements-section">
        <div class="complements-header">
          <span>${baseInfo.name} Complements (Base ${activeBase})</span>
          <span style="font-weight: 500; font-size: 0.7rem; text-transform: none;">Click pill to copy</span>
        </div>
        <div class="complements-grid">
          <div class="complement-pill" title="Click to copy ${activeComp.rMinus1Name} Complement" data-copy-val="${escapeHtml(activeComp.rMinus1Comp)}">
            <div class="complement-pill-label">
              <span>(r−1)'s Comp (${activeComp.rMinus1Name})</span>
              <span style="font-size: 0.65rem; opacity: 0.75;">Diminished</span>
            </div>
            <div class="complement-pill-val">
              ${escapeHtml(activeComp.rMinus1Comp)}<span class="pill-subscript">${baseInfo.subscript}</span>
            </div>
          </div>

          <div class="complement-pill" title="Click to copy ${activeComp.rName} Complement" data-copy-val="${escapeHtml(activeComp.rComp)}">
            <div class="complement-pill-label">
              <span>r's Comp (${activeComp.rName})</span>
              <span style="font-size: 0.65rem; opacity: 0.75;">Radix</span>
            </div>
            <div class="complement-pill-val">
              ${escapeHtml(activeComp.rComp)}<span class="pill-subscript">${baseInfo.subscript}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = complementsHtml;

    container.querySelectorAll('[data-copy-val]').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-copy-val');
        if (val) {
          copyToClipboard(val, pill);
        }
      });
    });
  }

  /**
   * Checks if all rows are currently valid and automatically calculates if so.
   */
  function calculateIfValid() {
    if (rows.length < 3) {
      resetResultsDisplay();
      return;
    }

    let allValid = true;
    for (const r of rows) {
      const trimmed = (r.value || '').trim();
      if (!trimmed) {
        allValid = false;
        break;
      }
      const valRes = BaseConverter.validate(trimmed, r.base);
      if (!valRes.isValid) {
        allValid = false;
        break;
      }
    }

    if (allValid) {
      executeCalculation();
    } else {
      resetResultsDisplay();
      expressionDisplay.textContent = 'Enter valid inputs to view calculation';
      calcErrorBanner.style.display = 'none';
      updateComplementSelectors(false);
      renderUserSelectedComplementSubtraction();
    }
  }

  /**
   * Executes the calculation and renders output and clean complement subtraction results.
   */
  function executeCalculation() {
    calcErrorBanner.style.display = 'none';

    if (rows.length < 3) {
      showError('A minimum of 3 inputs is required for calculation.');
      return;
    }

    let hasInvalid = false;
    rows.forEach(row => {
      const isValid = validateAndUpdateRow(row);
      if (!isValid) hasInvalid = true;
    });

    if (hasInvalid) return;

    const inputsForCalc = rows.map(r => ({ value: r.value.trim(), base: r.base }));
    const result = BaseConverter.calculateExpression(inputsForCalc, operators, evalMode);

    if (!result.success) {
      showError(result.error);
      if (result.expression) {
        expressionDisplay.textContent = result.expression + ' = ?';
      }
      resetResultsDisplay();
      return;
    }

    // 1. Render Expression & Final Results
    expressionDisplay.textContent = `${result.expression} = ${result.decimalResult}₁₀`;

    resultBin.textContent = result.results[2].value;
    resultOct.textContent = result.results[8].value;
    resultDec.textContent = result.results[10].value;
    resultHex.textContent = result.results[16].value;

    // 2. Update and Render Subtraction via Complements with User Selection
    updateComplementSelectors(false);
    renderUserSelectedComplementSubtraction();
  }

  /**
   * Updates the dropdown options for Minuend and Subtrahend in the Subtraction via Complements section.
   * @param {boolean} [autoDetectSubtraction=false]
   */
  function updateComplementSelectors(autoDetectSubtraction = false) {
    if (!compSelectM || !compSelectN) return;

    // Filter rows with valid inputs
    const validRows = rows.filter(r => {
      const val = (r.value || '').trim();
      return val !== '' && BaseConverter.validate(val, r.base).isValid;
    });

    if (validRows.length < 2) {
      if (compSubCard) compSubCard.style.display = 'none';
      if (compSubContainer) compSubContainer.innerHTML = '';
      return;
    }

    if (compSubCard) compSubCard.style.display = 'flex';

    // Auto-detect subtraction pair from operators if requested, or if current selection is invalid
    if (autoDetectSubtraction) {
      let subPairFound = false;
      for (let i = 0; i < operators.length; i++) {
        if (operators[i] === '-') {
          const rowM = rows[i];
          const rowN = rows[i + 1];
          const valM = (rowM.value || '').trim();
          const valN = (rowN.value || '').trim();
          if (valM && valN && BaseConverter.validate(valM, rowM.base).isValid && BaseConverter.validate(valN, rowN.base).isValid) {
            selectedMinuendRowId = rowM.id;
            selectedSubtrahendRowId = rowN.id;
            subPairFound = true;
            break;
          }
        }
      }
      if (!subPairFound) {
        if (!validRows.some(r => r.id === selectedMinuendRowId)) {
          selectedMinuendRowId = validRows[0].id;
        }
        if (!validRows.some(r => r.id === selectedSubtrahendRowId)) {
          selectedSubtrahendRowId = validRows.length > 1 ? validRows[1].id : validRows[0].id;
        }
      }
    } else {
      if (!validRows.some(r => r.id === selectedMinuendRowId)) {
        selectedMinuendRowId = validRows[0].id;
      }
      if (!validRows.some(r => r.id === selectedSubtrahendRowId)) {
        selectedSubtrahendRowId = validRows.length > 1 ? validRows[1].id : validRows[0].id;
      }
    }

    // Build options
    const optionsHtmlM = validRows.map(r => {
      const idx = rows.findIndex(row => row.id === r.id);
      const isSel = r.id === selectedMinuendRowId;
      const baseInfo = BaseConverter.BASES[r.base];
      return `<option value="${r.id}" ${isSel ? 'selected' : ''}>Input #${idx + 1}: ${escapeHtml(r.value)} (${baseInfo.name})</option>`;
    }).join('');

    const optionsHtmlN = validRows.map(r => {
      const idx = rows.findIndex(row => row.id === r.id);
      const isSel = r.id === selectedSubtrahendRowId;
      const baseInfo = BaseConverter.BASES[r.base];
      return `<option value="${r.id}" ${isSel ? 'selected' : ''}>Input #${idx + 1}: ${escapeHtml(r.value)} (${baseInfo.name})</option>`;
    }).join('');

    compSelectM.innerHTML = optionsHtmlM;
    compSelectN.innerHTML = optionsHtmlN;

    compSelectM.value = String(selectedMinuendRowId);
    compSelectN.value = String(selectedSubtrahendRowId);
  }

  /**
   * Calculates and renders the chosen complement subtraction between the user-selected Minuend and Subtrahend.
   */
  function renderUserSelectedComplementSubtraction() {
    if (!compSubContainer || !compSubCard) return;

    const rowM = rows.find(r => r.id === selectedMinuendRowId);
    const rowN = rows.find(r => r.id === selectedSubtrahendRowId);

    if (!rowM || !rowN) {
      compSubContainer.innerHTML = `
        <div class="breakdown-empty">Please select valid inputs above to calculate Subtraction via Complements.</div>
      `;
      return;
    }

    const valM = (rowM.value || '').trim();
    const valN = (rowN.value || '').trim();

    if (!valM || !valN) {
      compSubContainer.innerHTML = `
        <div class="breakdown-empty">Please enter valid values for the selected inputs to calculate Subtraction via Complements.</div>
      `;
      return;
    }

    const valResM = BaseConverter.validate(valM, rowM.base);
    const valResN = BaseConverter.validate(valN, rowN.base);
    if (!valResM.isValid || !valResN.isValid) {
      compSubContainer.innerHTML = `
        <div class="breakdown-empty" style="color: var(--error-text);">One or both selected inputs contain invalid digits.</div>
      `;
      return;
    }

    try {
      // Determine calculation base
      const targetRadix = selectedCompBase === 'auto' ? rowM.base : parseInt(selectedCompBase, 10);
      const baseInfo = BaseConverter.BASES[targetRadix] || BaseConverter.BASES[10];

      // Convert minuend and subtrahend to the target base
      const decM = BaseConverter.toDecimal(valM, rowM.base);
      const decN = BaseConverter.toDecimal(valN, rowN.base);
      const valMInTarget = BaseConverter.fromDecimal(decM, targetRadix);
      const valNInTarget = BaseConverter.fromDecimal(decN, targetRadix);

      // Perform complement subtraction
      const det = BaseConverter.subtractUsingComplements(valMInTarget, valNInTarget, targetRadix);

      const idxM = rows.findIndex(r => r.id === rowM.id) + 1;
      const idxN = rows.findIndex(r => r.id === rowN.id) + 1;

      compSubContainer.innerHTML = `
        <div class="comp-simple-row">
          <div class="comp-simple-header">
            <span class="comp-simple-title">
              Input #${idxM} (${escapeHtml(valM)}${BaseConverter.BASES[rowM.base].subscript}) − Input #${idxN} (${escapeHtml(valN)}${BaseConverter.BASES[rowN.base].subscript})
              <span style="font-weight: 500; font-size: 0.8rem; color: var(--text-secondary);">(${decM}₁₀ − ${decN}₁₀)</span>
            </span>
            <span class="comp-simple-badge">${escapeHtml(det.baseName)} (Base ${det.base})</span>
          </div>

          <div class="comp-simple-grid">
            <!-- r's Complement Card -->
            <div class="comp-method-box is-r">
              <div class="comp-method-top">
                <span class="comp-method-name">${escapeHtml(det.rMethod.name)}</span>
                <span class="carry-tag ${det.rMethod.hasEndCarry ? 'has-carry' : 'no-carry'}">
                  ${det.rMethod.hasEndCarry ? 'End-Carry Discarded' : 'No Carry (Negated)'}
                </span>
              </div>
              <div class="comp-formula-line">
                M + Comp<sub>r</sub>(N) = ${escapeHtml(det.paddedMinuend)} + ${escapeHtml(det.rMethod.subtrahendComp)} = ${escapeHtml(det.rMethod.rawSum)}${det.subscript}
              </div>
              <div class="comp-result-line">
                Result: <strong>${escapeHtml(det.rMethod.finalResult)}${det.subscript}</strong> (${det.finalDecimal}₁₀)
              </div>
            </div>

            <!-- (r-1)'s Complement Card -->
            <div class="comp-method-box is-r-minus-1">
              <div class="comp-method-top">
                <span class="comp-method-name">${escapeHtml(det.rMinus1Method.name)}</span>
                <span class="carry-tag ${det.rMinus1Method.hasEndCarry ? 'has-carry' : 'no-carry'}">
                  ${det.rMinus1Method.hasEndCarry ? 'End-Around Carry (+1)' : 'No Carry (Negated)'}
                </span>
              </div>
              <div class="comp-formula-line">
                M + Comp<sub>r-1</sub>(N) = ${escapeHtml(det.paddedMinuend)} + ${escapeHtml(det.rMinus1Method.subtrahendComp)} = ${escapeHtml(det.rMinus1Method.rawSum)}${det.subscript}
              </div>
              <div class="comp-result-line">
                Result: <strong>${escapeHtml(det.rMinus1Method.finalResult)}${det.subscript}</strong> (${det.finalDecimal}₁₀)
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      compSubContainer.innerHTML = `
        <div class="breakdown-empty" style="color: var(--error-text);">${escapeHtml(err.message)}</div>
      `;
    }
  }

  /**
   * Displays an error alert banner.
   * @param {string} msg 
   */
  function showError(msg) {
    calcErrorMessage.textContent = msg;
    calcErrorBanner.style.display = 'flex';
  }

  /**
   * Resets result cards to placeholder state.
   */
  function resetResultsDisplay() {
    resultBin.textContent = '—';
    resultOct.textContent = '—';
    resultDec.textContent = '—';
    resultHex.textContent = '—';
    updateComplementSelectors(false);
    renderUserSelectedComplementSubtraction();
  }

  /**
   * Copies text to clipboard and provides visual feedback.
   * @param {string} text 
   * @param {HTMLElement} triggerElement 
   */
  function copyToClipboard(text, triggerElement) {
    if (!navigator.clipboard) {
      fallbackCopy(text);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      triggerCopyFeedback(triggerElement, text);
    }).catch(() => {
      fallbackCopy(text);
    });
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`Copied: ${text}`);
    } catch (e) {
      showToast('Could not copy to clipboard', 'error');
    }
    document.body.removeChild(textArea);
  }

  function triggerCopyFeedback(el, text) {
    if (el) {
      const originalText = el.innerHTML;
      if (el.classList.contains('copy-btn') || el.classList.contains('complement-pill') || el.classList.contains('breakdown-pill')) {
        el.style.transform = 'scale(0.97)';
        setTimeout(() => el.style.transform = '', 150);
      }
    }
    showToast(`Copied to clipboard: ${text}`);
  }

  /**
   * Displays a temporary toast notification.
   * @param {string} message 
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  /**
   * HTML escape utility.
   * @param {string} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // BCD ARITHMETIC & COMPLEMENTS CONTROLLER
  // =========================================================================

  /**
   * Initializes BCD module with default values and event listeners.
   */
  function initBCD() {
    setupBCDEvents();
    updateBCDCounters();
    calculateBCD();
  }

  /**
   * Switches between Multi-Base Calculator and BCD Arithmetic views.
   * @param {'multibase'|'bcd'} tabMode 
   */
  function switchTab(tabMode) {
    if (tabMode === 'bcd') {
      if (tabBtnMultibase) {
        tabBtnMultibase.classList.remove('active');
        tabBtnMultibase.setAttribute('aria-selected', 'false');
      }
      if (tabBtnBcd) {
        tabBtnBcd.classList.add('active');
        tabBtnBcd.setAttribute('aria-selected', 'true');
      }
      if (viewMultibase) viewMultibase.style.display = 'none';
      if (viewBcd) viewBcd.style.display = 'block';
      calculateBCD();
    } else {
      if (tabBtnBcd) {
        tabBtnBcd.classList.remove('active');
        tabBtnBcd.setAttribute('aria-selected', 'false');
      }
      if (tabBtnMultibase) {
        tabBtnMultibase.classList.add('active');
        tabBtnMultibase.setAttribute('aria-selected', 'true');
      }
      if (viewBcd) viewBcd.style.display = 'none';
      if (viewMultibase) viewMultibase.style.display = 'block';
      calculateIfValid();
    }
  }

  /**
   * Binds all BCD UI interactions and real-time listeners.
   */
  function setupBCDEvents() {
    // Mode Switcher Tabs
    if (tabBtnMultibase) tabBtnMultibase.addEventListener('click', () => switchTab('multibase'));
    if (tabBtnBcd) tabBtnBcd.addEventListener('click', () => switchTab('bcd'));

    // Bi-directional input sync for Operand A
    if (bcdDecA && bcdBinA) {
      bcdDecA.addEventListener('input', () => {
        const val = bcdDecA.value.trim();
        if (val === '') {
          bcdBinA.value = '';
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
          return;
        }
        const res = BaseConverter.validateBCDInput(val, 'decimal');
        if (res.isValid) {
          bcdBinA.value = res.bcdSpaced;
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
        } else {
          showBCDError(`Operand A: ${res.error}`);
        }
      });

      bcdBinA.addEventListener('input', () => {
        const val = bcdBinA.value.trim();
        if (val === '') {
          bcdDecA.value = '';
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
          return;
        }
        const res = BaseConverter.validateBCDInput(val, 'bcd');
        if (res.isValid) {
          bcdDecA.value = res.decimalStr;
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
        } else {
          showBCDError(`Operand A: ${res.error}`);
        }
      });
    }

    // Bi-directional input sync for Operand B
    if (bcdDecB && bcdBinB) {
      bcdDecB.addEventListener('input', () => {
        const val = bcdDecB.value.trim();
        if (val === '') {
          bcdBinB.value = '';
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
          return;
        }
        const res = BaseConverter.validateBCDInput(val, 'decimal');
        if (res.isValid) {
          bcdBinB.value = res.bcdSpaced;
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
        } else {
          showBCDError(`Operand B: ${res.error}`);
        }
      });

      bcdBinB.addEventListener('input', () => {
        const val = bcdBinB.value.trim();
        if (val === '') {
          bcdDecB.value = '';
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
          return;
        }
        const res = BaseConverter.validateBCDInput(val, 'bcd');
        if (res.isValid) {
          bcdDecB.value = res.decimalStr;
          updateBCDCounters();
          hideBCDError();
          calculateBCD();
        } else {
          showBCDError(`Operand B: ${res.error}`);
        }
      });
    }

    // Operator toggle buttons
    if (bcdOpAdd && bcdOpSub) {
      bcdOpAdd.addEventListener('click', () => {
        bcdCurrentOp = '+';
        bcdOpAdd.classList.add('active');
        bcdOpSub.classList.remove('active');
        calculateBCD();
      });

      bcdOpSub.addEventListener('click', () => {
        bcdCurrentOp = '-';
        bcdOpSub.classList.add('active');
        bcdOpAdd.classList.remove('active');
        calculateBCD();
      });
    }

    // Delegated copy button listener (works for both standard and BCD copy buttons)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.copy-btn');
      if (btn) {
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        let textToCopy = '';
        if (targetEl) {
          if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA') {
            textToCopy = targetEl.value;
          } else {
            textToCopy = targetEl.textContent;
          }
        }
        if (textToCopy && textToCopy.trim() !== '' && textToCopy.trim() !== '—') {
          copyToClipboard(textToCopy.trim(), btn);
        } else {
          showToast('No calculated result to copy yet.', 'info');
        }
      }
    });
  }

  /**
   * Updates digit count tags for Operand A and Operand B.
   */
  function updateBCDCounters() {
    if (bcdDecA && bcdCountA) {
      const lenA = bcdDecA.value.trim().length;
      bcdCountA.textContent = `${lenA} Digit${lenA === 1 ? '' : 's'} • ${lenA * 4} Bits`;
    }
    if (bcdDecB && bcdCountB) {
      const lenB = bcdDecB.value.trim().length;
      bcdCountB.textContent = `${lenB} Digit${lenB === 1 ? '' : 's'} • ${lenB * 4} Bits`;
    }
  }

  function showBCDError(msg) {
    if (bcdErrorBanner && bcdErrorMessage) {
      bcdErrorBanner.style.display = 'flex';
      bcdErrorMessage.textContent = msg;
    }
  }

  function hideBCDError() {
    if (bcdErrorBanner) {
      bcdErrorBanner.style.display = 'none';
    }
  }

  /**
   * Main calculation dispatcher for BCD Addition and Subtraction.
   */
  function calculateBCD() {
    const valA = bcdDecA ? bcdDecA.value.trim() : '';
    const valB = bcdDecB ? bcdDecB.value.trim() : '';

    if (!valA || !valB) {
      if (bcdResultsContainer) {
        bcdResultsContainer.innerHTML = `
          <div style="padding: 2.5rem 1.5rem; text-align: center; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1.5px dashed var(--card-border);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 0.75rem; color: var(--text-secondary); opacity: 0.6;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">Awaiting Operands</p>
            <p style="font-size: 0.85rem;">Enter values for Operand A and Operand B to view calculation.</p>
          </div>
        `;
      }
      return;
    }

    const checkA = BaseConverter.validateBCDInput(valA, 'decimal');
    const checkB = BaseConverter.validateBCDInput(valB, 'decimal');

    if (!checkA.isValid) {
      showBCDError(`Operand A: ${checkA.error}`);
      return;
    }
    if (!checkB.isValid) {
      showBCDError(`Operand B: ${checkB.error}`);
      return;
    }

    hideBCDError();

    if (bcdCurrentOp === '+') {
      if (bcdOutputSubtitle) {
        bcdOutputSubtitle.textContent = '8421 BCD Addition with 4-bit nibble addition and +0110 (+6) correction';
      }
      const addRes = BaseConverter.addBCD(valA, valB, 'decimal');
      if (!addRes.success) {
        showBCDError(addRes.error);
        return;
      }
      renderBCDAddition(addRes);
    } else {
      if (bcdOutputSubtitle) {
        bcdOutputSubtitle.textContent = "8421 BCD Subtraction comparative analysis using 9's and 10's Complements";
      }
      const sub9 = BaseConverter.subtractBCD9sComplement(valA, valB, 'decimal');
      const sub10 = BaseConverter.subtractBCD10sComplement(valA, valB, 'decimal');
      if (!sub9.success) {
        showBCDError(sub9.error);
        return;
      }
      renderBCDSubtraction(sub9, sub10);
    }
  }

  /**
   * Renders BCD Addition output cleanly without verbose step breakdown.
   * @param {ReturnType<typeof BaseConverter.addBCD>} addRes 
   */
  function renderBCDAddition(addRes) {
    if (!bcdResultsContainer) return;

    const overflowBadge = addRes.hasOverflowCarry ? `
      <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: var(--brand-text); padding: 0.65rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>End Carry Out from MSD = 1 &bull; Prepends a new leading BCD digit '0001₂' (1₁₀)</span>
      </div>
    ` : '';

    bcdResultsContainer.innerHTML = `
      <!-- Summary Card -->
      <div class="bcd-summary-card">
        <div class="bcd-summary-header">
          <span class="bcd-summary-title">BCD Addition Result (A + B)</span>
          <button type="button" class="copy-btn" data-copy-target="bcd-sum-val" title="Copy BCD bitstring">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy BCD
          </button>
        </div>

        <div class="bcd-primary-values">
          <div class="bcd-val-row">
            <span class="bcd-val-label">BCD 8421:</span>
            <span id="bcd-sum-val" class="bcd-val-code">${escapeHtml(addRes.sumBCD)}</span>
            <sub class="result-subscript">BCD</sub>
          </div>
          <div class="bcd-val-row">
            <span class="bcd-val-label">Decimal Sum:</span>
            <span class="bcd-val-dec">${escapeHtml(addRes.sumDecimal)}₁₀</span>
          </div>
        </div>

        ${overflowBadge}
      </div>
    `;
  }

  /**
   * Renders BCD Subtraction output comparing 9's and 10's complement methods cleanly.
   * @param {ReturnType<typeof BaseConverter.subtractBCD9sComplement>} sub9 
   * @param {ReturnType<typeof BaseConverter.subtractBCD10sComplement>} sub10 
   */
  function renderBCDSubtraction(sub9, sub10) {
    if (!bcdResultsContainer) return;

    bcdResultsContainer.innerHTML = `
      <!-- Summary Card -->
      <div class="bcd-summary-card">
        <div class="bcd-summary-header">
          <span class="bcd-summary-title">BCD Subtraction Result (A − B)</span>
          <button type="button" class="copy-btn" data-copy-target="bcd-diff-val" title="Copy BCD difference">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy BCD
          </button>
        </div>

        <div class="bcd-primary-values">
          <div class="bcd-val-row">
            <span class="bcd-val-label">BCD 8421:</span>
            <span id="bcd-diff-val" class="bcd-val-code">${escapeHtml(sub9.finalBCD)}</span>
            <sub class="result-subscript">BCD</sub>
          </div>
          <div class="bcd-val-row">
            <span class="bcd-val-label">Decimal Diff:</span>
            <span class="bcd-val-dec">${escapeHtml(sub9.finalDecimal)}₁₀</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-top: 0.25rem;">
          <span class="carry-flag-badge ${sub9.isNegative ? 'carry-no' : 'carry-yes'}">
            ${sub9.isNegative ? 'Negative Result (A < B)' : 'Positive Result (A ≥ B)'}
          </span>
        </div>
      </div>

      <!-- Comparative 2-Column Grid -->
      <div class="bcd-complements-grid">

        <!-- Method 1: 9's Complement Method -->
        <article class="bcd-method-card">
          <div class="bcd-method-header">
            <span class="bcd-method-title">9's Complement Method</span>
            <span class="carry-flag-badge ${sub9.hasEndAroundCarry ? 'carry-yes' : 'carry-no'}">
              ${sub9.hasEndAroundCarry ? 'End-Around Carry = 1' : 'End-Around Carry = 0'}
            </span>
          </div>

          <div class="bcd-method-result">
            <span class="res-label">Method Result</span>
            <span class="res-val">${escapeHtml(sub9.finalBCD)}</span>
            <span class="res-dec">= ${escapeHtml(sub9.finalDecimal)}₁₀</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div>
              <strong style="color: var(--text-primary);">9's Complement of B:</strong>
              <div style="font-family: var(--font-mono); font-weight: 600; color: var(--brand-text);">${escapeHtml(sub9.subtrahend9sCompBCD)} &nbsp;(${escapeHtml(sub9.subtrahend9sCompDec)}₁₀)</div>
            </div>
            <div>
              <strong style="color: var(--text-primary);">BCD Sum [A + 9's comp(B)]:</strong>
              <div style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${escapeHtml(sub9.additionResult.sumBCD)} &nbsp;(${escapeHtml(sub9.additionResult.sumDecimal)}₁₀)</div>
            </div>
            <div>
              <strong style="color: var(--text-primary);">End-Around Carry Action:</strong>
              <div>${sub9.hasEndAroundCarry ? 'Carry = 1 (A ≥ B) &bull; Added 1 to LSD' : 'Carry = 0 (A < B) &bull; Re-complemented (negative)'}</div>
            </div>
          </div>
        </article>

        <!-- Method 2: 10's Complement Method -->
        <article class="bcd-method-card">
          <div class="bcd-method-header">
            <span class="bcd-method-title">10's Complement Method</span>
            <span class="carry-flag-badge ${sub10.hasEndCarry ? 'carry-yes' : 'carry-no'}">
              ${sub10.hasEndCarry ? 'End Carry = 1 (Discard)' : 'End Carry = 0 (Re-comp)'}
            </span>
          </div>

          <div class="bcd-method-result">
            <span class="res-label">Method Result</span>
            <span class="res-val">${escapeHtml(sub10.finalBCD)}</span>
            <span class="res-dec">= ${escapeHtml(sub10.finalDecimal)}₁₀</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div>
              <strong style="color: var(--text-primary);">10's Complement of B:</strong>
              <div style="font-family: var(--font-mono); font-weight: 600; color: var(--brand-text);">${escapeHtml(sub10.subtrahend10sCompBCD)} &nbsp;(${escapeHtml(sub10.subtrahend10sCompDec)}₁₀)</div>
            </div>
            <div>
              <strong style="color: var(--text-primary);">BCD Sum [A + 10's comp(B)]:</strong>
              <div style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${escapeHtml(sub10.additionResult.sumBCD)} &nbsp;(${escapeHtml(sub10.additionResult.sumDecimal)}₁₀)</div>
            </div>
            <div>
              <strong style="color: var(--text-primary);">End-Carry Action:</strong>
              <div>${sub10.hasEndCarry ? 'Carry = 1 (A ≥ B) &bull; End carry discarded' : 'Carry = 0 (A < B) &bull; Re-complemented (negative)'}</div>
            </div>
          </div>
        </article>

      </div>
    `;
  }

  // Start the application
  init();
});
