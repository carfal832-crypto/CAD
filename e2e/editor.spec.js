import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
test('build, edit, undo, persist, save/open and export STL',async({page})=>{
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('/');await page.getByRole('button',{name:'Kub Bygg en stadig bas'}).click();
  await expect(page.locator('#count')).toHaveText('1 form');
  await page.locator('.measurements summary').click();await page.locator('[data-field="w"]').fill('42');await page.locator('[data-field="w"]').press('Tab');
  await page.getByRole('button',{name:'Kopiera'}).click();await expect(page.locator('#count')).toHaveText('2 former');
  await page.getByRole('button',{name:'Ångra',exact:true}).click();await expect(page.locator('#count')).toHaveText('1 form');
  await page.getByRole('button',{name:'Gör om',exact:true}).click();await expect(page.locator('#count')).toHaveText('2 former');
  await page.reload();await expect(page.locator('#count')).toHaveText('2 former');
  await page.locator('.object').first().click();await expect(page.locator('[data-field="w"]')).toHaveValue('42');
  const projectEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Spara projekt'}).click();const project=await projectEvent;const projectPath=await project.path();const saved=JSON.parse(await fs.readFile(projectPath,'utf8'));expect(saved.items).toHaveLength(2);
  await page.getByRole('button',{name:'Ta bort',exact:true}).click();await expect(page.locator('#count')).toHaveText('1 form');await page.locator('#file').setInputFiles({name:'bygge.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await expect(page.locator('#count')).toHaveText('2 former');
  await page.getByRole('button',{name:'Förbered utskrift'}).click();await expect(page.locator('dialog')).toBeVisible();const stlEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Hämta STL-fil'}).click();const stl=await stlEvent;const data=await fs.readFile(await stl.path());expect(data.length).toBeGreaterThan(84);expect(data.length).toBe(84+data.readUInt32LE(80)*50);
  await page.getByRole('button',{name:'Stäng',exact:true}).click();await page.getByRole('button',{name:'Testa en robot'}).click();await expect(page.locator('#count')).toHaveText('8 former');await page.screenshot({path:'/tmp/formverkstan-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
test('mobile layout fits and invalid imports preserve project',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Boll',exact:true}).click();
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"items":[{}]}')});await expect(page.locator('#toast')).toContainText('ogiltig');await expect(page.locator('#count')).toHaveText('1 form');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/formverkstan-mobile.png',fullPage:true});
});

test('dragging on the plate changes position and can be undone',async({page})=>{
 await page.goto('/');await page.locator('[data-add="box"]').click();await page.locator('#top-view').click();await page.waitForTimeout(300);
 const canvas=await page.locator('canvas').boundingBox();const x=canvas.x+canvas.width/2,y=canvas.y+canvas.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+65,y+20,{steps:8});await page.mouse.up();
 const position=await page.locator('[data-field="x"]').inputValue();expect(Number(position)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Ångra',exact:true}).click();await page.locator('.object').click();await expect(page.locator('[data-field="x"]')).toHaveValue('0');
});

test('place-on workflow, unite, rotate, undo and reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('[data-add="box"]').click();await page.locator('.measurements summary').click();await page.locator('[data-field="h"]').fill('15');await page.locator('[data-field="h"]').press('Tab');
 await page.locator('[data-add="cylinder"]').click();expect(await page.locator('[data-field="x"]').inputValue()).not.toBe('0');
 await page.locator('#stack').click();await expect(page.locator('#selection-help')).toContainText('underst');await page.locator('.object').first().click();await expect(page.locator('[data-field="z"]')).toHaveValue('14.5');
 await page.locator('#combine').click();await expect(page.locator('#count')).toHaveText('1 form');await expect(page.locator('#shape-name')).toHaveText('Förenad form');
 await page.locator('[data-turn="rx"]').click();await expect(page.locator('[data-field="rx"]')).toHaveValue('90');
 await page.locator('#rotate-tool').click();await expect(page.locator('#selection-help')).toContainText('färgad ring');await page.screenshot({path:'/tmp/formverkstan-rotate.png',fullPage:true});
 await page.reload();await page.locator('.object').click();await expect(page.locator('[data-field="rx"]')).toHaveValue('90');
 const pending=page.waitForEvent('download');await page.locator('#save').click();const d=await pending;const project=JSON.parse(await fs.readFile(await d.path(),'utf8'));expect(project.items[0].children).toHaveLength(2);
 await page.locator('#print').click();const stlPending=page.waitForEvent('download');await page.locator('#download-stl').click();const stl=await stlPending;expect((await fs.stat(await stl.path())).size).toBeGreaterThan(84);expect(errors).toEqual([]);
});

test('rotation ring changes the actual model and undo restores it',async({page})=>{
 await page.goto('/');await page.locator('[data-add="box"]').click();await page.locator('#top-view').click();await page.locator('#rotate-tool').click();await page.waitForTimeout(300);
 const c=await page.locator('canvas').boundingBox(),cx=c.x+c.width/2,cy=c.y+c.height/2,r=c.height*.102;
 await page.mouse.move(cx+r/Math.sqrt(2),cy+r/Math.sqrt(2));await page.waitForTimeout(100);await page.mouse.down();
 for(let step=1;step<=12;step++){const angle=Math.PI/4+step*Math.PI/24;await page.mouse.move(cx+r*Math.cos(angle),cy+r*Math.sin(angle));}
 await page.mouse.up();expect(Math.abs(Number(await page.locator('[data-field="angle"]').inputValue()))).toBeGreaterThan(30);
 await page.locator('#undo').click();await page.locator('.object').click();await expect(page.locator('[data-field="angle"]')).toHaveValue('0');
 await page.locator('#size-tool').click();await page.waitForTimeout(100);await page.mouse.move(cx+c.height*.109,cy);await page.waitForTimeout(100);await page.mouse.down();await page.mouse.move(cx+c.height*.16,cy,{steps:10});await page.mouse.up();expect(Number(await page.locator('[data-field="w"]').inputValue())).toBeGreaterThan(35);
});

test('standalone download works without network: rotate, stack, unite and export',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
 await page.setContent(await fs.readFile('dist/formverkstan.html','utf8'));
 await page.locator('[data-add="box"]').click();await page.locator('[data-add="cylinder"]').click();
 await page.locator('[data-turn="ry"]').click();await page.locator('#stack').click();await page.locator('.object').first().click();await page.locator('#combine').click();
 await expect(page.locator('#shape-name')).toHaveText('Förenad form');await page.locator('#print').click();const pending=page.waitForEvent('download');await page.locator('#download-stl').click();const d=await pending;const bytes=await fs.readFile(await d.path());expect(bytes.length).toBe(84+bytes.readUInt32LE(80)*50);expect(errors).toEqual([]);
});

test('drag a new block from the library onto the plate without typing',async({page})=>{
 await page.goto('/');await page.locator('#top-view').click();await page.waitForTimeout(300);
 const c=await page.locator('canvas').boundingBox(),button=await page.locator('[data-add="box"]').boundingBox();
 await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();await page.mouse.move(c.x+c.width/2+95,c.y+c.height/2+30,{steps:15});await page.mouse.up();
 await expect(page.locator('#count')).toHaveText('1 form');expect(Number(await page.locator('[data-field="x"]').inputValue())).toBeGreaterThan(15);await expect(page.locator('[data-field="w"]')).not.toBeVisible();
 await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('0 former');
});

test('lift a block using the blue arrow without typing',async({page})=>{
 await page.goto('/');await page.locator('[data-add="box"]').click();await page.waitForTimeout(300);
 const c=await page.locator('canvas').boundingBox(),cx=c.x+c.width/2,cy=c.y+c.height/2;
 await page.mouse.move(cx,cy-c.height*.095);await page.waitForTimeout(100);await page.mouse.down();await page.mouse.move(cx,cy-c.height*.17,{steps:12});await page.mouse.up();
 expect(Number(await page.locator('[data-field="z"]').inputValue())).toBeGreaterThan(5);
 await page.locator('#undo').click();await page.locator('.object').click();await expect(page.locator('[data-field="z"]')).toHaveValue('0');
});
