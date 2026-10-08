// Checks that the web page's scoring and commit hash match the contract's Python helpers.
// Run: node tests/frontend_parity.test.js   (needs python3 on PATH)
const fs = require("fs"), path = require("path"), assert = require("assert"), { execFileSync } = require("child_process"), crypto = require("crypto");
const html = fs.readFileSync(path.join(__dirname, "..", "app", "index.html"), "utf8");
const js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const grab = (name) => js.match(new RegExp("(function " + name + "\\([\\s\\S]*?\\n}\\n)"))[1];
const GUESSES = ["yes", "no", "unclear"], CONFIDENCES = [40, 50, 60, 70, 80, 90];
const { pointsFor } = new Function("GUESSES", grab("pointsFor") + "\nreturn { pointsFor };")(GUESSES);

const py = (code) => execFileSync("python3", ["-c", code], { cwd: path.join(__dirname, "..", "contracts"), env: { ...process.env, PYTHONPATH: path.join(__dirname, "stub") } }).toString().trim();
const expected = JSON.parse(py(`
import json, beat_the_jury as j
print(json.dumps({g+"|"+str(c)+"|"+v: j.points_for(g,c,v) for g in j.GUESSES for c in j.CONFIDENCES for v in j.GUESSES}))`));
let n = 0;
for (const g of GUESSES) for (const c of CONFIDENCES) for (const v of GUESSES) { assert.strictEqual(pointsFor(g, c, v), expected[g + "|" + c + "|" + v], g + c + v); n++; }
console.log("scoring parity:", n, "combinations match the contract");

const addr = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
const jsHash = crypto.createHash("sha256").update(["7", "unclear", "60", "s4lt", addr.toLowerCase()].join("|"), "utf8").digest("hex");
const pyHash = py(`import beat_the_jury as j; print(j.commitment_for(7, "unclear", 60, "s4lt", "${addr}"))`);
assert.strictEqual(jsHash, pyHash);
console.log("commit hash parity: JS and contract produce the same hash");
