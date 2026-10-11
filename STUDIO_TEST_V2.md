# Test plan for version 2

Record every result in `tests/attacks/RESULTS.md`, including failures. Use the version 2 page, `app/v2/index.html`.

## 1. Studio
1. Deploy `contracts/beat_the_jury.py` in GenLayer Studio. Open the page with `?network=studionet&address=<address>`.
2. **Long page, clear claim** (the case that failed before): `https://en.wikipedia.org/wiki/Solana_(blockchain_platform)`, claim `Solana is a blockchain platform`, practice round (1 player). Expect `yes`.
3. **Two players, two browsers** (each browser has its own throwaway Studio key): create a 2-player round on `witness/tests/hostile_pages/01_clean_control.html`, both commit and reveal, then settle. Expect both players on the leaderboard.
4. **Practice round:** a 1-player round. Expect it to settle but the leaderboard to stay unchanged.
5. **Fallback:** `https://does-not-exist.invalid/page` should still end void.

## 2. Bradbury (only if Studio works)
Deploy with `app/deploy.html` (check it shows the version 2 hash). Then, with a wallet:
1. The long-page clear claim again (Solana, `Solana is a blockchain platform`).
2. The short borderline page `beat-the-jury/tests/pages/borderline.html`, claim `Acme's Q3 revenue was 12 million dollars`.
3. The hostile page `witness/tests/hostile_pages/02_ignore_instructions.html`.
Note the time each settle takes and the explorer status of any that fail. Do not retry a failed settle more than once.
