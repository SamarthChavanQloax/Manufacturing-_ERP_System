# INDEPENDENT RE-TEST REPORT — MANUFACTURING ERP
## Full Re-Execution of the Complete Verified Pack → Box → Invoice → Gate Workflow

> **Precise Verification Scope & Statement:**  
> **Independent re-test of the one-product Pack → Box → Invoice → Gate lifecycle completed successfully across all five application roles.**  
> **All six negative business-validation scenarios passed.**  
> **Baseline records were preserved; additional records were created for the independent re-test.**  
> Note: Testing was executed on product **`D16.064.34.0.PR`** (Part ID: **1825**, Description: **"S S JOINT"**, Customer: **"Mahindra & Mahindra"**, Quantity: **5**). This report distinguishes verified behaviors from unexercised modules and does not claim 100% application-wide parity across every unexercised workflow or untested part.

---

### 1. Unique Retest Transaction Identifiers

To guarantee fresh, independent execution without reusing previous test records:

- **Retest Run Identifier:** `RETEST-1789810496295`
- **Retest Timestamp:** `2026-09-19T09:34:56.295Z`
- **Packing ID & Barcode:** ID `235` | Barcode `100231` (Qty: 5)
- **Box ID & Barcode:** ID `30` | Barcode `200028` (Qty: 5, Lock: yes)
- **Invoice ID & Number:** ID `23` | Invoice No: `INV-RETEST-496216` | Barcode: `300020`
- **Gate Match ID:** ID `12` | Invoice Barcode: `300020` | Status: `verified`
- **Gate Clearance Code:** `INV-RETEST-496216400012` (Matches formula `${invoice_number}4000${match.id}`)

---

### 2. Build & Runtime Verification

| Component | Target Runtime | Command / Verification | Result | Status |
|---|---|---|---|---|
| **Backend TypeScript** | Node.js / NestJS | `npm run build` (`tsc`) | Clean build (0 errors) | **PASS** |
| **Frontend Vite** | React / TypeScript | `npm run build` (`vite build`) | 1,663 modules compiled cleanly | **PASS** |
| **Backend Server** | `http://localhost:5001` | Live process check | Responding / API functional | **PASS** |
| **Frontend Server** | `http://localhost:3000` | HTTP GET `/` -> 200 OK | HTML/CSS/JS loaded | **PASS** |
| **MySQL Database** | Port `3306` (`barcode`) | Live connection via mysql2 | Connected / Queries operational | **PASS** |
| **ORM Configuration** | TypeORM | `synchronize: false` verified | Schema-destructive sync disabled | **PASS** |

---

### 3. Database Safety & Row Count Audit

Baseline records were preserved with no destructive deletion, truncation, reset, or schema-destructive migration. Row counts increased only because additional records were created by the verification run.

| Table Name | Pre-Retest Baseline Count | Final Observed Count | Delta (New Test Records) | Audit Status |
|---|---|---|---|---|
| `parts` | 3,053 | 3,053 | 0 | **PROTECTED (0 deleted)** |
| `userinfo` | 5 | 5 | 0 | **PROTECTED (0 deleted)** |
| `customer` | 3 | 3 | 0 | **PROTECTED (0 deleted)** |
| `packing` | 231 | 237 | +6 | **PRESERVED + Test Records** |
| `box` | 28 | 35 | +7 | **PRESERVED + Test Records** |
| `box_packing` | 20 | 25 | +5 | **PRESERVED + Test Records** |
| `invoice` | 20 | 24 | +4 | **PRESERVED + Test Records** |
| `invoice_box` | 14 | 17 | +3 | **PRESERVED + Test Records** |
| `invoice_match` | 8 | 9 | +1 | **PRESERVED + Test Records** |
| `invoice_box_match`| 5 | 6 | +1 | **PRESERVED + Test Records** |

---

### 4. Role-by-Role E2E Retest Sequence

| Step | Role | User Account | Actions Executed | Verified Outcome | Evidence |
|:---:|:---|:---|:---|:---|:---|
| **1** | **ADMIN** | `admin@admin.com` | Verified Admin dashboard KPI cards, Part Master, Customer Master, recorded starting stock | Starting stock recorded (FG: 25, Box: 5, Inv: 30); Part 1825 found | [`01_retest_admin_dashboard.png`](file:///d:/ERP_System/docs/screenshots/retest/01_retest_admin_dashboard.png), [`02_retest_part_master.png`](file:///d:/ERP_System/docs/screenshots/retest/02_retest_part_master.png), [`03_retest_part_stock.png`](file:///d:/ERP_System/docs/screenshots/retest/03_retest_part_stock.png) |
| **2** | **PACKING / DPR** | `dpr@talbros.com` | Created fresh packing for Part 1825 (Qty 5), generated barcode `100231`, viewed packing | Status starts as `'pending'`, label has Code128 and Talbros branding | [`04_retest_packing_creation.png`](file:///d:/ERP_System/docs/screenshots/retest/04_retest_packing_creation.png), [`05_retest_packing_barcode.png`](file:///d:/ERP_System/docs/screenshots/retest/05_retest_packing_barcode.png), [`06_retest_view_packing.png`](file:///d:/ERP_System/docs/screenshots/retest/06_retest_view_packing.png) |
| **3** | **BOX / FGS** | `fgs@talbros.com` | Created Box `200028`. Negative test: empty box lock rejected (HTTP 400). Added packing `100231`. Locked box | Post-lock Qty remains 5; item list remains visible; `lock_status = 'yes'` | [`07_retest_create_box.png`](file:///d:/ERP_System/docs/screenshots/retest/07_retest_create_box.png), [`08_retest_empty_box_rejected.png`](file:///d:/ERP_System/docs/screenshots/retest/08_retest_empty_box_rejected.png), [`09_retest_box_after_packing.png`](file:///d:/ERP_System/docs/screenshots/retest/09_retest_box_after_packing.png), [`10_retest_box_after_lock.png`](file:///d:/ERP_System/docs/screenshots/retest/10_retest_box_after_lock.png) |
| **4** | **INVOICE / COMMERCIAL** | `invoice@talbros.com` | Created Invoice `INV-RETEST-496216` (Barcode `300020`, Qty 5), added Box `200028`, locked invoice | State reached 5/5 matched; box mapped; invoice locked (`lock_status = 'yes'`) | [`11_retest_create_invoice.png`](file:///d:/ERP_System/docs/screenshots/retest/11_retest_create_invoice.png), [`12_retest_add_box_invoice.png`](file:///d:/ERP_System/docs/screenshots/retest/12_retest_add_box_invoice.png), [`13_retest_invoice_matched.png`](file:///d:/ERP_System/docs/screenshots/retest/13_retest_invoice_matched.png), [`14_retest_invoice_locked.png`](file:///d:/ERP_System/docs/screenshots/retest/14_retest_invoice_locked.png) |
| **5** | **GATE SECURITY** | `gate@talbros.com` | Verified invoice barcode `300020`, scanned physical box `200028`, generated clearance code, verified report | Clearance code `INV-RETEST-496216400012` matched formula `${invoice_number}4000${match.id}` | [`15_retest_gate_verify.png`](file:///d:/ERP_System/docs/screenshots/retest/15_retest_gate_verify.png), [`16_retest_gate_scan.png`](file:///d:/ERP_System/docs/screenshots/retest/16_retest_gate_scan.png), [`17_retest_gate_clearance.png`](file:///d:/ERP_System/docs/screenshots/retest/17_retest_gate_clearance.png), [`18_retest_gate_out_report.png`](file:///d:/ERP_System/docs/screenshots/retest/18_retest_gate_out_report.png) |

---

### 5. Negative Test Suite Results

All six negative scenarios were re-executed independently via `backend/run_negative_tests.js`.

**HTTP Status Note:**  
Legacy CodeIgniter displayed strings such as `"Error 403"`, `"Error 405"`, and `"Error 406"` as message text in alerts. In the NestJS REST API, these legacy business error messages were preserved within the JSON response payload while returning standard REST **HTTP 400 Bad Request**. This constitutes full business validation parity without incorrect database mutation.

| Negative Test Case | Scenario Tested | Observed Business Error Message | Actual HTTP Status | Database Integrity Verified | Result |
|:---:|:---|:---|:---:|:---|:---:|
| **A** | Lock Empty Box | `Error: Cannot lock an empty box! Please scan packing items first.` | HTTP 400 Bad Request | `box.lock_status` remained `'no'` | **PASS** |
| **B** | Add Empty Box to Invoice | `Error 403 : Box barcode contains no packing items !!!!` | HTTP 400 Bad Request | 0 mappings inserted | **PASS** |
| **C** | Wrong-Part Box to Invoice | `Error 405 : Packing Part Number Mismatch Please Try Again` | HTTP 400 Bad Request | 0 mappings inserted | **PASS** |
| **D** | Duplicate Box Mapping | `Error : Box barcode not found or already used in another invoice !!!!` | HTTP 400 Bad Request | Mapping count remained 1 | **PASS** |
| **E** | Invoice Quantity Exceeded | `Error 406 : Part Qty Mismatch, adding this box exceeds invoice quantity` | HTTP 400 Bad Request | Target quantity not exceeded | **PASS** |
| **F** | Invalid / Random Barcode | `Error : Box barcode not found or already used in another invoice !!!!` | HTTP 400 Bad Request | Zero database writes | **PASS** |

---

### 6. Status Lifecycle Evidence (Source Inspection vs Observed DB)

Transitions were verified directly against `D:\Software_data\Software_data\barcode\application\controllers\Welcome.php`:

| Entity Field | Stage | Legacy Source Authority (Code & Line) | Observed Retest DB Value | Parity Assessment |
|---|---|---|---|---|
| `packing.status` | Initial Creation | Default `'pending'` upon packing insertion | `'pending'` | **MATCH** |
| `packing.status` | Scanned into Box | `Welcome.php:2598`: `$this->db->where('barcode', $packing_barcode)->update('packing', ['status' => 'used']);` | `'used'` | **MATCH** |
| `box_packing.status` | Inside Box | `Welcome.php:2604`: `$this->db->insert('box_packing', ['box_id' => $box_id, 'pack_id' => $pack_id, 'status' => 'pending']);` | `'pending'` | **MATCH** (Preserves live stock calculation) |
| `box.lock_status` | Box Locked | `Welcome.php:2634`: `$this->db->where('id', $box_id)->update('box', ['lock_status' => 'yes']);` | `'yes'` | **MATCH** |
| `box.status` | Mapped to Invoice | `Welcome.php:2706`: `$this->db->where('barcode', $box_barcode)->update('box', ['status' => 'used']);` | `'used'` | **MATCH** |
| `box_packing.status` | Mapped to Invoice | `Welcome.php:2707`: `$this->db->where('box_id', $box_id)->update('box_packing', ['status' => 'used']);` | `'used'` | **MATCH** |
| `invoice.lock_status`| Invoice Locked | `Welcome.php:2750`: `$this->db->where('id', $invoice_id)->update('invoice', ['lock_status' => 'yes']);` | `'yes'` | **MATCH** |
| `invoice.status` | Gate Verified | `Welcome.php:3158`: `$this->db->where('barcode', $invoice_barcode)->update('invoice', ['status' => 'used']);` | `'used'` | **MATCH** |
| `invoice_match.status` | Gate Clearance | Created upon gate verification with `'verified'` | `'verified'` | **MATCH** |
| `invoice_box_match` | Gate Scan | Inserted linking `match_id` and `box_id` | Mapped (`match_id = 12, box_id = 30`) | **MATCH** |

---

### 7. Part Stock Validation

Part Stock for Part 1825 (`D16.064.34.0.PR`) was checked before and after the workflow:
- **Starting Stock:** FG Stock = 25, Box Stock = 5, Inv Stock = 30
- **Ending Stock:** FG Stock = 25, Box Stock = 5, Inv Stock = 30
- **Formula Verification:** In the legacy formula, stock accounts for `pending` status records. When a packing item moves into a box and box moves into an invoice, the transitions across `packing.status` and `box_packing.status` preserve live inventory balance accurately.

---

### 8. Fresh Screenshot Evidence

All 18 fresh retest screenshots were captured at `1366x850` resolution and saved in [`docs/screenshots/retest/`](file:///d:/ERP_System/docs/screenshots/retest/):

1. [`01_retest_admin_dashboard.png`](file:///d:/ERP_System/docs/screenshots/retest/01_retest_admin_dashboard.png) — Admin Dashboard with system KPIs
2. [`02_retest_part_master.png`](file:///d:/ERP_System/docs/screenshots/retest/02_retest_part_master.png) — Part Master filtered to `D16.064.34.0.PR`
3. [`03_retest_part_stock.png`](file:///d:/ERP_System/docs/screenshots/retest/03_retest_part_stock.png) — Part Stock starting balance
4. [`04_retest_packing_creation.png`](file:///d:/ERP_System/docs/screenshots/retest/04_retest_packing_creation.png) — Create Packing modal dialog (Qty: 5)
5. [`05_retest_packing_barcode.png`](file:///d:/ERP_System/docs/screenshots/retest/05_retest_packing_barcode.png) — Generated packing label preview
6. [`06_retest_view_packing.png`](file:///d:/ERP_System/docs/screenshots/retest/06_retest_view_packing.png) — View Packing table showing fresh record
7. [`07_retest_create_box.png`](file:///d:/ERP_System/docs/screenshots/retest/07_retest_create_box.png) — Create Box interface
8. [`08_retest_empty_box_rejected.png`](file:///d:/ERP_System/docs/screenshots/retest/08_retest_empty_box_rejected.png) — Empty Box Lock rejection alert
9. [`09_retest_box_after_packing.png`](file:///d:/ERP_System/docs/screenshots/retest/09_retest_box_after_packing.png) — Scanned packing in box (Qty: 5)
10. [`10_retest_box_after_lock.png`](file:///d:/ERP_System/docs/screenshots/retest/10_retest_box_after_lock.png) — Locked box with retained Qty: 5
11. [`11_retest_create_invoice.png`](file:///d:/ERP_System/docs/screenshots/retest/11_retest_create_invoice.png) — Create Invoice dialog (Qty: 5)
12. [`12_retest_add_box_invoice.png`](file:///d:/ERP_System/docs/screenshots/retest/12_retest_add_box_invoice.png) — Add Box to Invoice scanning screen
13. [`13_retest_invoice_matched.png`](file:///d:/ERP_System/docs/screenshots/retest/13_retest_invoice_matched.png) — Invoice 5 / 5 Matched state
14. [`14_retest_invoice_locked.png`](file:///d:/ERP_System/docs/screenshots/retest/14_retest_invoice_locked.png) — Locked Invoice screen
15. [`15_retest_gate_verify.png`](file:///d:/ERP_System/docs/screenshots/retest/15_retest_gate_verify.png) — Gate Invoice Verification scanner input
16. [`16_retest_gate_scan.png`](file:///d:/ERP_System/docs/screenshots/retest/16_retest_gate_scan.png) — Physical Box Scan screen
17. [`17_retest_gate_clearance.png`](file:///d:/ERP_System/docs/screenshots/retest/17_retest_gate_clearance.png) — Gate Clearance modal
18. [`18_retest_gate_out_report.png`](file:///d:/ERP_System/docs/screenshots/retest/18_retest_gate_out_report.png) — Gate-Out Report showing verified dispatch

---

### 9. Resolution of Limitations & Final Pre-Manual-Testing Status

In the subsequent pre-manual-testing regression phase, the previously noted limitations were fully addressed and verified via automated test suites:

1. **Multi-Product & Multi-Box Workflows:** **VERIFIED (PASS)** via `backend/run_multi_product_regression.js`. Tested Part 1 (`436330`) with multiple packing items per box, Part 2754 (`0904AP200010N`) with multiple boxes per invoice, and cross-part mismatch rejections.
2. **Bulk Packing Module:** **VERIFIED (PASS)** via `backend/run_bulk_packing_regression.js`. Tested sequential barcode generation (`100000+count`), input validation, and list persistence.
3. **Reverse / Return Logistics:** **VERIFIED (PASS)** via `backend/run_return_regression.js`. Tested invoice return rollback, status revert to `pending`, and scan cleanup.
4. **Stock & Inventory Invariants:** **VERIFIED (PASS)** via `backend/run_stock_regression.js`. Tested FG, Box, and Inv stock transitions across all stages.
5. **Physical Hardware Scanner & Thermal Printer:** Software/HID readiness verified; final hardware verification documented in [`docs/MANUAL_TEST_EXECUTION_CHECKLIST.md`](file:///d:/ERP_System/docs/MANUAL_TEST_EXECUTION_CHECKLIST.md) for human testing.

See [`docs/FULL_REGRESSION_TEST_REPORT.md`](file:///d:/ERP_System/docs/FULL_REGRESSION_TEST_REPORT.md) for comprehensive evidence.
