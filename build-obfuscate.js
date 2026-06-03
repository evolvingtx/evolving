#!/usr/bin/env node
/**
 * EvoSensory — Pre-Deploy Obfuscation Build
 * Runs automatically via Netlify on every push (see netlify.toml).
 * Also: node build-obfuscate.js
 */

const fs   = require('fs');
const path = require('path');
const { minify } = require('terser');

const INPUT  = path.join(__dirname, 'evosensory.html');
const OUTPUT = path.join(__dirname, 'evosensory.html');

const RESERVED = [
  'showScreen','pickModule','pickModality','pickAgeCat','pickColor',
  'openSettings','closeSettings','setModalityFromSettings',
  'setBpm','chBpm','resetBpm','setGM','setSM','selLv',
  'setMathOp','setOcuMode','setMotMode','setAGMode','setRumbleMode',
  'toggleMute','toggleEyeTracking','toggleBlind','toggleTherapist',
  'updateMathParamLabel','syncWordListFromMods','applyCamZoom',
  'buildModSettings','modsSelectLevel','modsChangeBPM','modsPickModality',
  'modsStartSession',
  'handleTap','startCountdown','exitGameEarly','goNextLv',
  'startCountdownFromMotion','startAfterWGCalib',
  'startWGCalibration','closeWGSetup',
  'openMotionSetup','closeMotionSetup','applyCalib',
  'openHWCheck','closeHWCheck','confirmHWAndStart','updateHWSummary',
  'testVib','testRumble',
  'openNewUser','closeNewUser','saveNewUser','selectUser',
  'startCalib','skipCalib',
  'openSOAP','closeSOAP','copySOAP','printSOAP','printRpt','expCSV',
  'ct',
];

// Escape ALL non-ASCII code points to \uXXXX / \uXXXX\uXXXX surrogate pairs
// Applied to raw JS text before Terser parses it — Terser re-emits as real chars
function escapeNonAscii(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 127) {
      // Check for surrogate pair (emoji above U+FFFF)
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
        const lo = str.charCodeAt(i + 1);
        if (lo >= 0xDC00 && lo <= 0xDFFF) {
          out += `\\u${code.toString(16).padStart(4,'0')}\\u${lo.toString(16).padStart(4,'0')}`;
          i++; // skip low surrogate
          continue;
        }
      }
      out += `\\u${code.toString(16).padStart(4,'0')}`;
    } else {
      out += str[i];
    }
  }
  return out;
}

async function build() {
  const isNetlify = !!process.env.NETLIFY;
  console.log(`\n📦  EvoSensory build${isNetlify ? ' · Netlify' : ' · local'}…`);

  if (!fs.existsSync(INPUT)) {
    console.error('❌  evosensory.html not found — run from the repo root.');
    process.exit(1);
  }

  let html = fs.readFileSync(INPUT, 'utf8');
  const re = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(re)];

  if (!matches.length) {
    console.warn('⚠️   No inline scripts found.');
    fs.writeFileSync(OUTPUT, html, 'utf8'); return;
  }

  console.log(`🔍  ${matches.length} script block(s).\n`);

  let modifiedHtml = html;
  let origTotal = 0, minTotal = 0;

  for (let i = 0; i < matches.length; i++) {
    const [fullTag, code] = matches[i];
    origTotal += code.length;
    if (!code.trim()) { console.log(`   Block ${i+1}: empty`); continue; }

    // Escape non-ASCII before Terser parses — Terser re-emits real chars in output
    const safeCode = escapeNonAscii(code);

    let result;
    try {
      result = await minify(safeCode, {
        ecma: 2020,
        compress: { passes:2, drop_console:false, pure_getters:true, unsafe_math:false },
        mangle: { toplevel:true, reserved:RESERVED },
        format: { comments:false, ecma:2020, ascii_only:false },
      });
    } catch(err) {
      console.error(`❌  Terser error in block ${i+1}: ${err.message}`);
      process.exit(1);
    }

    const min = result.code;
    minTotal += min.length;
    const pct = (((code.length - min.length) / code.length) * 100).toFixed(1);
    console.log(`   Block ${i+1}: ${code.length.toLocaleString()} → ${min.length.toLocaleString()} chars  (${pct}% smaller)`);

    modifiedHtml = modifiedHtml.replace(fullTag, fullTag.replace(code, min));
  }

  const totalPct = (((origTotal - minTotal) / origTotal) * 100).toFixed(1);
  console.log(`\n✅  JS: ${origTotal.toLocaleString()} → ${minTotal.toLocaleString()} chars  (${totalPct}% reduction)`);

  modifiedHtml = modifiedHtml.replace('<!DOCTYPE html>',
    `<!DOCTYPE html>\n<!-- EvoSensory build: ${new Date().toISOString()} -->`);

  fs.writeFileSync(OUTPUT, modifiedHtml, 'utf8');
  console.log(`🚀  ${OUTPUT} written.\n`);
}

build().catch(e => { console.error('Build failed:', e); process.exit(1); });
