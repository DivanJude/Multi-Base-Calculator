# Number System Converter & Calculator

A clean, modern, card-based single-page web application built with **HTML5, CSS3, and vanilla JavaScript**. It functions as an automatic **Number System Converter**, a **Multi-Base Arithmetic Calculator** supporting per-operand operator selection, and a digital logic **Complements & Interactive Complement Subtraction Engine** for Binary (Base 2), Octal (Base 8), Decimal (Base 10), and Hexadecimal (Base 16).

---

## Key Features

### 1. Per-Operand Arithmetic Operators (e.g., $1 + 1 - 1 \times 1 \div 1$)
- **Individual Operator Selectors**: Select a specific operator (`+`, `−`, `×`, `÷`) for each transition between operands.
- **Standard Precedence Evaluation**: Automatically evaluates expressions with standard PEMDAS/BODMAS mathematical precedence.
- **Dynamic Input Rows**: Enforces a minimum of 3 inputs with on-the-fly addition and removal.
- **Automatic Real-Time Calculation**: Results across all 4 bases recalculate instantly as you type, change bases, or toggle operators without needing a manual calculate button.

### 2. $r$'s and $(r-1)$'s Complements on Each Input
- Computes both the **Radix ($r$'s)** and **Diminished Radix ($(r-1)$'s)** complements for each input in its active number base:
  - **Binary (Base 2)**: 1's Complement ($(r-1)$'s) & 2's Complement ($r$'s)
  - **Octal (Base 8)**: 7's Complement ($(r-1)$'s) & 8's Complement ($r$'s)
  - **Decimal (Base 10)**: 9's Complement ($(r-1)$'s) & 10's Complement ($r$'s)
  - **Hexadecimal (Base 16)**: 15's Complement ($(r-1)$'s) & 16's Complement ($r$'s)
- Displayed directly inside each input card with click-to-copy convenience, keeping the card compact and focused.

### 3. Interactive Subtraction via Complements
Users can freely choose which inputs to analyze in the Subtraction via Complements section:
- **Minuend ($M$) & Subtrahend ($N$) Selectors**: Pick any two inputs from the current operand list.
- **Quick Swap ($M \rightleftharpoons N$)**: Instantly invert the operands to inspect positive ($M \ge N$, with end-carry) versus negative ($M < N$, without end-carry) complement subtraction mechanics.
- **Calculation Base Dropdown**: Choose to calculate in Auto (Minuend's base), Binary (Base 2), Octal (Base 8), Decimal (Base 10), or Hexadecimal (Base 16).
- **Comparative Output**:
  - **$r$'s Complement Method**: Formula $M + \text{Comp}_r(N)$, end-carry status (`End-Carry Discarded` or `No Carry (Negated)`), and final result.
  - **$(r-1)$'s Complement Method**: Formula $M + \text{Comp}_{r-1}(N)$, end-carry status (`End-Around Carry (+1)` or `No Carry (Negated)`), and final result.

### 4. UI / UX Design System
- Strictly complies with the requested color palette:
  - **Background (Primary)**: `#F8FAFC`
  - **Background (Secondary)**: `#F1F5F9`
  - **Text (Primary)**: `#0F172A`
  - **Text (Secondary)**: `#475569`
  - **Brand / Interactive**: `#2563EB`
  - **Brand Text on White**: `#1D4ED8`
- Side-by-side two-card dashboard layout:
  - **Left Big Card**: Inputs, enhanced base dropdown, inter-row operator selectors, and active base complements.
  - **Right Big Card**: Expression display, 4-base calculation results with copy buttons, and interactive Subtraction via Complements controls.

---

## Running the Application

Open `index.html` directly in any modern web browser:
```powershell
Start-Process "c:\Users\Divan Jude\Documents\GitHub\Multi-Base-Calculator\index.html"
```

---

## Running the Automated Tests

Execute the comprehensive Node.js test suite:
```bash
node tests/test-converter.js
```
