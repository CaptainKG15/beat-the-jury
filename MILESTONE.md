# Milestone: Beat the Jury version 2

## Why
The accepted project (version 1) has two documented problems:

- **Long pages did not settle on Bradbury.** A long Wikipedia article failed three times (one VALIDATORS TIMEOUT confirmed on the explorer), while short pages settled. The cause is not confirmed.
- **The leaderboard could be farmed.** Anyone could run solo rounds on easy claims. A steward flagged jury-integrity limits; this was one of the limits listed in the README.

Both are recorded in `tests/attacks/RESULTS.md`.

## What changed
1. **Plain HTTP fetch with a browser fallback** (`fetch_text`, `html_to_text`). Faster on static pages. If it fails, the contract uses the version 1 fetch, so the worst case is the old behaviour.
2. **Practice rounds.** A round credits the leaderboard only if two or more players revealed. One-player rounds still settle and still count in the jury record.
3. **A smaller contract.** 11,374 bytes against version 1's 11,707, to stay under the size Bradbury accepted (a 17,538-byte version was refused with "gas limit too high").

## What was tested
- 103 off-chain checks (`python3 tests/test_logic.py`), including every fetch fallback, hostile text arriving through the plain fetch, and the leaderboard rules with one, two and three players.
- Page and contract agree on scoring and the commit hash (`node tests/frontend_parity.test.js`, both pages).

## What happened on-chain (see tests/attacks/RESULTS.md, Version 2 section)
- Studio `0x9fA94524ba035f85678f1c6c8fdaC338e2B3a575`: the long Solana article settled first try (yes, unanimous). It never settled on version 1 on Studio (voided twice).
- Bradbury `0x43ea4820b17FaF39Bdd9D03F070D5De8ec137D57`: the same article hit one LEADER TIMEOUT, then settled on a single retry in about 1 minute. Version 1 failed three times on it. A short ambiguous page settled first try in about 1 minute 30 seconds.
- Both Bradbury rounds were practice rounds: they settled and counted in the jury record, and the leaderboard stayed empty, as designed.

## What is not claimed
The long-page problem is improved, not fixed: one timeout still happened, its cause is unknown, and it is unknown whether the plain fetch or the browser fallback ran. Three runs are not a statistic. A two-player round, a hostile page and an unreadable page have not yet been run on version 2 on-chain (they are covered by the off-chain tests). The jury gave a different verdict on the same ambiguous page than version 1 did, one run each, which says more about jury variance than about the code.

## Honest limits that remain
Jurors are one correlated model call; one person with two accounts can still farm the leaderboard; creators pick claims; hostile pages face only a pattern check. See the README trust model.
