import './style.css';
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { geometry,transform,names,validateProject,exportSTL,combine,stackOn,boundsOf } from './model.js';
const $=s=>document.querySelector(s);
const createId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
$('#app').innerHTML=`
<header><a class="brand" href="./"><span class="brand-icon">◈</span> formverkstan<span class="beta">VERSION 3</span></a><div class="file-actions"><button id="open">Öppna</button><button id="save">Spara projekt</button><button class="primary" id="print">↗ Förbered utskrift</button></div></header>
<main><aside class="library"><div class="eyebrow">FRÅN IDÉ TILL VERKLIGHET</div><h1>Vad vill du<br>bygga idag?</h1><p class="muted">Börja med en form.<br>Gör den till din egen.</p><h2>1 <span>Välj en form</span></h2><div class="shapes"><button data-add="box"><span class="shape cube"></span><b>Kub</b><small>Bygg en stadig bas</small></button><button data-add="cylinder"><span class="shape cylinder"></span><b>Cylinder</b><small>Hjul, torn eller en knapp</small></button><button data-add="sphere"><span class="shape sphere"></span><b>Boll</b><small>Något lite rundare</small></button></div><div class="idea"><span>✦ LITEN IDÉ</span><b>Bygg en liten robot!</b><p>En kub som kropp, en boll som huvud. Vad blir nästa del?</p><button id="example">Testa en robot ↗</button></div><div class="local-note">● Ditt bygge sparas i den här webbläsaren</div></aside>
<section class="workspace"><div class="workspace-top"><div><span class="live-dot"></span><strong>Mitt bygge</strong><span id="count">0 former</span></div><div class="history"><button id="undo" aria-label="Ångra">↶</button><button id="redo" aria-label="Gör om">↷</button></div></div><div class="build-tools"><button id="move-tool" aria-pressed="true">Flytta</button><button id="rotate-tool" aria-pressed="false">Rotera</button><button id="size-tool" aria-pressed="false">Storlek</button><button id="multi-tool" aria-pressed="false">Välj flera</button><button id="stack" disabled>Sätt ovanpå</button><button id="align" disabled>Centrera</button><button id="combine" disabled>Förena</button></div><div id="selection-help">Dra in ett block från vänster. Dra blocket på plattan för att flytta det.</div><div id="viewport"><div class="canvas-label">DIN BYGGPLATTA <span>Mått i millimeter</span></div><div id="empty"><b>Din nästa idé börjar här</b><span>Välj en form till vänster för att börja.</span></div><div class="view-controls"><button id="reset-view">⌂ Hela bygget</button><button id="top-view">Ovanifrån</button></div><div class="canvas-hint">Dra en form för att flytta · Dra bakgrunden för att rotera · Scrolla för att zooma</div></div><footer><span>✦ Små former. Stora idéer.</span><span>Rutnät: 10 mm · Arbetsyta: 200 × 200 mm</span></footer></section>
<aside class="inspector"><h2>2 <span>Gör den till din</span></h2><div id="no-selection"><span>↖</span><h3>Välj en form</h3><p>Klicka på en form i bygget för att ändra storlek, färg och plats.</p></div><div id="properties" hidden><div class="selected-name"><span id="swatch"></span><h3 id="shape-name"></h3></div><div class="drag-guide">Dra blocket för att flytta det.<br>Dra pilarna för att flytta eller lyfta.<br>Välj <b>Storlek</b> och dra i fyrkanterna.</div><details class="measurements"><summary>Exakta mått</summary><label class="section-label">STORLEK <span>mm</span></label><div class="dimensions">${[['w','Bredd'],['d','Djup'],['h','Höjd']].map(([key,label])=>`<label>${label}<input type="number" data-field="${key}" min="1" max="200" step="1"></label>`).join('')}</div></details><details class="precise"><summary>Exakt placering</summary><label class="section-label">PLATS <span>mm</span></label><div class="dimensions">${[['x','Sidled'],['y','Framåt'],['z','Lyft']].map(([key,label])=>`<label>${label}<input type="number" data-field="${key}" min="${key==='z'?0:-100}" max="${key==='z'?200:100}" step="1"></label>`).join('')}</div></details><label class="section-label">ROTATION <span>grader</span></label><div class="dimensions">${[['rx','Framåt'],['ry','Åt sidan'],['angle','Runt']].map(([key,label])=>`<label>${label}<input type="number" data-field="${key}" min="-360" max="360" step="15"><button class="quarter-turn" data-turn="${key}" aria-label="Vrid ${label} 90 grader">+90°</button></label>`).join('')}</div><button id="on-plate">Lägg på plattan</button><label class="section-label">FÄRG PÅ SKÄRMEN</label><div class="colors">${['#ef916b','#78ada5','#d7b75f','#9796cb','#84accb'].map(c=>`<button data-color="${c}" style="--color:${c}" aria-label="Färg ${c}"></button>`).join('')}</div><p class="small muted">Utskriftens färg bestäms av materialet i skrivaren.</p><div class="edit-actions"><button id="duplicate">⧉ Kopiera</button><button id="remove">Ta bort</button></div></div><div class="object-section"><label class="section-label">FORMER I DITT BYGGE</label><div id="objects"></div></div><div class="tip"><b>Tips från verkstan</b><p>Välj delen du vill flytta. Tryck Sätt ovanpå och klicka på basen. Tryck Förena för att flytta båda som en del. Ångra delar upp dem igen.</p></div></aside></main>
<div id="toast" role="status"></div><input type="file" id="file" accept=".json" hidden><dialog id="print-dialog"><button class="close" aria-label="Stäng">×</button><div class="eyebrow">NÄSTA STEG: EN RIKTIG SAK</div><h2>Skriv ut med USB-minne</h2><p>Hämta din modell som en STL-fil i millimeter. Former som överlappar slås ihop.</p><ol><li><b>Hämta din modell.</b> Klicka på knappen nedan.</li><li><b>Öppna i skrivarens slicer.</b> Välj rätt profil för din Sindoh och kontrollera storlek, material och stöd.</li><li><b>Spara utskriftsjobbet på USB-minnet.</b> Använd skrivarprogrammets export för just din skrivare.</li><li><b>Sätt USB-minnet i skrivaren.</b> Välj utskriftsjobbet på skrivarens skärm och starta där.</li></ol><div class="print-note">STL-filen är en modell, inte ett färdigt utskriftsjobb. Förbered den i skrivarprogrammet först. Guiden gäller USB-minne, inte USB-kabel mellan dator och skrivare.</div><p class="small">Kontrollera storleken mot din skrivares byggvolym och granska förhandsvisningen i slicern. Lösa delar och former i luften kan behöva flyttas eller få stöd.</p><button class="primary" id="download-stl">↓ Hämta STL-fil</button></dialog>`;
let items=[],selected=null,undo=[],redo=[];
let selection=new Set(),multi=false,toolMode='move',placement=null;
function select(id,extend=false){if(extend){if(selection.has(id))selection.delete(id);else selection.add(id);}else selection=new Set([id]);selected=selection.has(id)?id:[...selection].at(-1)||null;}
const storageKey='formverkstan-project-v1';
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
try{const saved=localStorage.getItem(storageKey);if(saved)items=validateProject(JSON.parse(saved));}catch{toast('Det sparade bygget kunde inte läsas. Du kan öppna en projektfil.');}
const viewport=$('#viewport'),scene=new THREE.Scene();scene.background=new THREE.Color('#eeefea');
const camera=new THREE.PerspectiveCamera(38,1,.1,2000);camera.up.set(0,0,1);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{viewport.innerHTML='<p>3D-vyn behöver WebGL. Prova en uppdaterad Chrome, Edge eller Firefox med grafikacceleration.</p>';throw Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.prepend(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.025;controls.minDistance=35;controls.maxDistance=650;
function resetView(){camera.position.set(245,-310,255);controls.target.set(0,0,15);controls.update();}resetView();
scene.add(new THREE.HemisphereLight(0xffffff,0x9ca6a0,2.6));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-70,-100,250);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-170,right:170,top:170,bottom:-170});light.shadow.bias=-.001;scene.add(light);
const plate=new THREE.Mesh(new THREE.BoxGeometry(200,200,2),new THREE.MeshStandardMaterial({color:'#fafbf7',roughness:.85}));plate.position.z=-1.2;plate.receiveShadow=true;scene.add(plate);
const grid=new THREE.GridHelper(200,20,0xb0bdb4,0xd6dcd5);grid.rotation.x=Math.PI/2;grid.position.z=-.1;scene.add(grid);
const meshes=new THREE.Group();scene.add(meshes);let selectionBoxes=[];
const rotator=new TransformControls(camera,renderer.domElement);rotator.setMode('translate');rotator.setTranslationSnap(1);rotator.setRotationSnap(Math.PI/12);rotator.setScaleSnap(.1);rotator.setSize(.85);scene.add(rotator.getHelper());
let rotating=false;
rotator.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;rotating=e.value;});
rotator.addEventListener('mouseDown',()=>checkpoint());
rotator.addEventListener('objectChange',()=>{for(const box of selectionBoxes)box.update();});
rotator.addEventListener('mouseUp',()=>{
 const mesh=rotator.object,item=items.find(i=>i.id===selected);if(!mesh||!item)return;
 const degrees=r=>Math.round(THREE.MathUtils.radToDeg(r)*100)/100;
 if(toolMode==='move'){item.x=Math.max(-100,Math.min(100,mesh.position.x));item.y=Math.max(-100,Math.min(100,mesh.position.y));}else if(toolMode==='scale'){item.w=Math.max(1,Math.min(200,Math.abs(mesh.scale.x)));item.d=Math.max(1,Math.min(200,Math.abs(mesh.scale.y)));item.h=Math.max(1,Math.min(200,Math.abs(mesh.scale.z)));}else{item.rx=degrees(mesh.rotation.x);item.ry=degrees(mesh.rotation.y);item.angle=degrees(mesh.rotation.z);}
 item.z=Math.max(0,Math.min(200,new THREE.Box3().setFromObject(mesh).min.z));changed();
});
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,items}));}catch{toast('Webbläsaren kunde inte autospara. Använd Spara projekt.');}}
function checkpoint(){undo.push(JSON.stringify(items));if(undo.length>60)undo.shift();redo=[];}
function refresh(){
  selection=new Set([...selection].filter(id=>items.some(i=>i.id===id)));
  if(selected&&!selection.has(selected))selection=new Set([selected]);
  rotator.detach();
  for(const mesh of [...meshes.children]){mesh.geometry.dispose();mesh.material.dispose();meshes.remove(mesh);}
  for(const box of selectionBoxes){scene.remove(box);box.geometry.dispose();box.material.dispose();}selectionBoxes=[];
  for(const item of items){const m=transform(new THREE.Mesh(geometry(item),new THREE.MeshStandardMaterial({color:item.color,roughness:.45})),item);m.userData.id=item.id;m.castShadow=true;m.receiveShadow=true;meshes.add(m);if(selection.has(item.id)){const box=new THREE.BoxHelper(m,0x26776c);scene.add(box);selectionBoxes.push(box);}if(item.id===selected&&!placement&&selection.size===1)rotator.attach(m);}
  const item=items.find(i=>i.id===selected);$('#properties').hidden=!item;$('#no-selection').hidden=!!item;
  if(item){$('#shape-name').textContent=names[item.type];$('#swatch').style.background=item.color;document.querySelectorAll('[data-field]').forEach(el=>el.value=item[el.dataset.field]||0);document.querySelectorAll('[data-color]').forEach(el=>el.classList.toggle('chosen',el.dataset.color===item.color));}
  $('#count').textContent=`${items.length} ${items.length===1?'form':'former'}`;$('#empty').hidden=items.length>0;$('#undo').disabled=!undo.length;$('#redo').disabled=!redo.length;
  $('#combine').disabled=selection.size<2;$('#align').disabled=selection.size<2;$('#stack').disabled=selection.size<1||selection.size>2;$('#stack').setAttribute('aria-pressed',String(!!placement));
  $('#selection-help').textContent=placement?'Klicka på formen som ska vara underst. Tryck Esc för att avbryta.':selection.size>1?`${selection.size} former valda. Centrera, sätt ovanpå eller förena dem.`:toolMode==='scale'?'Dra i en färgad fyrkant för att ändra storlek.':toolMode==='rotate'?'Dra i en färgad ring för att rotera. Steg: 15°. Du kan också använda +90° i panelen.':'Dra blocket för att flytta. Dra den blå pilen för att lyfta. Dra in fler block från vänster.';
  $('#objects').replaceChildren();for(const i of items){const b=document.createElement('button');b.className='object'+(selection.has(i.id)?' active':'');b.setAttribute('aria-pressed',String(selection.has(i.id)));const dot=document.createElement('span');dot.style.background=i.color;b.append(dot,document.createTextNode(names[i.type]));b.onclick=e=>{if(placeOn(i.id))return;select(i.id,multi||e.shiftKey);refresh();};$('#objects').append(b);}
}
function changed(){persist();refresh();}
function add(type,drop=null){if(items.length>=60)return toast('Du kan ha högst 60 former i ett bygge.');checkpoint();const item={id:createId(),type,w:30,d:30,h:30,x:0,y:0,z:0,angle:0,color:({box:'#ef916b',cylinder:'#78ada5',sphere:'#d7b75f'})[type]};const candidates=[];for(let x=-80;x<=80;x+=40)for(let y=-80;y<=80;y+=40)candidates.push({x,y});candidates.sort((a,b)=>a.x*a.x+a.y*a.y-b.x*b.x-b.y*b.y);
 const occupied=items.map(boundsOf);const free=candidates.find(p=>occupied.every(b=>p.x+18<b.min.x||p.x-18>b.max.x||p.y+18<b.min.y||p.y-18>b.max.y));if(drop){item.x=Math.round(drop.x);item.y=Math.round(drop.y);}else if(free){item.x=free.x;item.y=free.y;}
 items.push(item);select(item.id);changed();}
document.querySelectorAll('[data-add]').forEach(el=>{
 let start=null,suppressClick=false;
 el.onclick=()=>{if(suppressClick){suppressClick=false;return;}add(el.dataset.add);};
 el.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};el.setPointerCapture(e.pointerId);});
 el.addEventListener('pointermove',e=>{if(!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>8){start.moved=true;el.classList.add('dragging-shape');viewport.classList.add('drop-ready');}});
 el.addEventListener('pointerup',e=>{if(!start)return;const moved=start.moved;start=null;el.classList.remove('dragging-shape');viewport.classList.remove('drop-ready');if(!moved)return;suppressClick=true;setTimeout(()=>suppressClick=false,0);
 const rect=renderer.domElement.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return;
 ray(e);const p=raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1),0),new THREE.Vector3());
 if(!p||Math.abs(p.x)>100||Math.abs(p.y)>100)return toast('Släpp blocket på den rutiga plattan.');add(el.dataset.add,p);
 });
 el.addEventListener('pointercancel',()=>{start=null;el.classList.remove('dragging-shape');viewport.classList.remove('drop-ready');});
});
document.querySelectorAll('[data-field]').forEach(el=>el.onchange=()=>{const item=items.find(i=>i.id===selected),value=Number(el.value);if(!item)return;if(el.value===''||!Number.isFinite(value)||value<Number(el.min)||value>Number(el.max)){toast(`Välj ett tal mellan ${el.min} och ${el.max}.`);refresh();return;}checkpoint();item[el.dataset.field]=value;changed();});
document.querySelectorAll('[data-color]').forEach(el=>el.onclick=()=>{const i=items.find(i=>i.id===selected);if(i){checkpoint();i.color=el.dataset.color;changed();}});
$('#remove').onclick=()=>{if(!selected)return;checkpoint();items=items.filter(i=>!selection.has(i.id));selected=null;selection.clear();placement=null;changed();};
$('#duplicate').onclick=()=>{const i=items.find(i=>i.id===selected);if(!i||items.length>=60)return;checkpoint();const copy={...structuredClone(i),id:createId(),x:Math.min(100,i.x+15),y:Math.min(100,i.y+15)};items.push(copy);select(copy.id);changed();};
$('#undo').onclick=()=>{if(!undo.length)return;redo.push(JSON.stringify(items));items=JSON.parse(undo.pop());selected=null;selection.clear();placement=null;changed();};$('#redo').onclick=()=>{if(!redo.length)return;undo.push(JSON.stringify(items));items=JSON.parse(redo.pop());selected=null;selection.clear();placement=null;changed();};
$('#example').onclick=()=>{if(items.length>54)return toast('Det behövs plats för 6 former. Ta bort några först.');checkpoint();const base={x:0,y:0,angle:0};for(const part of [{type:'box',w:32,d:24,h:35,z:12,color:'#78ada5'},{type:'sphere',w:26,d:26,h:26,z:44,color:'#ef916b'},{type:'box',x:-10,w:12,d:25,h:14,z:0,color:'#d7b75f'},{type:'box',x:10,w:12,d:25,h:14,z:0,color:'#d7b75f'},{type:'cylinder',x:-20,w:12,d:12,h:30,z:17,color:'#9796cb'},{type:'cylinder',x:20,w:12,d:12,h:30,z:17,color:'#9796cb'}])items.push({...base,...part,id:createId()});select(items.at(-6).id);changed();resetView();toast('Din robot är här! Klicka på en del och gör den till din.');};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#save').onclick=()=>{download(new Blob([JSON.stringify({version:1,items},null,2)],{type:'application/json'}),'mitt-bygge.formverkstan.json');toast('Projektfilen kan öppnas och byggas vidare på.');};
$('#open').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Projektfilen är för stor.');const loaded=validateProject(JSON.parse(await file.text()));checkpoint();items=loaded;selected=null;selection.clear();placement=null;changed();resetView();toast('Projektet är öppnat.');}catch(err){toast(err.message);}e.target.value='';};
$('#print').onclick=()=>{if(!items.length)return toast('Lägg till en form innan du förbereder utskriften.');$('#print-dialog').showModal();};$('.close').onclick=()=>$('#print-dialog').close();
$('#download-stl').onclick=async()=>{const b=$('#download-stl');b.disabled=true;b.textContent='Förbereder din modell…';await new Promise(r=>setTimeout(r,40));try{download(new Blob([exportSTL(items)],{type:'model/stl'}),'mitt-bygge.stl');toast('STL-filen är klar. Öppna den i skrivarens slicer.');}catch(err){toast('Kunde inte skapa STL-filen: '+err.message);}finally{b.disabled=false;b.textContent='↓ Hämta STL-fil';}};
function setTool(mode){toolMode=mode;rotator.setMode(mode==='move'?'translate':mode==='scale'?'scale':'rotate');$('#size-tool').setAttribute('aria-pressed',String(mode==='scale'));$('#move-tool').setAttribute('aria-pressed',String(mode==='move'));$('#rotate-tool').setAttribute('aria-pressed',String(mode==='rotate'));refresh();}
$('#size-tool').onclick=()=>setTool('scale');
$('#move-tool').onclick=()=>setTool('move');$('#rotate-tool').onclick=()=>setTool('rotate');
$('#multi-tool').onclick=()=>{multi=!multi;$('#multi-tool').setAttribute('aria-pressed',String(multi));toast(multi?'Klicka på formerna du vill välja. Klicka igen för att välja bort.':'Du väljer nu en form i taget.');};
document.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>{const i=items.find(i=>i.id===selected);if(!i)return;checkpoint();i[b.dataset.turn]=((i[b.dataset.turn]||0)+90)%360;changed();});
$('#on-plate').onclick=()=>{if(!selection.size)return;checkpoint();for(const i of items)if(selection.has(i.id))i.z=0;changed();};
$('#align').onclick=()=>{const chosen=[...selection].map(id=>items.find(i=>i.id===id));if(chosen.length<2)return;checkpoint();for(const i of chosen.slice(1)){i.x=chosen[0].x;i.y=chosen[0].y;}changed();};
function placeOn(baseId){
 if(!placement)return false;
 const top=items.find(i=>i.id===placement),base=items.find(i=>i.id===baseId);
 if(!top||!base){placement=null;return false;}
 if(top===base){toast('Klicka på en annan form som ska vara underst.');return true;}
 const moved=structuredClone(top);stackOn(base,moved);if(moved.z>200){toast('Bygget blir för högt. Sänk basen först.');return true;}
 checkpoint();Object.assign(top,moved);selection=new Set([base.id,top.id]);selected=top.id;placement=null;changed();toast('Klart! Klicka Förena om delarna ska följa med varandra.');return true;
}
$('#stack').onclick=()=>{
 if(placement){placement=null;refresh();return;}
 if(selection.size===2){const ids=[...selection];placement=ids[1];placeOn(ids[0]);return;}
 if(selected){placement=selected;setTool('move');toast('Klicka på formen som ska vara underst.');}
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&placement){placement=null;refresh();}});
$('#combine').onclick=async()=>{if(selection.size<2)return;const b=$('#combine');b.disabled=true;b.textContent='Förenar…';await new Promise(r=>setTimeout(r,40));try{const chosen=items.filter(i=>selection.has(i.id));const group=combine(chosen,createId());checkpoint();items=items.filter(i=>!selection.has(i.id));items.push(group);select(group.id);multi=false;$('#multi-tool').setAttribute('aria-pressed','false');changed();toast('Former förenade! De flyttas och roteras som en del. Ångra för att dela upp.');}catch(e){toast(e.message);}finally{b.textContent='Förena';refresh();}};
$('#reset-view').onclick=resetView;$('#top-view').onclick=()=>{camera.position.set(0,-.01,340);controls.target.set(0,0,0);controls.update();};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);let drag;
function ray(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.button!==0||rotating||(!placement&&rotator.axis))return;
 ray(e);const hit=raycaster.intersectObjects(meshes.children)[0];if(!hit)return;
 const id=hit.object.userData.id;
 if(placeOn(id))return;
 if(multi||e.shiftKey){select(id,true);refresh();return;}
 if(!selection.has(id))select(id);else selected=id;
 controls.enabled=false;plane.constant=-hit.point.z;const p=raycaster.ray.intersectPlane(plane,new THREE.Vector3());if(!p){controls.enabled=true;return;}
 drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,point:p.clone(),originals:items.filter(i=>selection.has(i.id)).map(i=>({id:i.id,x:i.x,y:i.y})),moved:false};renderer.domElement.setPointerCapture(e.pointerId);refresh();
},true);
renderer.domElement.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4)return;
 ray(e);const p=raycaster.ray.intersectPlane(plane,new THREE.Vector3());if(!p)return;
 if(!drag.moved){checkpoint();drag.moved=true;}
 const xs=drag.originals.map(i=>i.x),ys=drag.originals.map(i=>i.y);
 const dx=Math.max(-100-Math.min(...xs),Math.min(100-Math.max(...xs),Math.round(p.x-drag.point.x)));
 const dy=Math.max(-100-Math.min(...ys),Math.min(100-Math.max(...ys),Math.round(p.y-drag.point.y)));
 for(const original of drag.originals){const i=items.find(i=>i.id===original.id);i.x=original.x+dx;i.y=original.y+dy;}refresh();
});
function endDrag(){if(drag?.moved)persist();drag=null;controls.enabled=true;}renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
new ResizeObserver(()=>{camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();renderer.setSize(viewport.clientWidth,viewport.clientHeight);}).observe(viewport);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});refresh();
