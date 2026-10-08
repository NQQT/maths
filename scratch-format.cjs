// TEMPORARY formatter (deleted after use): re-emits the scratch dump sheets as
// one-problem-per-line blocks ready to paste into the owned test files.
const fs = require('fs');
const lines = fs.readFileSync('scratch-dump-out.txt', 'utf8').split(/\r?\n/);
const out = [];
for (const line of lines) {
    const m = line.match(/^(SHEET|PAGE2) (\w+) g(\d+) (.*)$/);
    if (!m) continue;
    const arr = JSON.parse(m[4]);
    out.push(`=== ${m[1]} ${m[2]} g${m[3]} ===`);
    for (const p of arr) out.push('            ' + JSON.stringify(p) + ',');
}
fs.writeFileSync('scratch-formatted.txt', out.join('\n'));
console.log('blocks:', out.length);
