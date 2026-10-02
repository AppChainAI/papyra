// node samples/papyra/check.mjs /path/to/tools/node_modules [pages-directory]
// Tests use external playwright + marked; generated pages need neither dependency.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),samples=resolve(here,'..');
const pages=resolve(process.argv[3]||here),evidence=resolve(pages,'evidence');
const require=createRequire(resolve(process.argv[2]||'node_modules','../package.json'));
const {chromium}=require('playwright'),{marked}=require('marked');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const names=['market-operations','requirements-development','design-proposal'];
const preserved=names.map(n=>resolve(samples,n+'.md'));
const before=Object.fromEntries(preserved.map(p=>[p,hash(p)]));
mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
try{
 for(const name of names){
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(resolve(pages,name+'.html')).href);
  const expected=marked.parse(readFileSync(resolve(samples,name+'.md'),'utf8'),{gfm:true});
  const contentComplete=await page.evaluate(html=>{
   const source=new DOMParser().parseFromString(html,'text/html').body;
   const actual=document.querySelector('.original').cloneNode(true);
   actual.querySelectorAll('[data-enhancement]').forEach(n=>n.remove());
   const normalize=s=>s.replace(/\s+/g,' ').trim();
   return normalize(source.textContent)===normalize(actual.textContent);
  },expected);
  assert.ok(contentComplete,name+': source text changed');
  assert.ok(await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1)))),name+': missing anchor target');
  const checks=page.locator('.original input[type=checkbox]'),count=await checks.count();
  await checks.first().check();assert.equal(await page.locator('.inline-status output').textContent(),`1 / ${count} 项已标记`);
  await page.getByRole('button',{name:'清除阅读标记'}).click();assert.equal(await page.locator('.inline-status output').textContent(),`0 / ${count} 项已标记`);
  if(name==='market-operations'){
   await page.locator('#channel').selectOption('2');
   assert.equal(await page.locator('#channel-cost').textContent(),'180.00 元');
   assert.match(await page.locator('#finding').textContent(),/周汇总不能证明连续两天超标/);
   assert.equal(await page.locator('#action-link').getAttribute('href'),'#action-3');
   await page.locator('#action-link').click();assert.match(page.url(),/#action-3$/);
   assert.match(await page.locator('#action-3').textContent(),/暂停低转化素材/);
   await page.locator('#channel').selectOption('1');
   assert.equal(await page.locator('#channel-count').textContent(),'62 人');
   assert.equal(await page.locator('#action-link').getAttribute('href'),'#action-4');
   await page.locator('.calculator summary').click();
   assert.match(await page.locator('#budget-result').textContent(),/约 242 个报名/);
   await page.locator('#budget-0').fill('12000');assert.match(await page.locator('#budget-result').textContent(),/超预算 9,600 元/);
   for(const value of ['-100','','101']){await page.locator('#budget-0').fill(value);assert.match(await page.locator('#budget-result').textContent(),/请输入/)}
   await page.locator('#budget-0').fill('2400');await page.locator('.calculator summary').click();
   await page.locator('#channel').selectOption('0');
  }
  if(name==='requirements-development'){
   const expectedStates={queued:/running 或 cancelled/,running:/succeeded、failed 或 cancelled/,succeeded:/终态/,failed:/重试创建新任务/,cancelled:/提交前取消不得交付/};
   for(const [state,text] of Object.entries(expectedStates)){
    await page.locator(`[data-state="${state}"]`).click();assert.match(await page.locator('#state-rule').textContent(),text);
    assert.equal(await page.locator(`[data-state="${state}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-state][aria-pressed=true]').count(),1);
   }
   await page.locator('[data-state=failed]').click();await page.locator('#state-case').click();
   assert.match(page.url(),/#test-T05$/);assert.match(await page.locator('#test-T05').textContent(),/状态 failed/);
   await page.waitForFunction(()=>document.querySelector('#test-T05').classList.contains('trace-active'));
   assert.ok(await page.locator('#test-T05').evaluate(n=>n.classList.contains('trace-active')));
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true}));
   await page.getByRole('button',{name:'复制代码'}).first().click();
   assert.match(await page.locator('.copy-result').first().textContent(),/手动复制/);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true}));
   await page.getByRole('button',{name:'复制代码'}).first().click();assert.match(await page.evaluate(()=>window.copied),/POST \/api\/exports/);
   assert.equal(await page.locator('.copy-result').first().textContent(),'已复制');
   await page.locator('[data-state=queued]').click();
  }
  if(name==='design-proposal'){
   await page.locator('[data-plan=A]').click();assert.equal(await page.locator('#seats').textContent(),'24 席');
   assert.equal(await page.locator('#estimate').textContent(),'68,500 元');assert.match(await page.locator('#budget-margin').textContent(),/21,500 元/);
   assert.match(await page.locator('#plan-exchange').textContent(),/多 6 席，少 17,700 元/);
   assert.match(await page.locator('#plan-voice').textContent(),/同处一个声场/);
   assert.match(await page.locator('#plan-evidence').textContent(),/A 未提供分区面积/);
   assert.equal(await page.locator('#s3 th.selected-column').textContent(),'A：长桌共读');
   await page.locator('[data-plan=B]').click();assert.equal(await page.locator('#estimate').textContent(),'86,200 元');
   assert.match(await page.locator('#plan-exchange').textContent(),/不能保证完全隔音/);
   await page.locator('[data-zone="3"]').click();assert.match(await page.locator('#zone-usage').textContent(),/20 平方米/);
   assert.match(await page.locator('#zone-caution').textContent(),/不能压缩通道/);
   assert.match(await page.locator('#s4 tr.zone-selected').textContent(),/通道与缓冲区/);
   await page.locator('[data-zone="0"]').click();
   // Fast repeated selections must settle on the actual last selection.
   await page.evaluate(()=>{for(let i=0;i<8;i++)document.querySelector(`[data-plan=${i%2?'B':'A'}]`).click()});
   assert.equal(await page.locator('#seats').textContent(),'18 席');
  }
  // Capture one actual interaction state per page, with nearby source evidence.
  const target=name==='market-operations'?'#channel':name==='requirements-development'?'[data-state=failed]':'[data-plan=A]';
  if(name==='market-operations')await page.locator(target).selectOption('2');else await page.locator(target).click();
  await page.locator(target).evaluate(el=>{const panel=el.closest('[data-enhancement]');scrollTo({top:panel.getBoundingClientRect().top+scrollY-60,behavior:'instant'})});await page.waitForTimeout(100);await page.screenshot({path:resolve(evidence,name+'-interaction.png')});
  await page.evaluate(()=>window.print=()=>window.printCalled=true);await page.locator('#print').click();assert.equal(await page.evaluate(()=>window.printCalled),true);
  await page.goto(pathToFileURL(resolve(pages,name+'.html')).href);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'skip');
  await page.keyboard.press('Enter');assert.match(page.url(),/#document$/);
  for(const [width,height] of [[1440,1000],[390,844],[320,844]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>{document.activeElement.blur();scrollTo({top:0,left:0,behavior:'instant'})});await page.waitForTimeout(100);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: overflow ${width}`);
   await page.screenshot({path:resolve(evidence,`${name}-${width}.png`)});
   if(width!==320)await page.screenshot({path:resolve(evidence,`${name}-${width}-full.png`),fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.documentElement.style.zoom='2';scrollTo({top:0,left:0,behavior:'instant'})});
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': 200% overflow');
  await page.screenshot({path:resolve(evidence,name+'-200percent.png')});await page.evaluate(()=>document.documentElement.style.zoom='');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  await page.emulateMedia({media:'print'});
  assert.ok(await page.locator('.chapter').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).display!=='none')));
  assert.equal(await page.locator('.contents').evaluate(n=>getComputedStyle(n).display),'none');
  await page.pdf({path:resolve(evidence,name+'-print.pdf'),format:'A4',printBackground:true});
  assert.deepEqual(errors,[],name+': JS errors');assert.deepEqual(network,[],name+': external requests');
  const noJS=await browser.newContext({javaScriptEnabled:false,offline:true,viewport:{width:390,height:844}});
  const plain=await noJS.newPage();await plain.goto(pathToFileURL(resolve(pages,name+'.html')).href);
  assert.ok(await plain.locator('.original').isVisible());assert.equal(await plain.locator('.chapter').count(),await page.locator('.chapter').count());await noJS.close();
  results.push({page:name,sourceSha256:hash(resolve(samples,name+'.md')),htmlBytes:readFileSync(resolve(pages,name+'.html')).length,originalText:'complete',offline:true,externalRequests:network.length,javascriptErrors:errors.length,interactions:'passed',viewports:[1440,390,320],zoom:'CSS 200%, no page overflow',keyboard:'skip entry tested',reducedMotion:'passed',print:'entry and CSS checked, PDF generated',noJavaScript:'original document visible'});
  await context.close();
 }
 for(const [file,digest]of Object.entries(before))assert.equal(hash(file),digest,'input or baseline changed: '+file);
 writeFileSync(resolve(evidence,'checks.json'),JSON.stringify({skill:'papyra',version:'0.1.0',browser:browser.version(),evaluation:'same-agent smoke test; not independent or causal comparison',clipboard:'unavailable branch plus captured adapter; not system clipboard verification',results},null,2)+'\n');
 console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}
