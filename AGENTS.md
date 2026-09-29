# Workspace AI Rules & Security Principles

## 🔐 AI Security & Control Principles

The AI layer must remain strictly separated from the ERP's core transaction authority.

### 1. Control Model

```text
User
 ↓
React ERP UI
 ↓
NestJS Authentication / RBAC
 ↓
Allowed ERP APIs / AI Tools
 ↓
AI Analysis
 ↓
Evidence + Explanation
 ↓
Human Review where required
 ↓
Existing ERP API
 ↓
MySQL
```

### 2. Read-Only Constraint by Default
- The AI is **never** given direct write or mutation access to the database (`MySQL`).
- Avoid: `LLM → direct MySQL write`
- Prefer: `LLM / AI → Approved read-only tool → NestJS service → MySQL`

### 3. Human Confirmation for State Changes
- For any state mutation, dispatch, clearance, or inventory adjustments triggered by AI findings:
  ```text
  AI Recommendation
        ↓
  Human Confirmation / Existing Authorization (Role-based)
        ↓
  Normal ERP API
        ↓
  Database Transaction
  ```
- No AI background routine or prompt execution may bypass the standard business validation, RBAC guards, or transactional integrity checks.

### 4. Mandatory AI Explainability Standard
Every AI alert, recommendation, or anomaly detection result must contain:
1. **What happened / Projected:** Event or prediction summary.
2. **Why was it detected:** Root cause analysis and trigger criteria.
3. **Evidence used:** Specific numbers, timestamps, transaction counts, and baseline comparisons.
4. **Risk / Confidence indication:** Quantifiable score (e.g. Risk score 0–100, Confidence %).
5. **Recommended human review:** Concrete next step for the human operator.

*Strict Rule:* Standalone or black-box risk tags (e.g. returning only `"HIGH RISK"` with zero supporting facts) are strictly prohibited.

