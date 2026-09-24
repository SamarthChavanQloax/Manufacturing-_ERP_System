# FULL REGRESSION TEST REPORT — MANUFACTURING ERP 2.0
## Pre-Manual-Testing Comprehensive Automated Regression Report

> **Target Environment:**  
> - Backend: NestJS (TypeScript) on Node.js v24.15.0 (`http://localhost:5001/api`)  
> - Frontend: React 18 + Vite (`http://localhost:3000`)  
> - Database: MySQL 8.0 on Port 3306 (`barcode` schema)  
> - TypeORM: `synchronize: false` (Non-destructive database mode)  
> - Legacy Source of Truth: PHP CodeIgniter (`Welcome.php`)

---

### Executive Summary

Prior to final human manual testing, the complete Manufacturing ERP 2.0 application underwent extensive automated regression testing. The objective was to verify all remaining modules, multi-product scenarios, bulk packing, reverse logistics, stock calculations, RBAC authorization, and barcode sequence rules, ensuring that zero regressions were introduced into the core workflow.

**Overall Status: READY FOR MANUAL TESTING**  
**Core Workflow Status: PASS**  
**Automated Regression Suites: 8/8 PASSED (100% Pass Rate)**  
**Destructive Database Operations: ZERO (0 Tables dropped, 0 Tables truncated, 0 Baseline rows deleted)**

---

## 1. Automated Regression Suites Summary

| # | Test Suite Name | Script Path | Scope & Scenarios Covered | Result |
|---|---|---|---|---|
| **1** | **Core E2E Workflow Regression** | `backend/run_core_e2e_regression.js` | Full 5-role Pack → Box → Invoice → Gate lifecycle using fresh isolated test run | **PASS** |
| **2** | **Bulk Packing Regression** | `backend/run_bulk_packing_regression.js` | Role authorization, negative validation, sequential barcode generation, batch list | **PASS** |
| **3** | **Multi-Product & Multi-Box Regression** | `backend/run_multi_product_regression.js` | Part 1 (`436330`), Part 2754 (`0904AP200010N`), 2 packs/box, 2 boxes/invoice, cross-part mismatch | **PASS** |
| **4** | **Return / Reverse Logistics Regression** | `backend/run_return_regression.js` | Role authorization, invoice return, status rollback to `pending`, scan cleanup, 404 handler | **PASS** |
| **5** | **Stock & Inventory Regression** | `backend/run_stock_regression.js` | Mathematical validation of FG Stock, Box Stock, Inv Stock transitions, gate return restoration | **PASS** |
| **6** | **Role Authorization RBAC Regression** | `backend/run_role_authorization_regression.js` | 35 distinct role-route combinations across Admin, Packing, Box, Invoice, Gate, and Anon | **PASS** |
| **7** | **Barcode Sequence & Format Regression** | `backend/run_barcode_regression.js` | Strict parity with legacy `100000+count`, `200000+count`, `300000+count`, clearance code formula | **PASS** |
| **8** | **Validation & Negative Scenarios** | `backend/run_negative_tests.js` | 6 business rule violation scenarios (empty lock, overflow, wrong part, duplicate, etc.) | **PASS** |

---

## 2. Detailed Test Results & Evidence

### Suite 1: Core E2E Workflow Regression (`run_core_e2e_regression.js`)
- **Run Identifier:** `REG-CORE-418336`
- **Product:** `D16.064.34.0.PR` (Part ID: 1825, Description: "S S JOINT")
- **Customer:** Mahindra & Mahindra (ID: 1)
- **Target Quantity:** 5 Pcs
- **Test Steps:**
  1. Admin Master Verification: Confirmed Part 1825 and Customer 1.
  2. Packing Creation: Created packing record ID 253 with Barcode `100249` (Qty: 5). Status: `pending`.
  3. Box Creation & Lock: Created Box ID 45 with Barcode `200043`. Attempted empty box lock (correctly rejected HTTP 400). Added packing `100249` to box. Locked box (Qty: 5, Lock: `yes`).
  4. Invoice Creation & Mapping: Created Invoice ID 34 with Number `INV-REG-CORE-418336` and Barcode `300031`. Added box `200043` to invoice. Locked invoice (Packed: 5/5, Lock: `yes`).
  5. Gate Verification: Gate started verification session Match ID 18. Scanned box `200043`. Completed state reached. Generated Gate Clearance Code `INV-REG-CORE-418336400018`.
  6. Gate-Out Report: Queried report; verified clearance code and timestamp.
- **Result: PASS (5/5 Roles, 100% Success)**

---

### Suite 2: Bulk Packing Regression (`run_bulk_packing_regression.js`)
- **Role Security:** Attempted bulk creation as Gate role -> Rejected HTTP 403 Forbidden.
- **Validation Scenarios:**
  - Part ID 999999 (non-existent) -> Rejected HTTP 400 (`Part not found`).
  - Part Qty 0 -> Rejected HTTP 400 (`Invalid part quantity`).
  - Bulk Count 0 -> Rejected HTTP 400 (`Invalid packing bulk quantity`).
- **Legitimate Bulk Generation:**
  - Generated 3 tickets for Part 1825 (10 Pcs each):
    - Ticket ID 254 | Barcode `100250` | Qty 10 | Status `pending`
    - Ticket ID 255 | Barcode `100251` | Qty 10 | Status `pending`
    - Ticket ID 256 | Barcode `100252` | Qty 10 | Status `pending`
  - Asserted all 3 barcodes are sequential and unique.
- **Result: PASS (4/4 Scenarios)**

---

### Suite 3: Multi-Product & Multi-Box Regression (`run_multi_product_regression.js`)
- **Scenario 1: Multiple Packing Items Inside Single Box**
  - Tested Part 1 (`436330`).
  - Created Pack A (Qty 12, Barcode `100253`) and Pack B (Qty 8, Barcode `100254`).
  - Added both packs to Box `200044`.
  - Locked Box: Total Qty = 20 (accumulated 12 + 8), Packed Items = 2.
- **Scenario 2: Single Invoice Requiring Multiple Boxes**
  - Tested Part 2754 (`0904AP200010N`).
  - Created Box A (Barcode `200045`, Qty 7) and Box B (Barcode `200046`, Qty 7).
  - Created Invoice for Part 2754 with Target Qty 14.
  - Added Box A: Progress = 7/14 (1 box).
  - Added Box B: Progress = 14/14 (2 boxes).
  - Locked Invoice successfully.
- **Scenario 3: Gate Scanning for Multi-Box Invoice**
  - Scanned Box A at gate: Remaining boxes = 1, Completed = `false`.
  - Scanned Box B at gate: Remaining boxes = 0, Completed = `true`.
  - Clearance Code generated: `INV-MULTI-29906400019`.
- **Scenario 4: Cross-Product Mismatch Rejection**
  - Attempted to map Box of Part 1 to Invoice of Part 2754.
  - Rejected: HTTP 400 (`Error 405 : Packing Part Number Mismatch Please Try Again`).
- **Result: PASS (4/4 Scenarios)**

---

### Suite 4: Return / Reverse Logistics Regression (`run_return_regression.js`)
- **Role Security:** Packing role attempted return -> Rejected HTTP 403 Forbidden.
- **Invoice Return Rollback:**
  - Gate initiated verification for Invoice -> `invoice.status` became `'used'`.
  - Gate scanned box -> `invoice_box_match` record created.
  - Gate executed Return API (`POST /api/verification/return`).
  - Verified post-return state:
    - `invoice.status` reset to `'pending'`.
    - `invoice_box_match` scans cleared to 0.
    - `invoice_match` session deleted.
- **Negative Test:** Returned non-existent match ID 999999 -> Rejected HTTP 404.
- **Result: PASS (3/3 Scenarios)**

---

### Suite 5: Stock & Inventory Regression (`run_stock_regression.js`)
- **Formula Tested:**
  - `FG Stock`: `SUM(part_qty) FROM packing WHERE status = 'pending'`
  - `Box Stock`: `SUM(part_qty) FROM box_packing WHERE status = 'pending'`
  - `Inv Stock`: `SUM(qty) FROM invoice WHERE status = 'pending'`
- **Test Lifecycle Steps & Stock Changes:**
  - Initial Part 1825 State: FG=92, Box=10, Inv=73 (API matches raw DB 100%).
  - Step 1 (Create Pack Qty 6): FG increases to 98 (+6), Box=10, Inv=73. [PASS]
  - Step 2 (Add Pack to Box): FG returns to 92 (-6), Box increases to 16 (+6), Inv=73. [PASS]
  - Step 3 (Create Invoice Qty 6): FG=92, Box=16, Inv increases to 79 (+6). [PASS]
  - Step 4 (Add Box to Invoice): FG=92, Box returns to 10 (-6), Inv remains 79. [PASS]
  - Step 5 (Gate Verification Start): FG=92, Box=10, Inv decreases to 73 (-6). [PASS]
  - Step 6 (Gate Return Invoice): FG=92, Box=10, Inv restored to 79 (+6). [PASS]
  - Final Clearance: Fully cleared; stock balanced out cleanly.
- **Result: PASS (All Mathematical Invariants Verified)**

---

### Suite 6: Role Authorization RBAC Regression (`run_role_authorization_regression.js`)
- Tested 35 endpoint × role permutations.
- Unauthenticated requests (no token) -> HTTP 401 Unauthorized [PASS].
- Malformed token -> HTTP 401 Unauthorized [PASS].
- Route Guards Tested:
  - Admin: Full access to `/users`, `/customers`, `/packing`, `/boxes`, `/invoices`, `/verification`.
  - Packing (DPR): Access to `/packing`; denied on `/users`, `/customers`, `/boxes`, `/invoices`, `/verification`.
  - Box (FGS): Access to `/boxes` and read `/customers`; denied on `/users`, `/packing`, `/invoices`, `/verification`.
  - Invoice (Commercial): Access to `/invoices`; denied on `/users`, `/customers`, `/packing`, `/boxes`, `/verification`.
  - Gate: Access to `/verification`; denied on `/users`, `/customers`, `/packing`, `/boxes`, `/invoices`.
- **Result: PASS (35/35 Combinations Passed)**

---

### Suite 7: Barcode Sequence & Format Regression (`run_barcode_regression.js`)
- Verified exact formulas:
  - Packing Barcode: `100000 + count(packing)` -> Tested generated `100258`.
  - Box Barcode: `200000 + count(box)` -> Tested generated `200048`.
  - Invoice Barcode: `300000 + count(invoice)` -> Tested generated `300035`.
  - Gate Clearance Barcode: `${invoice_number}4000${match.id}`.
- Uniqueness audit confirmed zero collisions for all newly generated barcodes.
- **Result: PASS (All Rules Valid)**

---

### Suite 8: Validation & Negative Tests (`run_negative_tests.js`)
1. Lock Empty Box: Rejected HTTP 400 (`Cannot lock an empty box!`). DB lock status remained `no`. [PASS]
2. Add Empty Box to Invoice: Rejected HTTP 400 (`Error 403 : Box barcode contains no packing items`). Zero DB mappings. [PASS]
3. Wrong-Part Box to Invoice: Rejected HTTP 400 (`Error 405 : Packing Part Number Mismatch`). Zero DB mappings. [PASS]
4. Duplicate Box Mapping: Rejected HTTP 400 (`Error : Box barcode not found or already used in another invoice`). Exactly 1 DB mapping retained. [PASS]
5. Exceed Invoice Quantity: Rejected HTTP 400 (`Error 406 : Part Qty Mismatch, adding this box exceeds invoice quantity`). Exactly 1 DB mapping retained. [PASS]
6. Invalid / Non-existent Box Barcode: Rejected HTTP 400 (`Error : Box barcode not found or already used in another invoice`). [PASS]
- **Result: PASS (6/6 Scenarios)**

---

## 3. Database Integrity & Safety Audit

Row counts were verified before and after the test suite runs using `backend/audit_database_deltas.js`:

| Table Name | Baseline Count | Current Observed Count | Delta (New Test Records) | Destructive Operations | Protection Status |
|---|---|---|---|---|---|
| `parts` | 3,051 | 3,053 | +2 | 0 | **PROTECTED** |
| `userinfo` | 5 | 5 | 0 | 0 | **PROTECTED** |
| `customer` | 1 | 5 | +4 | 0 | **PROTECTED** |
| `packing` | 212 | 264 | +52 | 0 | **PROTECTED** |
| `box` | 10 | 55 | +45 | 0 | **PROTECTED** |
| `box_packing` | 10 | 44 | +34 | 0 | **PROTECTED** |
| `invoice` | 7 | 40 | +33 | 0 | **PROTECTED** |
| `invoice_box` | 4 | 30 | +26 | 0 | **PROTECTED** |
| `invoice_match` | 1 | 15 | +14 | 0 | **PROTECTED** |
| `invoice_box_match` | 1 | 14 | +13 | 0 | **PROTECTED** |

- Zero tables dropped.
- Zero tables truncated.
- Zero baseline rows deleted.
- Orphan foreign key checks: Zero orphans in newly created records.
- TypeORM `synchronize: false` maintained throughout.
