# Current Process Flow (Easy View)

This document explains the current onboarding process using a simple flowchart and a relationship map between data points.

## 1) End-to-End Flow

```mermaid
flowchart TD
    A[Start Up<br/>Welcome + what will happen + docs checklist] --> B[Company Data (PJ)<br/>Legal representative name<br/>Company legal name<br/>Sector]
    B --> C[Corporate Document Ingestion<br/>Pre-message before upload<br/>Grouped sections: Required / Optional<br/>Upload + validation]
    C --> D[KYC - Legal Representative ID<br/>Upload ID copy<br/>Light verification animation]
    D --> E[AI Advisor<br/>Voice interview<br/>Risk/profile signals]
    E --> F[Portfolio Recommendation<br/>Accept recommendation]
    F --> G[SARLAFT Forms Package<br/>Review/edit forms<br/>Generate ZIP/PDF]
    G --> H[Send Documentation / Finalize]
```

## 2) Information Relationship Map

```mermaid
flowchart LR
    subgraph Intake
      I1[Representative Name]
      I2[Company Legal Name]
      I3[Sector]
    end

    subgraph Ingestion
      D1[RUT]
      D2[Chamber Certificate]
      D3[Optional Corporate Docs]
    end

    subgraph KYC
      K1[Representative ID File]
      K2[Verification Result]
    end

    subgraph Recommendation
      R1[Voice Interview Outputs]
      R2[Portfolio Proposal]
    end

    subgraph CompliancePackage[SARLAFT Package]
      F1[Form 1 - SAGRILAFT]
      F2[Form 2 - FATCA/CRS]
      F3[Form 3 - Vinculacion PJ]
    end

    I1 --> F2
    I1 --> F3
    I2 --> F1
    I2 --> F2
    I3 --> R1
    D1 --> F1
    D1 --> F2
    D2 --> F1
    D2 --> F3
    D3 --> F3
    K1 --> K2
    K2 --> F2
    K2 --> F3
    R1 --> R2
    R2 --> F3
```

## 3) Practical Mapping (What feeds what)

- `Company Data (PJ)` feeds base legal identity fields in the forms.
- `Corporate Ingestion` provides documentary evidence for company-level compliance fields.
- `KYC` validates who can legally act for the company (representative legal).
- `AI Advisor` produces profile/risk context used by portfolio recommendation.
- `Portfolio Acceptance` unlocks final compliance package review and export.

## 4) Why this map helps

- Makes the process easy to explain to business, product, and compliance teams.
- Shows where each piece of information enters the flow.
- Makes gaps visible (missing docs, missing KYC, missing form fields).
- Helps align demo flows and production flows with the same data relationships.

