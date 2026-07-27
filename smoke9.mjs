import { chromium } from 'playwright-core';
const OUT='/tmp/claude-0/-home-user-MLBSim/c8f05f16-6c57-56bc-be39-dafed76b9bea/scratchpad';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1500,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(''+e.message)); p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errs.push('c:'+m.text());});
await p.goto('http://127.0.0.1:5199/',{waitUntil:'domcontentloaded'});
// aspetta che finisca "Caricamento..."
await p.waitForFunction(()=>!/Caricamento/.test(document.body.innerText), {timeout:20000}).catch(()=>{});
await p.waitForTimeout(800);
const nextGame = await p.$('.next-game');
console.log('landing pronta, next-game:', !!nextGame);
if(nextGame){
  await nextGame.click();
  await p.waitForSelector('button:has-text("Entra in campo")',{timeout:8000});
  await p.locator('button:has-text("Entra in campo")').click();
  await p.waitForSelector('.game-screen',{timeout:8000});
  for(const lbl of ['Cambio lanc.','Pinch-hit']){const el=await p.$(`button:has-text("${lbl}")`); if(el&&!(await el.isDisabled())){await el.click();break;}}
  await p.waitForTimeout(300);
  console.log('game-screen OK, submodal:', !!(await p.$('.modal.submodal')), '| subrows:', (await p.$$('.subrow')).length);
}
console.log('errori:', errs.length, errs.slice(0,5));
await b.close();
