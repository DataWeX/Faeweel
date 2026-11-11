import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const wallet = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generator = path.join(wallet, 'scripts/build-shell-styles.py');
const source = path.join(wallet, 'public/workspace/xml/shell.xml');
const output = path.join(wallet, 'public/workspace/css/shell.css');

function generate(args = []) {
  return spawnSync('python3', [generator, ...args], { encoding: 'utf8' });
}

test('shell XML deterministically generates the checked-in stylesheet', () => {
  const check = generate(['--check']);
  assert.equal(check.status, 0, check.stderr);

  const temp = mkdtempSync(path.join(os.tmpdir(), 'shell-styles-'));
  try {
    const generated = path.join(temp, 'shell.css');
    const result = generate(['--output', generated]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(generated, 'utf8'), readFileSync(output, 'utf8'));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('shell generator rejects malformed schema and declarations', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'shell-styles-invalid-'));
  const input = path.join(temp, 'invalid.xml');
  const generated = path.join(temp, 'shell.css');
  try {
    for (const invalid of [
      '<!DOCTYPE stylesheet [<!ENTITY x "boom">]><stylesheet><rule selector=".x"><property name="color" value="red"/></rule></stylesheet>',
      '<stylesheet><rule selector=".x"><property name="color" value="red; color: blue"/></rule></stylesheet>',
      '<stylesheet><rule selector=".x"><declaration name="color" value="red"/></rule></stylesheet>',
      '<stylesheet><rule selector=".x { body" ><property name="color" value="red"/></rule></stylesheet>',
    ]) {
      writeFileSync(input, invalid);
      const result = generate(['--input', input, '--output', generated]);
      assert.notEqual(result.status, 0, `accepted invalid XML: ${invalid}`);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
