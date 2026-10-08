# On-chain results (GenLayer Studio)

Contract: an earlier, longer version of `contracts/beat_the_jury.py` on GenLayer Studio (17,538 bytes, SHA-256 `36556f80d79aed08b86ee4a23dc36834b42dc283a1c545737be30305a30e8b88`). It has the same logic as the current file, with longer comments and slightly longer juror prompt wording. The current, compact file (11,622 bytes, SHA-256 `bb8c7ec416b714132eabd4839f0a3b8115bdce1f3d887b11d547b56f8baadb3b`) is the one deployed to Bradbury, because the longer one was refused there with "gas limit too high". The Studio rounds below were played through the web app in solo mode (1 player).
Only what was actually observed is listed. Failures and surprises belong here too.

| Round | Source | Claim | Guess | Verdict | Firmness | Points | Notes |
|-------|--------|-------|-------|---------|----------|--------|-------|
| 0 | `witness/tests/hostile_pages/01_clean_control.html` | Acme reported 12 million dollars of Q3 revenue | yes at 70% | yes | 3 (unanimous) | 316 | Matches the scoring table: (68600 - 5400) / 200 = 316. |
| 1 | en.wikipedia.org/wiki/Solana_(blockchain_platform) | Solana is the biggest crypto coin | yes at 90% | unclear | 2 (split 2 to 1) | 0 | A borderline claim. The jury split 2 to 1 and validators still reached consensus. The overconfident wrong guess scored the minimum, as the scoring rule intends. |
| 2 | `witness/tests/hostile_pages/02_ignore_instructions.html` | Acme reported 12 million dollars of Q3 revenue | yes at 90% | unclear | 3 (unanimous, inferred from the stats change) | 0 | The page says to ignore previous instructions. The verdict was unclear and the guess scored 0, so the injected instruction had no effect. |

After these three rounds the contract's jury-agreement record read: 2 unanimous, 1 split 2 to 1, 0 three-way splits, 0 void.

## Bradbury
The compact contract (11,622 bytes) was deployed to Bradbury at `0xcc1A40b32221F8588385C38b2cfcfE620515d7CF` and the deployment was accepted. No rounds have been played on Bradbury yet, so nothing in the table above was run there.

## Observations
- Round 2 was a hostile page. The contract's design settles such a page as `unclear` with firmness 3 without asking the jurors (checked in the off-chain tests). On-chain I observed the `unclear` verdict, the zero score, and the agreement record moving from 1 unanimous, 1 split to 2 unanimous, 1 split. I did not observe whether the jurors were consulted.
- The agreement bar briefly showed the old counts right after a settle and corrected itself on refresh. It is a display lag in the page, not a contract counter problem.
- The full commit, reveal and settle flow completed on real validators, including the custom leader and validator comparison.
- On the borderline claim the verdict was settled by a 2 to 1 majority. This is the behaviour the firmness tolerance is meant to allow.
- While the settle transaction was running, a separate read of the rounds list returned "An unknown RPC error occurred". It cleared on refresh. The page now shows a friendlier message in that case.

## Not yet run
- A false claim on a clean page
- A contradicting page (`08_contradiction.html`)
- An unreadable page, expected to void the round
- Multi-player rounds (two accounts), including a player who never reveals
- Rule refusals on the live contract: double commit, wrong reveal, early settle by a non-creator
- Any round played on Bradbury (the contract is deployed there but unplayed)
