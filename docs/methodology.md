# Methodology

1. **Requirements:** identify users, administrators, transaction fields, alert conditions, and review actions from the Problem 29 statement.
2. **Design:** separate the React client, REST/Socket.io API, authorization middleware, detection service, and SQLite persistence.
3. **Implementation:** validate inputs; hash passwords; persist each transaction and its rule outcomes; emit alert events after saving.
4. **Demonstration:** seed synthetic users and 120 transactions, then use the simulation control to exercise live alerts.
5. **Evaluation:** verify role restrictions, risk/status assignment, persistence, transaction filtering/export, and alert delivery on a local machine.

The included implementation is a prototype. Evaluation uses synthetic records and rule outcomes, not real bank data or a claim of production-grade fraud prediction.
