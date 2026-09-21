# MANUAL TEST EXECUTION CHECKLIST
## Manufacturing ERP 2.0 — Final User Acceptance Testing (UAT) Package

> **Instructions for Tester:**  
> This checklist contains 20 organized test categories designed for manual execution in your browser (`http://localhost:3000`) and with your physical scanning hardware.  
> The **Pass/Fail** columns are deliberately left blank for your recording during test execution.  
> Capture screenshots where indicated for audit compliance.

---

### Test Credentials Reference

| Role | Email | Password | Allowed Access Modules |
|---|---|---|---|
| **Admin** | `admin@admin.com` | `admin` | Full System Access (Masters, Users, All Operations, Reports) |
| **Packing / DPR** | `dpr@talbros.com` | `dpr` | Part Master, Part Stock, Single Packing, Bulk Packing, View Packing |
| **Box / FGS** | `fgs@talbros.com` | `fgs` | Create Box, Add Packing to Box, View Box, Customer List (read-only) |
| **Invoice / Commercial** | `invoice@talbros.com` | `invoice` | Create Invoice, Add Box to Invoice, Lock Invoice |
| **Gate Security** | `gate@talbros.com` | `gate` | Verify Invoice, Scan Box Match, Return Invoice, Gate-Out Report |

---

## 1. Authentication

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **AUTH-01** | Any | Browser at `/login` | Enter valid email & password for `admin@admin.com` and submit | Redirects to Dashboard; displays Admin role header; session stored | | Yes | Verify JWT token stored in localStorage |
| **AUTH-02** | Any | Browser at `/login` | Enter incorrect password for `admin@admin.com` | Displays "Email and Password Invalid" error toast; does not log in | | No | Verify HTTP 401 response |
| **AUTH-03** | Any | Logged in as any role | Click "Logout" button in navigation bar | Session cleared; redirected to `/login`; protected routes inaccessible | | No | Test back-button protection |
| **AUTH-04** | Anon | Logged out | Attempt navigating directly to `/dashboard` or `/part_master` in address bar | Automatically redirected to `/login` | | No | Route guard validation |

---

## 2. Admin Module

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **ADM-01** | Admin | Logged in as Admin | Navigate to `/dashboard` | KPI summary cards display counts for Total Parts, Packings, Boxes, Invoices | | Yes | Compare counts against database |
| **ADM-02** | Admin | On Dashboard | Click each sidebar module link | Smooth navigation to all Master, Operational, and Report pages | | No | Verify sidebar highlights active page |

---

## 3. Part Master

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **PART-01** | Admin | On `/part_master` | Search for `D16.064.34.0.PR` in search bar | Table filters to show Part ID 1825, Description "S S JOINT" | | Yes | Check responsiveness of search |
| **PART-02** | Admin | On `/part_master` | Click "Add New Part", enter Part Number, Description, Qty, and save | New part record appears in table; persists in `parts` database table | | Yes | Test duplicate part rejection |
| **PART-03** | Admin | On `/part_master` | Test pagination controls at bottom of table | Correctly navigates pages; shows 50 records per page | | No | Test first, next, and last page |

---

## 4. Customer Master

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **CUST-01** | Admin | On `/customer` | View customer listing table | Displays active customers (e.g. Mahindra & Mahindra); search operational | | Yes | |
| **CUST-02** | Admin | On `/customer` | Click "Add Customer", fill form, and submit | New customer created; displays immediately in table | | Yes | |
| **CUST-03** | Admin | On `/customer` | Click "Edit" on an existing customer, change contact info, and save | Customer record updates without duplicating row | | No | |

---

## 5. User Management

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **USER-01** | Admin | On `/erp_users` | Review list of users | Displays 5 baseline users with roles (admin, dpr, fgs, commercial, gate) | | Yes | |
| **USER-02** | Admin | On `/erp_users` | Click "Add User", assign role `fgs`, fill credentials, save | New user created in `userinfo`; can authenticate with assigned role | | Yes | |
| **USER-03** | DPR / FGS | Logged in as non-admin | Attempt navigating directly to `/erp_users` | "Access Denied" screen rendered; admin user table not exposed | | Yes | Security RBAC check |

---

## 6. Part Stock

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **STK-01** | DPR / Admin | On `/part_stock` | Search for Part `D16.064.34.0.PR` | Shows FG Stock, Box Stock, and Invoice Stock values | | Yes | Verify values match database queries |
| **STK-02** | DPR / Admin | On `/part_stock` | Search across multiple parts (e.g. `436330`, `0904AP200010N`) | Real-time calculation aggregates pending records accurately | | No | |

---

## 7. Packing (Single)

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **PACK-01** | DPR | On `/create_packing` | Select Part `D16.064.34.0.PR`, enter Qty `5`, select Shift `A`, submit | Success toast; generated barcode in `100000+` series; printable label view shown | | Yes | Check barcode label format |
| **PACK-02** | DPR | On `/create_packing` | Leave quantity field blank and submit | Validation error: "Please enter a valid quantity" | | No | |
| **PACK-03** | DPR | On `/view_packing` | Locate newly created packing record | Row appears with status `pending`; barcode visible and clickable | | No | |

---

## 8. Bulk Packing

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **BULK-01** | DPR | On `/create_packing_bulk` | Select Part, enter Part Qty `10`, Packing Bulk Qty `3`, submit | 3 sequential packing barcodes created in `100000+` series; printable sheet preview | | Yes | Record all 3 generated barcodes |
| **BULK-02** | DPR | On `/create_packing_bulk` | Enter Bulk Qty `0` or negative number | Validation error preventing submission; no database insert | | No | |

---

## 9. Box / FGS

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **BOX-01** | FGS | On `/create_box` | Select Part Number, Customer, Box Size, submit | New Box created with `200000+` barcode; redirected to Add Packing screen | | Yes | |
| **BOX-02** | FGS | On `/add_packing_to_box/:id` | Click "Lock Box" before scanning any packing items | Blocked: "Error: Cannot lock an empty box! Please scan packing items first." | | Yes | Empty box lock rejection |
| **BOX-03** | FGS | On `/add_packing_to_box/:id` | Scan packing barcode created in PACK-01 | Item added to box table; quantity updates; barcode marked `used` in packing table | | Yes | Check real-time table update |
| **BOX-04** | FGS | On `/add_packing_to_box/:id` | Attempt to scan same packing barcode again | Rejection: "Packing barcode not found or already used" | | No | Duplicate prevention |
| **BOX-05** | FGS | On `/add_packing_to_box/:id` | Click "Lock Box" with items present | Box locked successfully; lock badge displays "LOCKED" (green); further edits disabled | | Yes | Check box quantity persists |

---

## 10. Invoice / Commercial

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **INV-01** | Commercial | On `/create_invoice` | Enter Invoice Number, select Part, enter Target Qty `5`, submit | Invoice created with `300000+` barcode; redirected to Add Box screen | | Yes | |
| **INV-02** | Commercial | On `/add_box_to_invoice/:id` | Scan box barcode from BOX-05 | Box added; progress bar reflects 5/5; box status becomes `used` in `box` table | | Yes | |
| **INV-03** | Commercial | On `/add_box_to_invoice/:id` | Scan box belonging to different part | Rejection: "Error 405 : Packing Part Number Mismatch Please Try Again" | | Yes | Cross-part rejection |
| **INV-04** | Commercial | On `/add_box_to_invoice/:id` | Attempt scanning another box that exceeds invoice quantity | Rejection: "Error 406 : Part Qty Mismatch, adding this box exceeds invoice quantity" | | No | Target quantity overflow guard |
| **INV-05** | Commercial | On `/add_box_to_invoice/:id` | Click "Lock Invoice" when target quantity is met | Invoice locks; status badge shows "LOCKED"; ready for gate security | | Yes | |

---

## 11. Gate Security

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **GATE-01** | Gate | On `/verify_invoice` | Scan or enter locked invoice barcode | Invoice verified; verification session created (`invoice_match`); navigates to detail | | Yes | |
| **GATE-02** | Gate | On `/add_box_to_invoice_verify/:id` | Scan invalid box barcode not in invoice | Rejection: "Error : Box barcode not found in this invoice !!!!" | | No | |
| **GATE-03** | Gate | On `/add_box_to_invoice_verify/:id` | Scan legitimate physical box barcode | Box matched; scanned count increments (1/1); Gate Clearance Code generated | | Yes | Check formula `${inv}4000${match.id}` |
| **GATE-04** | Gate | On `/add_box_to_invoice_verify/:id` | Scan same box barcode a second time | Rejection: "Error : Box barcode already scanned for this invoice" | | No | Duplicate scan prevention |

---

## 12. Return / Cancellation Workflow

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **RET-01** | Gate | In gate verification session | Click "Return Invoice" button | Confirmation prompt; session cancelled; `invoice.status` reverts to `pending` | | Yes | Check stock restoration in STK-01 |
| **RET-02** | Commercial | After return executed | View returned invoice in Invoice module | Invoice visible as pending again; can be re-verified or modified | | No | |

---

## 13. Reports

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **REP-01** | Gate / Admin | On `/gate_out_report` | Load report page | Displays table of cleared dispatches with Date, Invoice No, Gate Clearance Code | | Yes | Verify clearance code parity |
| **REP-02** | Gate / Admin | On `/gate_out_report` | Use Date Range filter (From Date / To Date) | Table filters to show records within specified date window | | No | |
| **REP-03** | Gate / Admin | On `/gate_out_report` | Click "Print Report" | Clean printable stylesheet renders without headers/sidebars | | Yes | Test browser print dialog |

---

## 14. Search / Filters

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **SRCH-01** | Any | On `/part_master` | Enter partial part number (e.g. `1825` or `JOINT`) | Table dynamically filters rows matching substring | | No | |
| **SRCH-02** | Any | On `/view_packing` | Enter barcode in search field | Table isolates matching packing ticket instantly | | No | |
| **SRCH-03** | Any | On `/view_box` | Filter by Customer | Displays only boxes associated with selected customer | | No | |

---

## 15. Barcode Printing

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **PRNT-01** | DPR | On `/view_packing_by_id/:id` | Click "Print Barcode Label" | Label modal opens with rendered 1D barcode, Part No, Description, Qty, Date | | Yes | Check alignment |
| **PRNT-02** | FGS | On `/view_box` | Click "Print Box Label" | Box label renders with Box Barcode, Box Name, Customer Name, Total Qty | | Yes | |
| **PRNT-03** | Hardware | Printer connected | Send print job to physical thermal sticker printer | Barcode prints clearly; lines are sharp; scannable with physical scanner | | Yes | **Hardware Test** |

---

## 16. Scanner Testing (USB HID Scanner Readiness)

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **SCAN-01** | Hardware | On `/add_packing_to_box/:id` with USB Scanner connected | Scan printed packing barcode label | Barcode input receives string instantly; trailing Enter triggers submission | | Yes | **Hardware Test** |
| **SCAN-02** | Hardware | On `/add_box_to_invoice/:id` with USB Scanner connected | Scan printed box barcode label | Box scanned; input field clears automatically; progress updates | | Yes | **Hardware Test** |
| **SCAN-03** | Hardware | On `/add_box_to_invoice_verify/:id` with USB Scanner connected | Scan box barcode at gate | Scanned box accepted immediately; no manual mouse click needed | | Yes | **Hardware Test** |
| **SCAN-04** | Hardware | Rapid scanning | Scan 2 barcodes in rapid succession (< 500ms) | Both scans processed in order without dropped keystrokes or UI freeze | | No | **Hardware Test** |

---

## 17. Negative Scenarios

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **NEG-01** | FGS | On `/add_packing_to_box/:id` | Scan packing barcode for different part | Rejection: "Error : Part Id Not Matched !!!!" | | Yes | |
| **NEG-02** | FGS | On `/add_packing_to_box/:id` | Attempt scanning packing item while box is locked | Rejection: "Error: Box is already locked" | | No | |
| **NEG-03** | Commercial | On `/add_box_to_invoice/:id` | Scan box that is already mapped to another invoice | Rejection: "Error : Box barcode not found or already used in another invoice !!!!" | | Yes | |
| **NEG-04** | Commercial | On `/add_box_to_invoice/:id` | Attempt scanning box while invoice is locked | Rejection: "Error: Invoice is already locked" | | No | |

---

## 18. Cross-Role Workflow

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **XROL-01** | All | Multi-tab / Multi-user | Login as DPR in Tab 1, FGS in Tab 2, Commercial in Tab 3, Gate in Tab 4 | Each tab retains role-specific access; operations hand off seamlessly | | Yes | |
| **XROL-02** | DPR | Logged in as DPR | Attempt visiting `/verify_invoice` | "Access Denied" page; cannot perform security duties | | No | |

---

## 19. Browser Refresh / Session Behavior

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **SESS-01** | Any | Mid-operation on `/add_packing_to_box/:id` | Press F5 (Browser Page Refresh) | Page reloads; authenticated session retained; scanned items still visible | | No | State persistence check |
| **SESS-02** | Any | Logged in | Close browser tab and re-open `http://localhost:3000` | Automatically logs in from valid session token; directs to Dashboard | | No | Token persistence check |

---

## 20. Final End-to-End Business Scenario

| Test ID | Role | Precondition | Action | Expected Result | Pass/Fail | Screenshot Required | Notes |
|---|---|---|---|---|---|---|---|
| **E2E-FINAL** | Multi-Role | Fresh Test Batch | Execute full lifecycle: Part Selection -> Packing -> Box Packing -> Box Lock -> Invoice Creation -> Box Mapping -> Invoice Lock -> Gate Verification -> Physical Box Scan -> Clearance -> Gate-Out Report | Entire shipment clears gate; clearance code generated and verified in Gate-Out Report; stock balances out cleanly | | Yes | Record all transaction IDs |
