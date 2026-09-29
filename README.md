# Number System Converter & Multi-Base Calculator

A clean, modern, card-based single-page web application built with **HTML5, CSS3, and vanilla JavaScript**. It features a **Multi-Base Converter & Arithmetic Calculator** with per-operand operators (`1+1-1*1/1`), and a dedicated **BCD (Binary-Coded Decimal) Arithmetic & Complements Engine** for 8421 BCD addition and subtraction using both 9's and 10's complements.

---

## Table of Contents
- [Overview](#overview)
- [How to Run the Application](#how-to-run-the-application)
- [Running Automated Tests](#running-automated-tests)
- [Key Features](#key-features)
  - [1. Multi-Base Calculator & Converter](#1-multi-base-calculator--converter)
  - [2. Subtraction via Complements](#2-subtraction-via-complements)
  - [3. BCD Arithmetic & Complements Engine](#3-bcd-arithmetic--complements-engine)
- [Project Structure](#project-structure)
- [UI & Design System](#ui--design-system)

---

## Overview

The application is organized into two primary modes accessible via a top navigation bar:

1. **Multi-Base Calculator**: Seamlessly converts values across **Binary (Base 2)**, **Octal (Base 8)**, **Decimal (Base 10)**, and **Hexadecimal (Base 16)**, and executes multi-base arithmetic with individual per-operand operators and complement subtraction.
2. **BCD Arithmetic & Complements**: A specialized digital logic engine for **8421 Binary-Coded Decimal** addition (with $+0110_2$ correction) and subtraction using both **9's complement** ($(r-1)$'s) and **10's complement** ($r$'s) methods.

---

## How to Run the Application

Because this application is built with standard vanilla web technologies (HTML, CSS, JavaScript), no build tools or package installations are required.

### Method 1: Open Directly in Browser (Quickest)
You can directly open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari):

- **Via PowerShell (Windows)**:
  ```powershell
  Start-Process "index.html"
  ```
- **Via Command Prompt**:
  ```cmd
  start index.html
  ```
- **Via File Explorer**:
  Double-click `index.html` in the project directory.

### Method 2: Local HTTP Server (Recommended)
If you prefer running through a local web server:

- **Using Node.js (`npx serve`)**:
  ```bash
  npx serve .
  ```
- **Using Python 3**:
  ```bash
  python -m http.server 8000
  ```
  Then open [http://localhost:8000](http://localhost:8000) in your browser.

- **Using VS Code Live Server Extension**:
  Right-click `index.html` and click **"Open with Live Server"**.

---

## Running Automated Tests

The application includes a comprehensive test suite covering validation, base conversion, PEMDAS expressions, 8421 BCD addition, and 9's & 10's complement subtraction.

Run the test suite using **Node.js**:
```bash
node tests/test-converter.js
```

### Syntax Verification
Verify script syntax at any time:
```bash
node -c js/converter.js
node -c js/app.js
```

---

## Key Features

### 1. Multi-Base Calculator & Converter
* **Per-Operand Arithmetic Operators**: Customize each operator between operands (e.g. `1 + 1 - 1 * 1 / 1`).
* **Standard PEMDAS/BODMAS Precedence**: Automatically evaluates expressions respecting mathematical operator precedence.
* **Dynamic Operands List**: Supports adding and removing inputs (minimum of 3 inputs enforced).
* **Automatic Real-Time Calculation**: Updates results across all 4 radices (Binary, Octal, Decimal, Hexadecimal) as you type.
* **Input-Level Complements**: Displays the active base's Radix ($r$'s) and Diminished Radix ($(r-1)$'s) complements directly on each input card:
  * **Binary (2)**: 1's & 2's complements
  * **Octal (8)**: 7's & 8's complements
  * **Decimal (10)**: 9's & 10's complements
  * **Hexadecimal (16)**: 15's & 16's complements

### 2. Subtraction via Complements
* Choose any two inputs from your list as Minuend ($M$) and Subtrahend ($N$).
* **Swap Button ($M \rightleftharpoons N$)**: Quickly toggle between positive ($M \ge N$) and negative ($M < N$) complement subtraction.
* **Calculation Base**: Choose to calculate in Auto (Minuend's base), Binary, Octal, Decimal, or Hexadecimal.
* **Comparative Output**:
  * **$r$'s Complement Method**: Formula $M + \text{Comp}_r(N)$, end-carry discard/re-complementation logic, and final result.
  * **$(r-1)$'s Complement Method**: Formula $M + \text{Comp}_{r-1}(N)$, end-around carry ($+1$) logic, and final result.

### 3. BCD Arithmetic & Complements Engine
* **Dual Input Auto-Sync**: Enter either decimal values (e.g., `75`) or 4-bit BCD nibbles (e.g., `0111 0101`). Both inputs synchronize and format with 4-bit nibble spacing automatically.
* **Strict 8421 BCD Validation**: Flags invalid BCD states ($1010_2 \dots 1111_2$) in real time.
* **Operation Selector**: Toggle between **BCD Addition** and **BCD Subtraction**.
* **BCD Addition ($A + B$)**:
  * Automatically applies the $+0110_2$ (+6) correction whenever a 4-bit nibble sum exceeds 9 or generates a binary carry.
  * Prepend an MSD carry nibble (`0001₂`) if an overflow carry occurs.
* **BCD Subtraction ($A - B$) via Both Complements**:
  * **9's Complement Method ($(r-1)$'s)**: Subtrahend 9's complement, BCD sum, End-Around Carry ($+1$ to LSD if $A \ge B$; re-complemented if $A < B$), and final result.
  * **10's Complement Method ($r$'s)**: Subtrahend 10's complement, BCD sum, End-Carry discard (if $A \ge B$; re-complemented if $A < B$), and final result.

---

## Project Structure

```
Multi-Base-Calculator/
├── index.html              # Main HTML5 application file
├── css/
│   └── styles.css          # Design system stylesheet adhering to strict palette
├── js/
│   ├── converter.js        # Core computing engine (Multi-Base & BCD logic)
│   └── app.js              # UI controller, event bindings, and live sync
├── tests/
│   └── test-converter.js   # Automated Node.js unit tests
└── README.md               # Project documentation
```

---

## UI & Design System

The application strictly follows a clean card-based design palette:

| Variable | Color Hex | Usage |
| :--- | :--- | :--- |
| **Background (Primary)** | `#F8FAFC` | Page background |
| **Background (Secondary)** | `#F1F5F9` | Panels, cards, borders, input containers |
| **Text (Primary)** | `#0F172A` | Headings, primary labels, main results |
| **Text (Secondary)** | `#475569` | Helper text, subtitles, placeholders |
| **Brand / Interactive** | `#2563EB` | Active buttons, focus rings, highlights |
| **Brand Text on White** | `#1D4ED8` | Accent labels, active tabs |
