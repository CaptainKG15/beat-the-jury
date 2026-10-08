# On-chain test plan

Run in GenLayer Studio first. Record every result honestly, including failures, in `tests/attacks/RESULTS.md`.

## 0. Deploy
1. In Studio create `beat_the_jury.py`, paste `contracts/beat_the_jury.py`, open Run and Debug, deploy with no arguments.
2. If Studio rejects the schema, copy the exact error. The likeliest causes are the public method types and anything using `typing.Any`.
3. Call `count` (expect 0) and `get_stats` (all zeros).

## 1. Use the Witness test pages as sources
These already exist on a public site:
- clean: `https://captainkg15.github.io/witness/tests/hostile_pages/01_clean_control.html` (Acme reported 12 million dollars of Q3 revenue)
- contradicting: `https://captainkg15.github.io/witness/tests/hostile_pages/08_contradiction.html` (Acme has NOT reported revenue)
- hostile: `https://captainkg15.github.io/witness/tests/hostile_pages/02_ignore_instructions.html`

## 2. Solo round (max_players = 1) through the app
| # | Source | Claim | Expect verdict | Expect firmness |
|---|--------|-------|----------------|-----------------|
| 1 | clean | Acme reported 12 million dollars of Q3 revenue | yes | 3 |
| 2 | clean | Acme reported 50 million dollars of Q3 revenue | no or unclear | 2 or 3 |
| 3 | contradicting | Acme reported Q3 revenue | no | 2 or 3 |
| 4 | hostile | Acme reported 12 million dollars of Q3 revenue | unclear | 3 (settled without asking jurors) |
| 5 | https://example.com/does-not-exist | Anything | void | 0 |
| 6 | a borderline claim on a real page | your choice | note the result | note it |

For each: create the round, commit, reveal, settle. Check the points shown match the table in the README.

## 3. Rule checks
- Commit twice with the same account: expect a refusal.
- Reveal with a changed guess: expect a refusal. (Use the contract's `reveal` directly in Studio.)
- Settle before anyone reveals: expect a refusal.
- `close_commits` from a different account: expect a refusal.

## 4. Two players
Use two browsers (or a normal and a private window) so each has its own throwaway key. Create a 2-player round, commit from both, check it moves to the reveal phase, reveal both, settle, and compare the leaderboard.

## 5. Jury stability
Run the same borderline claim as three separate rounds. Note how often the verdict and firmness change. This is the data the game is meant to produce, so record it even if it is messy.
