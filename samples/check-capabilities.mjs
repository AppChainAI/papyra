import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Real offline Chrome, matching the existing sample checker; no npm dependency.
const root = new URL('./', import.meta.url);
const names = ['math', 'svg', 'citations', 'research-note'];
const output = await mkdtemp(join(tmpdir(), 'papyra-capabilities-'));
const profile = join(output, 'profile');
const child = spawn(process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
let launchError, socket, sequence = 0;
child.on('error', error => { launchError = error; });
const pending = new Map(), errors = [], remoteRequests = [], results = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await delay(50);
  }
  throw Error(`Wait failed: ${expression}`);
}
async function navigate(url) {
  await send('Page.navigate', { url: url.href });
  await waitFor(`location.href === ${JSON.stringify(url.href)} && document.readyState === 'complete'`);
  await evaluate('document.fonts.ready.then(()=>true)');
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(output, `${name}.png`), Buffer.from(data, 'base64'));
}
const visible = `e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'; }`;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert(port, 'Chrome failed to start');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data), call = pending.get(message.id);
    if (call) { pending.delete(message.id); message.error ? call.reject(Error(JSON.stringify(message.error))) : call.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args);
    if (message.method === 'Network.requestWillBeSent' && /^https?:/.test(message.params.request.url)) remoteRequests.push(message.params.request.url);
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  // Core capability samples must render and navigate without JavaScript.
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const name of names) {
    const source = await readFile(new URL(`${name}.md`, root), 'utf8');
    const html = await readFile(new URL(`output/${name}.html`, root), 'utf8');
    const moved = new URL(`file://${join(output, `${name}.html`)}`);
    await writeFile(moved, html);
    await navigate(moved);
    assert.equal(await evaluate(`document.getElementById('source-markdown').textContent`), source, `${name}: exact original Markdown`);
    const anchors = await evaluate(`(() => {
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      return {unique:new Set(ids).size===ids.length, broken:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id))};
    })()`);
    assert(anchors.unique, `${name}: duplicate IDs`);
    assert.deepEqual(anchors.broken, [], `${name}: broken anchors`);
    const refs = await evaluate(`[...document.querySelectorAll('[role="doc-noteref"]')].map(a=>({id:a.id,target:a.hash.slice(1)}))`);
    for (const ref of refs) {
      assert(await evaluate(`(() => {const note=document.getElementById(${JSON.stringify(ref.target)}); return [...note.querySelectorAll('[role="doc-backlink"]')].some(a=>a.hash===${JSON.stringify('#' + ref.id)});})()`), `${name}: missing per-occurrence return for ${ref.id}`);
      // Native click must navigate even with all page scripts disabled.
      await evaluate(`document.getElementById(${JSON.stringify(ref.id)}).click()`);
      assert.equal(await evaluate('decodeURIComponent(location.hash.slice(1))'), ref.target);
      await evaluate(`[...document.getElementById(${JSON.stringify(ref.target)}).querySelectorAll('[role="doc-backlink"]')].find(a=>a.hash===${JSON.stringify('#' + ref.id)}).click()`);
      assert.equal(await evaluate('decodeURIComponent(location.hash.slice(1))'), ref.id);
    }
    if (name === 'research-note') {
      assert.equal(await evaluate(`document.querySelector('math msqrt').textContent.replace(/\\s/g,'')`), 'a2+b2');
      assert(await evaluate(`document.querySelector('#eq-1 math').textContent.includes('c')`), 'Equation reference target must contain displayed relation');
      assert.deepEqual(refs.map(ref=>ref.target), ['mathml','svg','mathml','svg','offline']);
    }
    if (name === 'svg' || name === 'research-note') {
      const diagrams = await evaluate(`[...document.querySelectorAll('svg')].map(svg=>({labels:(svg.getAttribute('aria-labelledby')||'').split(/\\s+/).map(id=>document.getElementById(id)?.textContent),text:svg.textContent,viewBox:svg.getAttribute('viewBox')}))`);
      assert.equal(diagrams.length, name === 'svg' ? 2 : 1);
      for (const diagram of diagrams) {
        assert(diagram.labels.every(Boolean), `${name}: diagram title/description`);
        for (const number of ['3','4','5']) assert(diagram.text.includes(number), `${name}: missing side ${number}`);
        assert.equal(diagram.viewBox, '0 0 420 320');
      }
      assert.equal(await evaluate(`document.querySelectorAll('svg script,svg foreignObject,svg style,svg [href^="http"]').length`), 0);
    }
    const layouts = [];
    for (const width of [1440, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      const dimensions = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth})`);
      assert(dimensions.scroll <= dimensions.width + 1, `${name}/${width}: page overflow`);
      assert(await evaluate(`[...document.querySelectorAll('math,svg')].every(${visible})`), `${name}/${width}: hidden math or SVG`);
      layouts.push(dimensions);
      await evaluate('scrollTo(0,0)');
      await screenshot(`${name}-${width}`);
    }
    if (refs.length) {
      await evaluate(`document.getElementById(${JSON.stringify(refs[0].target)}).scrollIntoView()`);
      await screenshot(`${name}-evidence`);
    }
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    assert(await evaluate(`[...document.querySelectorAll('math,svg,[role="doc-endnote"]')].every(${visible})`), `${name}: print hides essential content`);
    const pdf = await send('Page.printToPDF', { printBackground: false, preferCSSPageSize: true });
    await writeFile(join(output, `${name}.pdf`), Buffer.from(pdf.data, 'base64'));
    await send('Emulation.setEmulatedMedia', { media: '' });
    results.push({ name, layouts, citationOccurrences: refs.length, scripts: false, offline: true, print: true });
    console.log(`PASS ${name}: exact source, native navigation, 3 viewports, offline/no-JS, print.`);
  }
  assert.deepEqual(errors, []); assert.deepEqual(remoteRequests, []);
  await writeFile(join(output, 'results.json'), JSON.stringify({ results, errors, remoteRequests }, null, 2));
  console.log(`Artifacts: ${output}`);
} finally {
  socket?.close();
  if (!launchError && child.exitCode === null) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM'); await Promise.race([exited, delay(3000)]);
    if (child.exitCode === null) { child.kill('SIGKILL'); await exited; }
  }
  await rm(profile, { recursive: true, force: true });
}
