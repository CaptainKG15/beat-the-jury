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

## What is not yet known
Whether the plain fetch works on the live network and whether it fixes the long-page settles. The plan and the results are in `STUDIO_TEST_V2.md` and `tests/attacks/RESULTS.md`. If the plain fetch does not help, that will be recorded as it is.

## Honest limits that remain
Jurors are one correlated model call; one person with two accounts can still farm the leaderboard; creators pick claims; hostile pages face only a pattern check. See the README trust model.
