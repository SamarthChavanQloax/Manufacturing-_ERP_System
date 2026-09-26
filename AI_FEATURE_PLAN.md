# Comprehensive AI Feature Implementation Plan

This document outlines the scope, requirements, and technical details for adding a complete suite of AI-powered features to the Barcode Stock Management ERP System. The features are divided into **Operational Efficiency** (making work easier) and **Security** (protecting the factory).

---

## PART 1: Operational Efficiency (Making Work Easier)

### 1. Predictive Stock Demand Forecasting
*   **Goal:** Proactively alert the factory when a part is going to run out of stock based on historical demand, so the factory can manufacture ahead of time.
*   **How it Works:** 
    *   The backend analyzes the last 90 days of invoices to calculate the "Trend-Weighted Moving Average" (average daily consumption + upward/downward trends).
    *   It projects demand for the next 30 days and compares it against current stock (adding a 15% safety buffer).
*   **UI Delivery:** A new "Smart Insights" dashboard showing "Critical" alerts for parts that will run out in less than 7 days, complete with a "Download Production Plan" PDF export for the factory floor.
*   **Access:** Restricted to `admin` only.

### 2. "Ask ERP" Natural Language Assistant (NLP)
*   **Goal:** Allow managers to query the database using simple English instead of navigating complex menus and date filters.
*   **How it Works:** 
    *   A search bar at the top of the dashboard where users can type: *"How many boxes of part SJOINT were sent yesterday?"*
    *   An NLP engine translates this text into an SQL query, returning an instant, formatted answer.
*   **UI Delivery:** A persistent AI search bar in the main navigation header.
*   **Access:** `admin` and `master`.

### 3. Smart Bulk-Packing Assistant (Computer Vision OCR)
*   **Goal:** Eliminate manual typing or single-scanning when creating bulk packings.
*   **How it Works:** 
    *   The web browser accesses the device's camera (webcam or mobile phone).
    *   AI Optical Character Recognition (OCR) scans the video feed, detecting and reading up to 20 printed barcodes simultaneously in a single frame, and instantly adds them all to the bulk list.
*   **UI Delivery:** A "Use Camera (AI Scan)" button inside the Bulk Packing page.
*   **Access:** `packing` and `admin`.

---

## PART 2: Security & Anti-Fraud (Protecting the Factory)

### 4. Gate Clearance Fraud Detection (Anomaly Detection)
*   **Goal:** Prevent unauthorized removal of goods by detecting suspicious invoice scanning behavior at the factory gate.
*   **How it Works:** 
    *   Background AI analyzes the context of every gate scan.
    *   It flags "Anomalies", such as: scanning an invoice at 3:00 AM, scanning a box that was packed only 2 minutes prior, or clearing a massive quantity that vastly exceeds a customer's historical average.
*   **UI Delivery:** Transactions are blocked and flagged in RED on the Gate screen, requiring a 4-digit Admin override PIN to proceed.
*   **Access:** Runs silently in the background on the `gate` role; alerts are shown to `admin`.

### 5. Biometric "Proof of Scan" (Face ID)
*   **Goal:** Prevent employees from sharing their login passwords to fraudulently clear goods at the gate.
*   **How it Works:** 
    *   When a high-value invoice is being verified at the gate, the system requires a quick webcam snapshot.
    *   Facial recognition AI matches the face in the camera to the registered security guard's profile to prove they are physically present.
*   **UI Delivery:** A quick camera popup when clicking "Verify Invoice" on high-value orders.
*   **Access:** Triggers for the `gate` role.

### 6. AI Audit Log Summarization
*   **Goal:** Make sense of thousands of rows of system audit logs to detect insider threats.
*   **How it Works:** 
    *   An automated script runs every evening at midnight.
    *   It analyzes all user actions (deletions, modifications) and generates a human-readable summary, explicitly highlighting suspicious deviations (e.g., *"User Packing1 deleted 5 packings today, which is highly unusual"*).
*   **UI Delivery:** A "Daily Security Briefing" card on the Admin Dashboard.
*   **Access:** `admin` only.

---

## Implementation Roadmap (Development Steps)

If approved, development will proceed in the following order, focusing on the highest-value features first:

1.  **Phase 1: Predictive Stock Demand** (Backend math, new Smart Insights UI, PDF export).
2.  **Phase 2: "Ask ERP" NLP Assistant** (Integrating the natural language parser and search bar UI).
3.  **Phase 3: AI Audit Log Summarization** (Nightly cron job and dashboard alert cards).
4.  **Phase 4: Gate Security Upgrades** (Anomaly detection rules and Face ID popup).
5.  **Phase 5: Computer Vision Bulk Packing** (Camera integration and OCR processing).
