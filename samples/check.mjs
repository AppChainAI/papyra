import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const root = new URL('./', import.meta.url);
const names = ['market-operations', 'requirements-development', 'design-proposal'];
const read = path => readFile(new URL(path, root), 'utf8');
const digest = text => createHash('sha256').update(text).digest('hex');
const originals = new Map(await Promise.all(names.map(async name => [name, await read(`${name}.md`)])));
const output = await mkdtemp(join(tmpdir(), 'papyra-samples-check-'));
const profile = join(output, 'profile');
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
let launchError;
child.on('error', error => { launchError = error; });
const pending = new Map(), errors = [], remoteRequests = [], results = [];
let socket, sequence = 0;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(error); }
    });
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
async function navigate(url, scripts = true) {
  await send('Page.navigate', { url: url.href });
  await waitFor(`location.href === ${JSON.stringify(url.href)} && document.readyState === 'complete'`);
  if (scripts) await waitFor(`document.querySelectorAll('.notation-ready').length === 5`);
  await delay(650);
}
async function viewport(width, height = 844, density = 1) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: density, mobile: false });
  await delay(750);
}
async function screenshot(name, selector) {
  await evaluate(selector
    ? `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`
    : `scrollTo({top:0,behavior:'instant'})`);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(output, `${name}.png`), Buffer.from(data, 'base64'));
}
async function key(key, code = key) {
  const value = key === 'Enter' ? 13 : 32;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode:value, text:key === 'Enter' ? '\r' : ' ' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode:value });
}
async function click(selector) {
  const point = await evaluate(`(() => {
    const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center',behavior:'instant'});
    const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};
  })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  await delay(600);
}
const normalize = text => text.replace(/\s/g, '');
// This intentionally handles only the Markdown constructs used in these three fixtures.
function markdownAtoms(markdown) {
  const atoms = [];
  let paragraph = [], code;
  const inline = text => text.replace(/`([^`]+)`/g, '$1');
  const add = text => atoms.push(normalize(inline(text)));
  const flush = () => { if (paragraph.length) { add(paragraph.join('\n')); paragraph = []; } };
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('```')) {
      flush();
      if (code) { atoms.push({ code: code.join('\n') }); code = undefined; } else code = [];
    } else if (code) code.push(line);
    else if (!line.trim()) flush();
    else if (/^\|/.test(line)) {
      flush();
      if (!/^\|[\s:|\-]+\|$/.test(line)) line.slice(1, -1).split('|').forEach(cell => add(cell.trim()));
    } else if (/^#{1,6} /.test(line)) { flush(); add(line.replace(/^#+ /, '')); }
    else if (/^(?:- |\d+\. )/.test(line)) {
      flush(); add(line.replace(/^(?:- |\d+\. )/, '').replace(/^\[[ xX]\] /, ''));
    } else if (line.startsWith('> ')) { flush(); add(line.slice(2)); }
    else paragraph.push(line);
  }
  flush();
  assert.equal(code, undefined, 'Unclosed code fence');
  return atoms;
}
const sourceAtoms = `(() => {
  const body = document.body.cloneNode(true);
  body.querySelectorAll('[data-enhancement],script,style').forEach(e => e.remove());
  const norm = text => text.replace(/\\s/g,'');
  const atoms = [norm(body.querySelector('h1').textContent), norm(body.querySelector('[data-source-meta]').textContent)];
  body.querySelectorAll('main h2,main h3,main p,main li,main th,main td,main pre').forEach(e => {
    atoms.push(e.tagName === 'PRE' ? {code:e.textContent.replace(/\\n$/, '')} : norm(e.textContent));
  });
  return atoms;
})()`;
const geometry = `(() => [...document.querySelectorAll('[data-notation]')].map(e => {
  const svg = e.dataset.notation === 'highlight' ? e.previousElementSibling : e.nextElementSibling;
  const text = e.getBoundingClientRect(), paths = [...svg.querySelectorAll('path')].map(p => p.getBoundingClientRect());
  const left = Math.min(...paths.map(p => p.left)), right = Math.max(...paths.map(p => p.right));
  const top = Math.min(...paths.map(p => p.top)), bottom = Math.max(...paths.map(p => p.bottom));
  return {text:e.textContent,lines:e.getClientRects().length,paths:paths.length,
    valid:svg.dataset.enhancement === 'notation' && svg.getAttribute('aria-hidden') === 'true' &&
      left >= text.left-16 && right <= text.right+16 && top >= text.top-16 && bottom <= text.bottom+16};
}))()`;
async function state(page, name) {
  const dimensions = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth})`);
  assert(dimensions.scroll <= dimensions.width + 1, `${page}/${name}: horizontal overflow`);
  const marks = await evaluate(geometry);
  assert.equal(marks.length, 5);
  assert(marks.every(m => m.valid && m.paths > 0), `${page}/${name}: ${JSON.stringify(marks)}`);
  assert.equal(await evaluate(`document.querySelectorAll('.rough-annotation').length`), 5);
  return { name, dimensions, marks };
}
function luminance(rgb) {
  const c = rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(x => x/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
const refresh = `document.dispatchEvent(new Event('papyra:refresh-annotations'))`;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert(port, 'Chrome failed to start');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = ({data}) => {
    const m = JSON.parse(data), call = pending.get(m.id);
    if (call) { pending.delete(m.id); m.error ? call.reject(Error(JSON.stringify(m.error))) : call.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args);
    if (m.method === 'Network.requestWillBeSent' && /^https?:/.test(m.params.request.url)) remoteRequests.push(m.params.request.url);
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.emulateNetworkConditions', {offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const library = await read('../skills/papyra/assets/rough-notation-0.5.1.iife.js');
  const runtime = await read('../skills/papyra/assets/annotations.js');
  const css = await read('../skills/papyra/assets/annotations.css');
  for (const name of names) {
    const expected = markdownAtoms(originals.get(name));
    const html = await read(`output/${name}.html`);
    assert(html.includes(library) && html.includes(runtime) && html.includes(css), `${name}: embedded assets differ`);
    await viewport(1440,1000);
    await navigate(new URL(`output/${name}.html`, root));
    assert.deepEqual(await evaluate(sourceAtoms), expected, `${name}: source Markdown content/order`);
    assert(await evaluate(`[...document.querySelectorAll('a[href^="#"]')].every(a => document.getElementById(a.getAttribute('href').slice(1)))`), `${name}: broken anchor`);
    assert.equal(await evaluate(`document.querySelectorAll('script[src],link[rel="stylesheet"]').length`),0);
    const states = [await state(name,'desktop')];
    const colors = await evaluate(`(() => {
      const e=document.querySelector('[data-notation="highlight"]');
      return {ink:getComputedStyle(e).color, background:getComputedStyle(e.previousElementSibling.querySelector('path')).stroke};
    })()`);
    const a=luminance(colors.ink), b=luminance(colors.background), contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert(contrast >= 4.5, `${name}: highlight contrast ${contrast}`);
    const deep = name === 'requirements-development' ? '#sec-state' : name === 'design-proposal' ? '#sec-options' : '#sec-budget';
    await screenshot(`${name}-desktop`);
    await screenshot(`${name}-desktop-deep`,deep);
    if (name === 'requirements-development') {
      for (const [value,next] of [['queued','running、cancelled'],['running','succeeded、failed、cancelled'],['succeeded','无'],['failed','无；重试创建新任务'],['cancelled','无']]) {
        await click(`[data-state="${value}"]`);
        assert.equal(await evaluate(`document.getElementById('sp-next').textContent`),next);
        await state(name,`state ${value}`);
      }
      await evaluate(`document.querySelector('[data-state="queued"]').focus()`);
      await key('Enter');
      assert.equal(await evaluate(`document.getElementById('sp-state').textContent`),'queued');
      await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.testCopied=text;}}})`);
      await click('[data-copy]');
      assert.equal(await evaluate(`window.testCopied`),await evaluate(`document.querySelector('pre code').textContent`));
      assert(await evaluate(`document.querySelector('.copy-msg').textContent.includes('已复制')`));
      await evaluate(`navigator.clipboard.writeText = async () => { throw Error('test denied'); }`);
      await click('[data-copy]');
      assert(await evaluate(`document.querySelector('.copy-msg').textContent.includes('复制失败')`));
      await state(name,'copy feedback refresh');
    } else if (name === 'design-proposal') {
      await click('.zone[data-zone="quiet"]');
      assert.equal(await evaluate(`document.activeElement.id`),'row-quiet');
      assert(await evaluate(`document.querySelector('.zone[data-zone="quiet"]').classList.contains('active')`));
    } else {
      await click('.toc a[href="#sec-risks"]');
      assert.equal(await evaluate('location.hash'),'#sec-risks');
    }
    for (const width of [390,320]) {
      await viewport(width);
      states.push(await state(name,`${width}px`));
      assert(await evaluate(`[...document.querySelectorAll('.table-wrap,.table-scroll')].every(e=>{ if(e.scrollWidth<=e.clientWidth)return true;e.scrollLeft=50;const moved=e.scrollLeft>0;e.scrollLeft=0;return moved;})`),`${name}: table local scrolling`);
      if (name === 'design-proposal') {
        assert.equal(await evaluate(`document.getElementById('toc-details').open`),false);
        await evaluate(`document.querySelector('#toc-details summary').focus()`); await key('Enter');
        assert.equal(await evaluate(`document.getElementById('toc-details').open`),true);
        await key('Enter');
      }
      await screenshot(`${name}-${width}`);
      await screenshot(`${name}-${width}-deep`,deep);
    }
    await viewport(720,500,2);
    states.push(await state(name,'200% reflow equivalent'));
    await viewport(1440,1000);
    await evaluate(`(() => { const e=document.createElement('div');e.id='test-shift';e.style.height='137px';document.body.prepend(e);${refresh}; })()`);
    await delay(750); states.push(await state(name,'custom layout refresh'));
    await evaluate(`document.getElementById('test-shift').remove();${refresh}`); await delay(750);
    await evaluate(`(() => { const e=document.querySelector('[data-notation="circle"]');const w=document.createElement('span');w.id='test-wrap';w.style.cssText='display:inline-block;width:2em;overflow-wrap:anywhere';e.before(w);w.append(e);${refresh}; })()`);
    await delay(750);
    assert(await evaluate(`document.querySelector('[data-notation="circle"]').getClientRects().length>1`));
    states.push(await state(name,'circle wraps to underline'));
    await evaluate(`(() => { const w=document.getElementById('test-wrap');w.replaceWith(w.querySelector('[data-notation]'));${refresh}; })()`);
    await delay(750);
    await evaluate(`(() => { const s=document.documentElement.style;s.setProperty('--notation-color','#8e4b10');s.setProperty('--notation-highlight','#ffdf8e');s.setProperty('--notation-highlight-ink','#241e14');${refresh}; })()`);
    await delay(750);
    assert.equal(await evaluate(`document.querySelector('[data-notation="highlight"]').previousElementSibling.querySelector('path').getAttribute('stroke')`),'#ffdf8e');
    assert.equal(await evaluate(`document.querySelector('[data-notation="underline"]').nextElementSibling.querySelector('path').getAttribute('stroke')`),'#8e4b10');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-notation="highlight"]')).color`),'rgb(36, 30, 20)');
    states.push(await state(name,'theme variables refresh'));
    await evaluate(`(() => { const p=document.querySelector('[data-notation]').closest('p,li');const d=document.createElement('details');d.id='test-details';d.open=true;p.before(d);d.append(p);d.open=false; })()`);
    await delay(100); await evaluate(`document.getElementById('test-details').open=true`); await delay(750);
    states.push(await state(name,'hidden then reopened'));
    // Reload to restore test-only DOM changes before printing and source comparison.
    await navigate(new URL(`output/${name}.html`,root));
    await send('Emulation.setEmulatedMedia',{media:'print'});
    assert(await evaluate(`[...document.querySelectorAll('.rough-annotation')].every(e=>getComputedStyle(e).display==='none')`));
    assert(await evaluate(`[...document.querySelectorAll('[data-notation]')].every(e=>getComputedStyle(e).textDecorationLine==='underline')`));
    assert(await evaluate(`(() => { const e=document.querySelector('[data-notation="highlight"]');return getComputedStyle(e).color===getComputedStyle(e.parentElement).color && getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'; })()`),`${name}: print ink fallback`);
    assert.deepEqual(await evaluate(sourceAtoms),expected,`${name}: print source`);
    assert(await evaluate(`[document.querySelector('h1'),document.querySelector('[data-source-meta]'),...document.querySelectorAll('main h2,main h3,main p,main li,main th,main td,main pre')].filter(e=>!e.closest('[data-enhancement]')).every(e=>e.getBoundingClientRect().height>0 && getComputedStyle(e).visibility!=='hidden')`),`${name}: hidden print source`);
    if (name === 'market-operations') assert(await evaluate(`[...document.querySelectorAll('.progress-fill,.b-fill')].every(e=>getComputedStyle(e).printColorAdjust==='exact')`));
    const pdf=await send('Page.printToPDF',{printBackground:false,preferCSSPageSize:true});
    await writeFile(join(output,`${name}.pdf`),Buffer.from(pdf.data,'base64'));
    await send('Emulation.setEmulatedMedia',{media:''});
    const moved=new URL(`file://${join(output,`${name}.html`)}`);
    await writeFile(moved,html);await navigate(moved);states.push(await state(name,'moved file offline'));
    await send('Emulation.setScriptExecutionDisabled',{value:true});await navigate(moved,false);
    await send('Emulation.setScriptExecutionDisabled',{value:false});
    assert.equal(await evaluate(`document.querySelectorAll('.rough-annotation').length`),0);
    assert.deepEqual(await evaluate(sourceAtoms),expected,`${name}: no-script source`);
    assert(await evaluate(`[...document.querySelectorAll('[data-notation]')].every(e=>getComputedStyle(e).textDecorationLine==='underline' || getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)')`));
    assert.equal(digest(await read(`${name}.md`)),digest(originals.get(name)));
    results.push({name,sourceAtoms:expected.length,annotations:5,highlightContrast:contrast,states,inputSHA256:digest(originals.get(name))});
    console.log(`PASS ${name}: ${expected.length} source atoms, 5 annotations, ${states.length} layouts, offline, print, no-script.`);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(remoteRequests,[]);
  await writeFile(join(output,'results.json'),JSON.stringify({results,errors,remoteRequests},null,2));
  console.log(`Artifacts: ${output}`);
} finally {
  socket?.close();
  if (!launchError && child.exitCode===null) {
    const exited=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await Promise.race([exited,delay(3000)]);
    if(child.exitCode===null){child.kill('SIGKILL');await exited;}
  }
  await rm(profile,{recursive:true,force:true});
}
