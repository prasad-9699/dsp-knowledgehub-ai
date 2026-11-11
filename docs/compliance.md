# Compliance Considerations

> **IMPORTANT**: This document does NOT constitute legal or regulatory advice. It is a technical reference for DSP's compliance and legal teams to review.

## Regulatory Framework

The following regulations may be applicable to this platform's deployment:

### SEBI Regulations
- **SEBI (Investment Advisers) Regulations, 2013**: If the platform provides investment advice (as defined by SEBI), registration requirements may apply.
- **SEBI (Research Analysts) Regulations, 2014**: If research reports are generated and distributed, RA registration may be required.
- **SEBI (Portfolio Managers) Regulations, 2020**: Portfolio management activities are subject to PM registration.
- **SEBI (Mutual Funds) Regulations, 1996**: If DSP mutual fund products are recommended.
- **SEBI Master Circulars**: Current master circulars on technology risk management, cyber security, and algorithmic trading.

### Data Licensing Requirements
- NSE and BSE market data usage is subject to their respective data sharing policies.
- Redistribution of exchange data requires explicit authorization.
- The platform must comply with data vendor licensing terms.

### Technology Risk Management
- SEBI Circular on Technology Risk Management Framework.
- Data classification and protection requirements.
- Business continuity and disaster recovery.

## Platform Boundaries

### What This Platform IS
- An internal decision-support and research tool
- A portfolio analytics and risk analysis system
- An ML-based quantitative signal generator
- A document retrieval and research assistant

### What This Platform IS NOT
- An autonomous trading system
- A direct investment advisory service (unless properly registered)
- A client-facing financial planning tool (without compliance review)
- A guaranteed return predictor

## Key Controls Required Before Production

1. **Suitability Assessment Methodology**: The risk assessment questionnaire and suitability mapping must be reviewed and approved by DSP's compliance team.

2. **Disclosure Requirements**: All client-facing outputs must include appropriate disclaimers as required by SEBI.

3. **Research Output Classification**: Determine whether model outputs constitute "research" under SEBI (Research Analysts) Regulations.

4. **Data Retention**: Implement data retention policies consistent with SEBI requirements (typically 5-10 years for records).

5. **Audit Trail**: All investment-related recommendations and portfolio modifications must be logged and retrievable.

6. **Human Approval**: No automated portfolio rebalancing without human approval and oversight.

7. **Model Governance**: Model validation, approval, and monitoring processes must be documented and followed.

8. **Client Data Protection**: Personal financial data must be handled per applicable privacy requirements.

9. **Access Control**: Role-based access must be enforced, with periodic access reviews.

10. **Incident Response**: Procedures for handling data breaches, system failures, and model errors.

## Disclaimers Required

Every client-facing output should include:
- "Model estimates are not guaranteed outcomes"
- "Past performance is not indicative of future results"
- "Investment decisions should be made after consulting qualified advisors"
- Data source and timestamp attribution
- Model version and last training date

## Review Process

Before production deployment:
- [ ] Legal team review of all disclaimers and disclosures
- [ ] Compliance team review of suitability methodology
- [ ] Compliance team review of research output classification
- [ ] Data licensing agreements validated
- [ ] Security audit completed
- [ ] SEBI circular compliance checklist completed
- [ ] Internal audit team review
- [ ] Data protection impact assessment

---

*This document was generated as part of the platform scaffold. It must be reviewed, updated, and approved by DSP's compliance and legal teams before production deployment.*
