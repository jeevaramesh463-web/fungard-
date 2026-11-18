# Literature survey and research gap

## Existing approaches

1. **Rule-based transaction monitoring:** banks and payment platforms commonly combine amount, velocity, location, and account-risk rules. It is interpretable and useful for immediate controls, but fixed rules can create false positives and need ongoing calibration.
2. **Supervised fraud classification:** models such as logistic regression, random forests, and gradient-boosted trees learn patterns from labeled transaction histories. They can combine many signals but require representative, privacy-protected labels and monitoring for drift.
3. **Unsupervised anomaly detection:** methods such as Isolation Forest and clustering can surface activity unlike a customer's baseline without requiring labeled fraud examples. Their outlier scores still need human interpretation.
4. **Graph-based analysis:** relationships among accounts, devices, merchants, and transfers reveal coordinated patterns that per-transaction checks may miss. Graph data and reliable identity resolution are operationally demanding.
5. **Human-in-the-loop case management:** review queues let investigators approve, block, or dismiss alerts, improving handling and offering feedback for future tuning. Poorly explained alerts can still slow review.

## Research gap

Many educational examples either demonstrate detection without a usable alert workflow, or demonstrate transaction dashboards without explaining decisions. FundGuard bridges that gap in a local, reproducible prototype: transparent rules, configurable thresholds, role-based review, and live notifications are shown together. The prototype is not a production fraud decision system and does not claim model-level accuracy.
