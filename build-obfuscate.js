#!/usr/bin/env node
/**
 * EvoSensory — Pre-Deploy Obfuscation Script
 * ============================================
 * Extracts <script> blocks from evosensory.html,
 * minifies + obfuscates JS with Terser, writes
 * evosensory-dist.html ready for git push.
 *
 * Usage:
 *   npm install terser          (first time only)
 *   node build-obfuscate.js
 *
 * Then push evosensory-dist.html as evosensory.html:
 *   copy evosensory-dist.html evosensory.html   (Windows)
 *   cp evosensory-dist.html evosensory.html     (Mac/Linux)
 *   git add evosensory.html && git commit -m "deploy" && git push
 */

const fs   = require('fs');
const path = require('path');
const { minify } = require('terser');

// ── Config ────────────────────────────────────────────────
const INPUT  = path.join(__dirname, 'evosensory.html');
const OUTPUT = path.join(__dirname, 'evosensory-dist.html');

const TERSER_OPTIONS = {
  compress: {
    passes: 2,          // two compression passes for smaller output
    drop_console: false, // keep console.log (needed for error handler)
    pure_getters: true,
  },
  mangle: {
    toplevel: true,     // rename top-level variables — key for obfuscation
    reserved: [
      // Functions called from HTML onclick/onkeydown attributes
      // Add any function names you call directly from HTML here
      'startGame','endGame','tapHandler','showScreen','selLv','selMod',
      'selSubMode','goSettings','goBack','goHome','goResults','goSoap',
      'toggleSetting','testVib','testRumble','toggleMute','toggleSpeech',
      'addPlayer','removePlayer','selPlayer','openSettings','closeSettings',
      'generateSoap','copySoap','downloadSoap','resetGame',
    ],
  },
  format: {
    comments: false,    // strip all comments
  },
};
// ─────────────────────────────────────────────────────────

async function build() {
  console.log('📦 EvoSensory build starting…');
  console.log(`   Input : ${INPUT}`);
  console.log(`   Output: ${OUTPUT}`);

  if (!fs.existsSync(INPUT)) {
    console.error('❌  evosensory.html not found. Run this script from the same folder.');
    process.exit(1);
  }

  let html = fs.readFileSync(INPUT, 'utf8');

  // ── Find all <script> blocks (not CDN src= scripts) ────
  // We only obfuscate inline scripts, never external CDN tags.
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(scriptRegex)];

  if (matches.length === 0) {
    console.warn('⚠️   No inline <script> blocks found. Writing HTML unchanged.');
    fs.writeFileSync(OUTPUT, html, 'utf8');
    return;
  }

  console.log(`\n🔍  Found ${matches.length} inline script block(s) to obfuscate.`);

  let modifiedHtml = html;
  let totalOriginal = 0;
  let totalMinified = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const originalCode = match[1];
    const originalLen  = originalCode.length;
    totalOriginal += originalLen;

    if (originalCode.trim().length === 0) {
      console.log(`   Block ${i + 1}: empty, skipping.`);
      continue;
    }

    let result;
    try {
      result = await minify(originalCode, TERSER_OPTIONS);
    } catch (err) {
      console.error(`❌  Terser error in block ${i + 1}:`, err.message);
      console.error('   Aborting — fix the JS error and try again.');
      process.exit(1);
    }

    const minCode   = result.code;
    const minLen    = minCode.length;
    totalMinified  += minLen;
    const reduction = (((originalLen - minLen) / originalLen) * 100).toFixed(1);

    console.log(`   Block ${i + 1}: ${originalLen} → ${minLen} chars  (${reduction}% smaller)`);

    // Replace exactly this script block in the HTML
    // Use the full match[0] as the search target for precision
    const obfuscatedBlock = match[0].replace(originalCode, minCode);
    modifiedHtml = modifiedHtml.replace(match[0], obfuscatedBlock);
  }

  const totalReduction = (((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(1);
  console.log(`\n✅  Total JS: ${totalOriginal} → ${totalMinified} chars  (${totalReduction}% reduction)`);

  // ── Inject a build timestamp comment ───────────────────
  const timestamp = new Date().toISOString();
  modifiedHtml = modifiedHtml.replace(
    '<!DOCTYPE html>',
    `<!DOCTYPE html>\n<!-- EvoSensory build: ${timestamp} -->`
  );

  fs.writeFileSync(OUTPUT, modifiedHtml, 'utf8');
  console.log(`\n🚀  evosensory-dist.html written successfully.`);
  console.log('\n── Next steps ──────────────────────────────────────────');
  console.log('  Windows:  copy evosensory-dist.html evosensory.html');
  console.log('  Mac/Linux: cp evosensory-dist.html evosensory.html');
  console.log('  Then:      git add evosensory.html');
  console.log('             git commit -m "deploy: obfuscated build"');
  console.log('             git push');
  console.log('────────────────────────────────────────────────────────\n');
}

build();
