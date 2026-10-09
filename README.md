# Beat the Jury

A prediction game on GenLayer where the opponent is the validator jury itself.

Players guess what a jury of validators will decide about a claim on a public web page, and stake a confidence on the guess. Guesses are hidden with commit-reveal. The verdict is settled by validator consensus using a custom equivalence check. Scoring is exact integer code with a proper scoring rule, so honest confidence earns the most.

Every settled round also records how united the jury was, so the game builds a public record of how predictable LLM validator juries are on borderline claims.

## Status
Built and tested off-chain (84 checks), and played on GenLayer Studio and Bradbury (see the notes on contract versions below). See `tests/attacks/RESULTS.md` for exactly what has been run on-chain.

The contract source is kept small on purpose: a larger version (17,538 bytes) was refused by Bradbury with "gas limit too high" at deployment, so comments and explanations live in this README, not in the contract.

## How a round works
There is no clock. Every step is an explicit call, enforced by a state machine.

1. `create_round(url, claim, max_players)` starts a round in the commit phase.
2. `commit(round_id, commitment)` stores a hash of your hidden guess. The hash covers the round id, guess, confidence, a random salt and your address, so nobody can copy it. When the round is full it moves to the reveal phase. The creator can also call `close_commits`.
3. `reveal(round_id, guess, confidence, salt)` must match your commitment exactly.
4. `settle(round_id)` asks the jury. Anyone can settle once everyone has revealed; the creator can settle early. Players who never reveal score 0.

A round ends `settled`, or `void` if the page could not be read (nobody scores).

## Consensus design
The jury is three jurors with different styles (literal, strict evidence, reasonable reader), asked together in a single model call per validator. Each validator fetches the page, gets one `yes`, `no` or `unclear` from each juror, and takes the majority as the verdict. If the model's answer cannot be parsed, the round settles as `unclear` with firmness 1, never as a made-up unanimous verdict. `firmness` is the size of the majority: 3 unanimous, 2 split 2 to 1, 1 three-way split (settled as `unclear`).

Equivalence is a custom check using `gl.vm.run_nondet_unsafe`. The leader runs the jury. Each validator re-runs the whole jury itself and accepts the leader's result only if:
- the verdict is identical, and
- the firmness differs by at most one step.

The verdict is the decision, so it must match exactly. Firmness may wobble by one juror between runs without a real disagreement. A malformed leader result is rejected. This logic is a plain function (`jury_accepts`) tested off-chain.

Prompt injection: page text is passed inside delimiters as untrusted data. A deterministic pattern check runs on every validator, and a page that tries to steer the jury is settled as `unclear` (firmness 3) without asking the jurors. A page that legitimately discusses prompt injection can trip this; it fails safe.

## Scoring
A player puts `confidence` percent on their guess (40 to 90) and the rest is split evenly across the other two outcomes. The error is the categorical Brier score at scale 200:

- right: `6 * (100 - c)^2`
- wrong: `6 * c^2 + 20000`

Points are `(68600 - error) // 200`, so a round pays 0 to 340 and is never negative. The rule is strictly proper: if you believe the jury will say X with probability q, your expected points are highest when your confidence is the allowed value nearest q. `tests/test_logic.py` checks this for q from 0.4 to 0.9. Being overconfident and wrong costs the most.

## State
- `rounds`: round id to creator, url, claim, status, counts, players, verdict, firmness
- `entries`: `"<round>:<address>"` to commitment, revealed guess and confidence
- `scores`: address to total points and rounds played
- counters: settled, void, and one per firmness level

Bounded by design: at most 20 players per round, claim 280 characters, URL 300 characters, listing views capped at 50.

## Contract interface
Writes: `create_round`, `commit`, `close_commits`, `reveal`, `settle`.
Views: `count`, `get_round`, `list_rounds`, `get_entry`, `leaderboard`, `get_stats`.

`get_stats` is the jury-reliability record: rounds settled, void, unanimous, 2 to 1 and three-way split.

## The app
`app/index.html` is a single page that calls the contract through `genlayer-js`. It computes the commit hash in your browser, keeps your secret in local storage, shows each transaction stage, confirms the result by re-reading the chain, and handles failed and void rounds. On Studio it uses a throwaway key kept in the browser (no funds). On Bradbury it uses your wallet. Set the address with the box on the page or `?network=bradbury&address=0x...`.

`app/deploy.html` deploys the contract to Bradbury from the browser with a wallet and shows the SHA-256 of the source it deploys.

## Speed on Bradbury and why the jury is one call
The first version asked the model once per juror, so every validator made three sequential model calls. On Bradbury its first settle took roughly 10 to 15 minutes, and a second settle ended in a LEADER TIMEOUT (the validator chosen to run the jury did not finish in time; the round stayed in the reveal phase and nothing was lost). The jury was therefore changed to one model call that returns all three jurors' votes, and the page text is capped at 8,000 characters.

The trade-off: the three votes now come from one response, so they are less independent than three separate calls. The verdict is still a majority of three, and firmness still records how united they were.

In the first tests of the one-call version, settles on Bradbury succeeded with no leader timeout. One was reported at about 2 minutes, while in another run even the simple commit step took about 7 minutes because the network was slow. These are single runs, not guarantees.

Wait for a transaction to be accepted before trying again. A second `Ask the jury` on an already-settled round is refused by the contract and only wastes gas, so the page remembers a sent settle for 20 minutes (in that browser) and warns and asks for confirmation before sending another. Bradbury was also very busy during testing, so some delay is the network and not the contract.

## Trust model and jury integrity
What this project is for: a low-stakes testbed that measures how predictable a validator jury is on subjective claims, using a contract design (hidden guesses, exact scoring, a custom equivalence check) that would carry over to higher-stakes uses such as dispute or escrow settlement. **The stakes here are modest on purpose: no funds are at risk, only points on a leaderboard.** It does not claim to solve a high-value trust problem by itself.

What the contract does guarantee, and what a player or reviewer can check:
- **Nobody picks the verdict.** The round creator chooses the page and claim, but the verdict comes from validators re-running the jury, and the leader's result is accepted only if validators reproduce the same verdict (`jury_accepts`). A leader cannot force a result through.
- **Guesses cannot be copied.** A guess is stored as a hash of the round, guess, confidence, a private salt and the player's address, and must be revealed to match exactly.
- **Scoring is auditable code.** Points come from an integer proper scoring rule, so there is no discretion in awarding them.
- **The jury's reliability is recorded.** Every settled round updates counts of unanimous, 2-to-1 and three-way-split verdicts, and unreadable pages are recorded as void.

Known integrity limits, stated plainly:

| Limit | Effect | Status |
|-------|--------|--------|
| The three jurors are one model call | They are correlated, not independent. A 3-of-3 verdict is weaker evidence than three separate models. | A three-call version timed out on Bradbury, so this was a deliberate trade-off. |
| One model family | A shared model bias passes straight into every verdict. | Not addressed. |
| The leaderboard is not sybil-resistant | Anyone can run solo rounds on easy claims and farm points. Points have no value, but the leaderboard should not be read as a skill ranking. | Not addressed. A fix would be to score only rounds with two or more independent players. |
| Players can read the page | Clear-cut claims are easy to predict. The game is only informative on borderline claims. | By design. |
| The creator controls the claim and can settle early | A creator can pick a claim they know the answer to, and early settlement forfeits players who have not revealed. | Not addressed. |
| Hostile pages | Only a prompt instruction and a pattern check defend against them. A subtle injection could get through. | Partly addressed. Tested with a small set of pages, not an audit. |
| Large pages | Every validator must fetch the whole page and ask the model within a time limit. A long Wikipedia article ended in VALIDATORS TIMEOUT on Bradbury and voided on Studio, while short pages settled. Likely cause only, not confirmed. | Observed. Not addressed; short pages work. |
| Pages change between fetches | Validators may disagree, so a round can fail to settle. | Observed on Bradbury as leader timeouts in the first version. |

Possible next steps, if the project is accepted and extended: score only multi-player rounds, add a cost or cap on round creation, and use independent jurors again if Bradbury's time limits allow.

## Honest limitations
- Only the first 8,000 characters of a page are read.
- The jury is LLM readings of one page at one moment. Borderline claims can fail to settle (validators cannot agree) and need a retry.
- If a player clears their browser data before revealing, their secret is lost and they score 0.
- A creator can settle early and forfeit players who have not revealed. Players should reveal promptly.
- Players can read the page themselves, so clear-cut claims are easy. The interesting rounds are the borderline ones.
- There is no clock, so there are no deadlines, only phase changes.

## Tests
- `python3 tests/test_logic.py`: 84 off-chain checks of the pure logic and the full round lifecycle with mocked jurors (settled, void, hostile page, three-way split, leader and validator disagreeing, wobble tolerance). Uses `tests/stub/genlayer.py`, a local stand-in for the SDK.
- `node tests/frontend_parity.test.js`: confirms the page's scoring and commit hash match the contract exactly.
- `STUDIO_TEST.md`: the on-chain test plan. Results go in `tests/attacks/RESULTS.md`.

## Deployment
Current contract source: `contracts/beat_the_jury.py`, 11707 bytes, SHA-256 `ebbdd3c707ddf1fa111017d64d08b3692dfac129f77bcc87187dbde6f3b72e11` (one model call per settle).

- Bradbury, current: `0xeC5Ac349cB2eEF18Be2f581D703bD3481d711645` (explorer: https://explorer-bradbury.genlayer.com/address/0xeC5Ac349cB2eEF18Be2f581D703bD3481d711645). Deployment transaction: `0xf0807cb1da93eabb86677f0b6c3b1a71eb9cd8fa87540a99c4fa1bf23d9f3234` (https://explorer-bradbury.genlayer.com/tx/0xf0807cb1da93eabb86677f0b6c3b1a71eb9cd8fa87540a99c4fa1bf23d9f3234).
- Live app: https://captainkg15.github.io/beat-the-jury/app/ (defaults to Bradbury; the network menu switches to Studio, which needs no wallet)

Earlier versions, kept for the record and superseded:
- Bradbury, three-call version (11,622 bytes, SHA-256 `bb8c7ec416b714132eabd4839f0a3b8115bdce1f3d887b11d547b56f8baadb3b`): `0xcc1A40b32221F8588385C38b2cfcfE620515d7CF`, deployment transaction `0x003970487bf55f38616b0a380ef86ccd645cb48558806eccffa4ac2865498c94`. Its first settle was slow and a second ended in LEADER TIMEOUT.
- Studio, one-call version (current source): `0xF0c12cbcD6EC82AE3d44c015Bdf00e60E4F646A7`. Its first clear-cut round settled unanimously; two Wikipedia rounds ended void because the page could not be read.
- Studio, original three-call version (17,538 bytes, SHA-256 `36556f80d79aed08b86ee4a23dc36834b42dc283a1c545737be30305a30e8b88`): `0xbDe7C028AFC84e8444e1d082f5d563B1eb6C07B0`.

`app/deploy.html` deploys the contract to Bradbury from the browser with a wallet and shows the SHA-256 of the source it deploys, so the deployed code can be compared with the file in this repo.
