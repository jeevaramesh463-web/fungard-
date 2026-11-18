# Proposed solution and innovation

FundGuard is a local web application for recording transactions and triaging risk. A user enters transaction context; the Express service compares it with configurable limits and the user's recent history. It stores a risk score, status, and reasons. Triggered events create persistent alerts and are broadcast to the owner and administrators through Socket.io. Admins can review, block, approve, or dismiss activity.

The project innovation is the combination of explainable scoring, user-visible context, editable rules, and a live review loop in an easy-to-run college demonstration. The application uses seeded synthetic data and simulates outbound email/SMS in the database and server log only.
