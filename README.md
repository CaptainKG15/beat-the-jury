# Beat the Jury

A prediction game on GenLayer where the opponent is the validator jury itself.

Players guess what a jury of validators will decide about a claim on a public web page, and stake a confidence on the guess. Guesses are hidden with commit-reveal. The verdict is settled by validator consensus using a custom equivalence check. Scoring is exact integer code with a proper scoring rule, so honest confidence earns the most.

Every settled round also records how united the jury was, so the game builds a public record of how predictable LLM validator juries are on borderline claims.

## Status
Built and tested off-chain (80 checks), and played on GenLayer Studio. See `tests/attacks/RESULTS.md` for exactly what has been run on-chain.

The contract source is kept small on purpose: a larger version (17,538 bytes) was refused by Bradbury with "gas limit too high" at deployment, so comments and explanations live in this README, not in the contract.

## How a round works
There is no clock. Every step is an explicit call, enforced by a state machine.

1. `create_round(url, claim, max_players)` starts a round in the commit phase.
2. `commit(round_id, commitment)` stores a hash of your hidden guess. The hash covers the round id, guess, confidence, a random salt and your address, so nobody can copy it. When the round is full it moves to the reveal phase. The creator can also call `close_commits`.
3. `reveal(round_id, guess, confidence, salt)` must match your commitment exactly.
4. `settle(round_id)` asks the jury. Anyone can settle once everyone has revealed; the creator can settle early. Players who never reveal score 0.

A round ends `settled`, or `void` if the page could not be read (nobody scores).

## Consensus design
The jury is three jurors with different styles (literal, strict evidence, reasonable reader). Each validator fetches the page, asks each juror for one of `yes`, `no`, `unclear`, and takes the majority as the verdict. `firmness` is the size of the majority: 3 unanimous, 2 split 2 to 1, 1 three-way split (settled as `unclear`).

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

## Honest limitations
- The jury is LLM readings of one page at one moment. Borderline claims can fail to settle (validators cannot agree) and need a retry.
- If a player clears their browser data before revealing, their secret is lost and they score 0.
- A creator can settle early and forfeit players who have not revealed. Players should reveal promptly.
- Players can read the page themselves, so clear-cut claims are easy. The interesting rounds are the borderline ones.
- There is no clock, so there are no deadlines, only phase changes.

## Tests
- `python3 tests/test_logic.py`: 80 off-chain checks of the pure logic and the full round lifecycle with mocked jurors (settled, void, hostile page, three-way split, leader and validator disagreeing, wobble tolerance). Uses `tests/stub/genlayer.py`, a local stand-in for the SDK.
- `node tests/frontend_parity.test.js`: confirms the page's scoring and commit hash match the contract exactly.
- `STUDIO_TEST.md`: the on-chain test plan. Results go in `tests/attacks/RESULTS.md`.

## Deployment
- Studio: `0xbDe7C028AFC84e8444e1d082f5d563B1eb6C07B0` (explorer: https://explorer-studio.genlayer.com/contracts/0xbDe7C028AFC84e8444e1d082f5d563B1eb6C07B0). This is an earlier, longer version of the contract (17,538 bytes, SHA-256 `36556f80d79aed08b86ee4a23dc36834b42dc283a1c545737be30305a30e8b88`) with the same logic and longer juror prompt wording.
- Bradbury: (fill in). Source deployed: `contracts/beat_the_jury.py`, 11,622 bytes, SHA-256 `bb8c7ec416b714132eabd4839f0a3b8115bdce1f3d887b11d547b56f8baadb3b`.
- Live app: (fill in)
