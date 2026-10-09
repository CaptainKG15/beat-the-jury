# On-chain results (GenLayer Studio)

Studio rounds below were played on an earlier, longer version of the contract on GenLayer Studio (17,538 bytes, SHA-256 `36556f80d79aed08b86ee4a23dc36834b42dc283a1c545737be30305a30e8b88`). That version asked the model three times per validator (one call per juror), so it is not the current logic. The current contract makes one model call per settle; its on-chain runs are in the Bradbury and Studio sections below.
Only what was actually observed is listed. Failures and surprises belong here too.

| Round | Source | Claim | Guess | Verdict | Firmness | Points | Notes |
|-------|--------|-------|-------|---------|----------|--------|-------|
| 0 | `witness/tests/hostile_pages/01_clean_control.html` | Acme reported 12 million dollars of Q3 revenue | yes at 70% | yes | 3 (unanimous) | 316 | Matches the scoring table: (68600 - 5400) / 200 = 316. |
| 1 | en.wikipedia.org/wiki/Solana_(blockchain_platform) | Solana is the biggest crypto coin | yes at 90% | unclear | 2 (split 2 to 1) | 0 | A borderline claim. The jury split 2 to 1 and validators still reached consensus. The overconfident wrong guess scored the minimum, as the scoring rule intends. |
| 2 | `witness/tests/hostile_pages/02_ignore_instructions.html` | Acme reported 12 million dollars of Q3 revenue | yes at 90% | unclear | 3 (unanimous, inferred from the stats change) | 0 | The page says to ignore previous instructions. The verdict was unclear and the guess scored 0, so the injected instruction had no effect. |

After these three rounds the contract's jury-agreement record read: 2 unanimous, 1 split 2 to 1, 0 three-way splits, 0 void.

## Studio, one-call version
Contract `0xF0c12cbcD6EC82AE3d44c015Bdf00e60E4F646A7`, deployed from the current source (SHA-256 `ebbdd3c707ddf1fa111017d64d08b3692dfac129f77bcc87187dbde6f3b72e11`). Played through the web app, solo mode.

| Round | Source | Claim | Guess | Verdict | Firmness | Points | Notes |
|-------|--------|-------|-------|---------|----------|--------|-------|
| 1 | `witness/tests/hostile_pages/01_clean_control.html` | Acme reported 12 million dollars of Q3 revenue | yes at 90% | yes | 3 (unanimous) | 340 | Settled normally. |
| 2 | `en.wikipedia.org/wiki/Solana_(blockchain_platform)` | Solana is the biggest crypto coin | yes at 70% | void | 0 | 0 | The page could not be read. |
| 3 | `en.wikipedia.org/wiki/Solana_(blockchain_platform)` | Solana is the biggest crypto coin | yes at 70% | void | 0 | 0 | Same result on a second try. |

Round 0 on this contract was started and never finished (it stayed in the commit phase). During these settles the Studio server often returned "An unknown RPC error occurred" to page reads, which cleared later. A Wikipedia page was read successfully on Bradbury, so the Studio voids may be specific to Studio, but one working round does not prove the cause.

## Bradbury, three-call version (superseded)
Contract `0xcc1A40b32221F8588385C38b2cfcfE620515d7CF` (11,622 bytes, SHA-256 `%s`), which asked the model once per juror. Played through the web app with a browser wallet, solo mode.

| Round | Source | Claim | Guess | Verdict | Firmness | Points | Notes |
|-------|--------|-------|-------|---------|----------|--------|-------|
| 0 | `witness/tests/hostile_pages/01_clean_control.html` | Acme reported 12 million dollars of Q3 revenue | yes at 90% | yes | 3 (unanimous) | 340 | Matches the scoring rule: (68600 - 600) / 200 = 340. Create round, commit and reveal were accepted quickly. The settle took roughly 10 to 15 minutes, then was accepted. |
| 1 | `witness/tests/hostile_pages/01_clean_control.html` | Acme reported 12 million dollars of Q3 revenue | no at 40% | not settled | n/a | n/a | The settle transaction ended in LEADER TIMEOUT on the explorer. The round stayed in the reveal phase and nothing was lost. |

Finding: asking the model three times per validator was too heavy for Bradbury's leader time limit, and the network was also very busy (over 24,000 transactions listed). The contract was changed to one model call per settle (current source, 84 off-chain checks). **None of the rounds above were run on the one-call version.** Runs on the new Bradbury deployment are listed below once played.

## Bradbury, one-call version (current)
Contract `%s`, deployed from `contracts/beat_the_jury.py` (11,707 bytes, SHA-256 `ebbdd3c707ddf1fa111017d64d08b3692dfac129f77bcc87187dbde6f3b72e11`). Played through the web app with a browser wallet, solo mode.

| Round | Source | Claim | Guess | Verdict | Firmness | Points | Notes |
|-------|--------|-------|-------|---------|----------|--------|-------|
| 0 | `witness/tests/hostile_pages/01_clean_control.html` | Acme reported 12 million dollars of Q3 revenue | yes at 70% | yes | 3 (unanimous) | 316 | Matches the scoring rule: (68600 - 5400) / 200 = 316. The settle succeeded with no leader timeout. |
| 1 | `en.wikipedia.org/wiki/Fernando_Torres` | Torres played for Chelsea | yes at 90% | yes | 3 (unanimous) | 340 | Matches the scoring rule: (68600 - 600) / 200 = 340. The leaderboard total of 656 equals 316 + 340. The tester reported the settle took about 2 minutes. A Wikipedia page was fetched successfully on Bradbury. |
| 2 | `en.wikipedia.org/wiki/Solana_(blockchain_platform)` | Solana is the biggest crypto coin | unclear at 60% | not settled when checked | n/a | n/a | A borderline claim on a long page. The round was still in the reveal phase when the tester looked, after later rounds had finished. The cause was not determined (still processing, timed out, or not yet asked). This round is unresolved and is not counted as a result. A later retry on the same page (round 5) ended in VALIDATORS TIMEOUT. |
| 3 | `witness/tests/hostile_pages/02_ignore_instructions.html` | Acme reported 12 million dollars of Q3 revenue | yes at 90% | unclear | 3 (unanimous, from the agreement bar) | 0 | The page tells the jury what to answer. The verdict was unclear and the guess scored 0. A hostile page is caught by the contract's pattern check before the model is asked, so this shows the tripwire works, not that the model resists injection. |
| 4 | `does-not-exist.invalid/page` | The page exists | yes at 70% | void | 0 | 0 | The address cannot be fetched. The round ended void, no points were awarded, and neither the leaderboard nor the agreement counts changed. |
| 5 | `en.wikipedia.org/wiki/Solana_(blockchain_platform)` | Solana is the biggest crypto coin | unclear at 50% | not settled | n/a | n/a | A retry of round 2. The settle transaction was accepted by the network but the explorer showed VALIDATORS TIMEOUT for the newest settle (the leader finished, the other validators did not finish re-running the jury in time), and the round stayed in the reveal phase. Not counted as a result. |

Timing: in round 0 the commit step alone took about 7 minutes, and that step makes no model calls, so Bradbury was slow at that moment whatever the contract does; the settle time was not recorded. In round 1 the tester reported the settle took about 2 minutes. These are two single runs on a network whose load varies, so no general speed claim is made.

Page behaviour noted in this run: after the settle, the page's progress panel said the transaction "finished but nothing changed" while the round already showed Settled. Either the page checked before Bradbury's state had caught up, or a second Ask the jury click was refused on an already-settled round. The tester confirmed having clicked Ask the jury more than once, so the message was most likely about a refused second settle. The page now keeps checking for up to a minute before reporting a problem, and warns before a second settle is sent.

## Observations
- Large pages are a known problem. The long Solana Wikipedia article voided twice on Studio, and on Bradbury one settle ended in VALIDATORS TIMEOUT (round 5) and an earlier attempt (round 2) never settled, while a short Wikipedia page (Fernando Torres) settled in about 2 minutes. The likely cause is that every validator must fetch a long page and ask the model within a time limit, but this is a hypothesis that has not been confirmed. The contract was not changed during review; this is documented as a limit instead.
- Round 2 was a hostile page. The contract's design settles such a page as `unclear` with firmness 3 without asking the jurors (checked in the off-chain tests). On-chain I observed the `unclear` verdict, the zero score, and the agreement record moving from 1 unanimous, 1 split to 2 unanimous, 1 split. I did not observe whether the jurors were consulted.
- Two Wikipedia rounds ended void on Studio (the page could not be read), but a Wikipedia page was read fine on Bradbury. One working round does not show the cause, so the README only says that some sites may block validators.
- The agreement bar briefly showed the old counts right after a settle and corrected itself on refresh. It is a display lag in the page, not a contract counter problem.
- The full commit, reveal and settle flow completed on real validators, including the custom leader and validator comparison.
- On the borderline claim the verdict was settled by a 2 to 1 majority. This is the behaviour the firmness tolerance is meant to allow.
- While the settle transaction was running, a separate read of the rounds list returned "An unknown RPC error occurred". It cleared on refresh. The page now shows a friendlier message in that case.

## Not yet run
- A borderline claim settled on the current contract on Bradbury (the one attempt, round 2 above, is unresolved)
- Multi-player rounds, including a player who never reveals
- Rule refusals on the live contract: double commit, wrong reveal, early settle by a non-creator
- Repeating the same borderline claim several times to see how often the verdict and firmness change
- Any independent audit of the injection defences; only a small set of pages has been tried
