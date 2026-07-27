import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1500,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(''+e.message)); p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errs.push('console:'+m.text());});
await p.goto('http://127.0.0.1:5199/',{waitUntil:'networkidle'});
await p.getByRole('button',{name:'Home',exact:true}).click();
await p.waitForSelector('.next-game'); await p.locator('.next-game').click();
await p.waitForSelector('button:has-text("Entra in campo")'); await p.locator('button:has-text("Entra in campo")').click();
await p.waitForSelector('.game-screen');
// apri un modale sostituzione se disponibile
for(const lbl of ['Cambio lanc.','Pinch-hit']){const el=await p.$(`button:has-text("${lbl}")`); if(el&&!(await el.isDisabled())){await el.click();break;}}
await p.waitForTimeout(300);
console.log('submodal presente:', !!(await p.$('.modal.submodal')));
console.log('subrow count:', (await p.$$('.subrow')).length);
console.log('errori:', errs.length, errs.slice(0,4));
await b.close();
