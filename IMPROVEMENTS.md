# Improvements Applied (Round 2)

This version incorporates the detailed code-review findings.

## P0 — Security
- Webhook endpoint restricted to https + allowlist (Slack, Discord, Telegram, IFTTT) — SSRF mitigated.
- Sensitive endpoints (`/api/supervisor/evaluate`, telegram, webhook) require local origin or `TERMINAL_API_SECRET`.
- Approval gate fails closed: signed-in user with no profile after load sees a blocked screen instead of the terminal.
- Rate limiting retained (30 req / 10s per IP).

## P1 — Honesty
- Removed TimescaleDB and LightGBM claims from metadata.json, LoginScreen, AutonomousSupervisorModal, and UltraShortOptionsRadarView.
- Supervisor fallback no longer claims LightGBM or a calibrated win rate.
- Gemini model names corrected to gemini-2.5-flash / gemini-2.5-pro.
- Compliance disclaimer banner added: “Scores are setup strength, not calibrated win rates • Not investment advice”.
- PAXG labeled as gold proxy.
- Health endpoint key check tightened.

## P2 — Correctness
- `checkDuplicateGuard` now called inside `deployDirectionalTest`.
- Binary tests accept and store real `assetClass`.
- `isLiveConnected` initializes to `false`.
- `dataQuality` field and reduced confidence inflation retained from prior round.

## Validation
Run `/tmp/validate_fixes.sh` or inspect the grep results in the session log.
