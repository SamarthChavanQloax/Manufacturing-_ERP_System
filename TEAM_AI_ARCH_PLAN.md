# 🧠 AI System Architecture & Implementation Plan

**Objective:** Transform the ERP from a manual record-keeping system into an intelligent platform. The goal is not "AI for AI's sake," but to directly solve business problems: prevent stock-outs, detect fraud, and eliminate slow manual investigations.

Our AI approach will not blindly override the existing ERP's Gate rules or authorization. Instead, the AI acts as an intelligence layer that detects risk, explains reasons, and requires Human/Admin review where necessary, keeping the original workflow intact.

---

## 🏗️ Final Architecture

Instead of adding disconnected features to the UI, we are building three major AI systems:

```text
                 MANUFACTURING ERP
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   OPERATIONS        SECURITY          AUDIT
   INTELLIGENCE      INTELLIGENCE      INTELLIGENCE
        │               │                │
        │               │                │
   Stock Forecast   Anomaly AI       Audit AI
   Ask ERP          Gate Risk        Investigation
   Process AI       Barcode Risk     Evidence Chain
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                 AI EXPLAINABILITY
                        │
                        ▼
                  HUMAN REVIEW
                        │
                        ▼
                 EXISTING ERP API
                        │
                        ▼
                     MySQL
```

---

## 1. ⚙️ AI SYSTEM 1 — Operations Intelligence
**Purpose:** Help people work faster and plan better.

### A. AI Stock Intelligence & Demand Forecasting
*   **Problem:** The ERP tracks current stock, but doesn't answer "What will happen to this stock next week?"
*   **AI Solution:** `Historical invoices + Recent consumption + Trend + Current stock = Demand Forecast`.
*   **Business Value:** AI detects likely shortages in advance, giving Admins time to adjust production planning and inventory management.
*   **Output:** Smart Stock Insights showing Stock-out risk, Forecasted demand, Expected depletion date, and Predicted shortage.

### B. Ask ERP AI Assistant
*   **Problem:** Navigating multiple screens (Part Master, Stock, Packing, Invoice) takes time.
*   **AI Solution:** A natural language search bar. E.g., *"How many boxes of SJOINT were dispatched yesterday?"* or *"Which invoices are waiting for box mapping?"*
*   **Business Value:** Eliminates manual searching. **Note:** Must be role-aware (Packing role only sees packing info, Admin sees everything).

### C. AI Process Monitor
*   **Problem:** Process deviations and operational mistakes.
*   **AI Solution:** ERP has a defined sequence (Packing → Box → Invoice → Gate). AI flags anomalies, such as an Invoice created but Box created later, or Packing bypassing Box to Gate.

---

## 2. 🛡️ AI SYSTEM 2 — Security Intelligence
**Purpose:** Detect suspicious behavior and abnormal transactions. This is the centerpiece of the AI expansion.

### A. AI Security & Anomaly Detection
*   **Problem:** Traditional validation checks "Wrong barcode." It doesn't check *"Why did this user scan 70 boxes in 3 minutes?"*
*   **AI Solution:** AI learns normal activity patterns and assigns Risk Scores to abnormal behavior (e.g., highly unusual login times, massive failed scan attempts).
*   **Business Value:** Detects compromised accounts and insider fraud.

### B. AI Gate Risk Analysis
*   **Problem:** An invoice, box, and part can match perfectly, but the overall dispatch might still be highly suspicious.
*   **AI Solution:** AI analyzes Invoice quantity, Customer history, Time of scan, and User behavior to generate a **Gate Risk Score**.
*   **Output:** Detects suspicious dispatches before they leave the factory.

### C. AI Daily Security Briefing
*   **Problem:** Admins suffer from information overload looking at raw logs.
*   **AI Solution:** A daily summary explaining What happened → Why it matters → Evidence. E.g., *"🟠 4 abnormal barcode attempts. Invoice INV-10452 had 6 failed scans."*

---

## 3. 🔍 AI SYSTEM 3 — AI Audit & Investigation
**Purpose:** Explain what happened and why.

### A. AI Audit Investigator
*   **Problem:** Manually tracing an issue through Invoice, Box, Packing, and Gate records takes hours.
*   **AI Solution:** Admin asks *"Why was box 200123 dispatched yesterday?"* The AI instantly builds an evidence chain across all related tables.
*   **Output:** *"Box 200123 was packed at 10:12, mapped to INV-1042 at 11:03, verified at Gate at 11:24."*

---

## 📸 Optional / Advanced Systems

### AI Computer Vision Barcode Scanner
*   **Problem:** Scanning barcodes one by one is tedious.
*   **AI Solution:** Use camera feed to detect and decode multiple barcodes in a single frame, filtering duplicates automatically.

### Biometric Verification (Face ID)
*   **Problem:** Identity verification at high-risk Gate operations.
*   **AI Solution:** Webcam verification before dispatch. *(Note: High implementation burden due to privacy, consent, and fallback rules).*

---

## 🚦 Phased Rollout Priority (The Action Plan)

### 🔴 Must-Have (Phase 1)
1.  **AI Security/Anomaly Detection:** Solves fraud and compromised accounts.
2.  **AI Gate Risk Analysis:** Solves suspicious dispatches.
3.  **AI Stock Intelligence:** Solves stock-outs and poor planning.
4.  **AI Audit Investigator:** Solves slow manual investigations.

### 🟠 Strong Additions (Phase 2)
5.  **Ask ERP Assistant:** Solves manual searching and reporting.
6.  **AI Computer Vision Barcode:** Solves slow bulk barcode handling.

### 🟡 Advanced / Later (Phase 3)
7.  **Face ID / Biometric Security:** Solves identity spoofing but requires high compliance overhead.
