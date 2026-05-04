#!/usr/bin/env node
/**
 * Headless probe for the live Expo Web bundle.
 *
 * Used to debug "is this string actually in the rendered DOM" when a scene
 * in record-jaynee-demo.mjs records the right text but Gemini complains it
 * isn't visible. Tells you the inner-scroller heights so you know how far
 * to pan in each scene.
 *
 * Run:
 *   node scripts/probe-routes.mjs
 */
import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });

async function probe(url, queries) {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const text = await page.evaluate(() => document.body.innerText || '');
  const dims = await page.evaluate(() => {
    const s = document.scrollingElement;
    return { scrollH: s.scrollHeight, clientH: s.clientHeight };
  });
  // Also dump scrollers — RN Web uses inner scrollers
  const scrollerInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*')).filter((el) => {
      const cs = getComputedStyle(el);
      return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    return all.map((el) => ({ tag: el.tagName, scrollH: el.scrollHeight, clientH: el.clientHeight, classes: el.className.slice(0, 40) }));
  });
  const found = Object.fromEntries(queries.map((q) => [q, text.includes(q)]));
  console.log(`\n${url}`);
  console.log(`  body=${text.length} doc-scroll=${dims.scrollH}/${dims.clientH}`);
  console.log(`  inner scrollers: ${JSON.stringify(scrollerInfo)}`);
  console.log(`  found: ${JSON.stringify(found)}`);
}

await probe('http://localhost:8081/calendar', ['Today', 'booking', 'M&G', 'blocks', 'hours free', 'No human food', 'Bella']);
await probe('http://localhost:8081/clients/c5', ['AI permissions', 'AI can READ messages', 'AI can DRAFT replies', 'AI can SEND replies', 'Fail-closed by default', 'Care Plan', 'Bella', 'No human food', 'Walk after every nap', 'Never alone']);
await probe('http://localhost:8081/clients/new', ['Express add', 'FASTEST PATH', 'Drag a photo here', 'Care Rules', 'Pet name', 'Full Name']);

await b.close();
