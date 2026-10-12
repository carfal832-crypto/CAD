import * as THREE from 'three';
import { Brush, Evaluator, ADDITION } from 'three-bvh-csg';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
export const names = {box:'Kub', cylinder:'Cylinder', sphere:'Boll', group:'Förenad form'};
const groupCache = new WeakMap();
export function geometry(item) {
  if(item.type==='group') {
    if(!groupCache.has(item.children)) {
      const mesh=union(item.children);
      const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      g.computeBoundingBox();
      const center=g.boundingBox.getCenter(new THREE.Vector3()), size=g.boundingBox.getSize(new THREE.Vector3());
      g.translate(-center.x,-center.y,-center.z);g.scale(1/size.x,1/size.y,1/size.z);
      groupCache.set(item.children,g);mesh.geometry.dispose();mesh.material.dispose();
    }
    return groupCache.get(item.children).clone();
  }
  let g;
  if(item.type==='box') g=new THREE.BoxGeometry(1,1,1);
  else if(item.type==='sphere') g=new THREE.SphereGeometry(.5,40,24);
  else {g=new THREE.CylinderGeometry(.5,.5,1,48); g.rotateX(Math.PI/2);}
  return g;
}
export function transform(mesh,item) {
  mesh.scale.set(item.w,item.d,item.h);
  mesh.rotation.set((item.rx||0)*Math.PI/180,(item.ry||0)*Math.PI/180,item.angle*Math.PI/180);
  mesh.position.set(item.x,item.y,0);
  mesh.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(mesh);
  mesh.position.z=item.z-bounds.min.z;
  mesh.updateMatrixWorld(true);
  return mesh;
}
export function validateProject(data, depth=0, budget={count:0}) {
  if(depth>5)throw Error('För många grupper inuti varandra.');
  if(data?.version!==1 || !Array.isArray(data.items) || data.items.length>60) throw Error('Det här är inte en giltig Formverkstan-fil.');
  const ids=new Set();
  for(const i of data.items) {
    if(++budget.count>120)throw Error('För många former i projektet.');
    for(const k of ['rx','ry']) if(i[k]!==undefined && (typeof i[k]!=='number'||!Number.isFinite(i[k])||Math.abs(i[k])>360))throw Error('Ogiltig rotation.');
    if(i.type==='group') {
      if(!Array.isArray(i.children)||i.children.length<2)throw Error('Ogiltig grupp.');
      validateProject({version:1,items:i.children},depth+1,budget);
    }
    if(!Object.hasOwn(names,i.type)||typeof i.id!=='string'||ids.has(i.id)) throw Error('En form i filen är ogiltig.');
    ids.add(i.id);
    for(const k of ['w','d','h','x','y','z','angle']) if(typeof i[k]!=='number'||!Number.isFinite(i[k])) throw Error('Ogiltiga mått i filen.');
    if(['w','d','h'].some(k=>i[k]<1||i[k]>200)||Math.abs(i.x)>100||Math.abs(i.y)>100||i.z<0||i.z>200||Math.abs(i.angle)>360) throw Error('Måtten i filen är för stora eller för små.');
    if(!/^#[0-9a-f]{6}$/i.test(i.color)) throw Error('Ogiltig färg i filen.');
  }
  return data.items;
}
function union(items) {
  const evaluator=new Evaluator();evaluator.useGroups=false;
  const material=new THREE.MeshStandardMaterial();
  let result;
  const geometries=new Set();
  try {
    for(const item of items) {
      const brush=transform(new Brush(geometry(item),material),item);geometries.add(brush.geometry);
      result=result?evaluator.evaluate(result,brush,ADDITION):brush;geometries.add(result.geometry);
    }
    result.updateMatrixWorld(true);
    for(const g of geometries)if(g!==result.geometry)g.dispose();
    return result;
  }catch(error){for(const g of geometries)g.dispose();material.dispose();throw error;}
}
export function boundsOf(item) {
  const mesh=transform(new THREE.Mesh(geometry(item)),item);
  const bounds=new THREE.Box3().setFromObject(mesh);
  mesh.geometry.dispose();mesh.material.dispose();return bounds;
}
export function combine(items,id) {
  const bounds=new THREE.Box3();for(const i of items)bounds.union(boundsOf(i));
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(Math.max(size.x,size.y,size.z)>200)throw Error('Den förenade formen får vara högst 200 mm per sida.');
  const result={id,type:'group',children:structuredClone(items),w:size.x,d:size.y,h:size.z,x:center.x,y:center.y,z:bounds.min.z,rx:0,ry:0,angle:0,color:items[0].color};
  validateProject({version:1,items:[result]});
  const check=geometry(result);check.dispose();return result;
}
export function stackOn(base,top) {
  const bottom=boundsOf(base);top.x=base.x;top.y=base.y;
  // A small overlap makes the exported parts join instead of only touching.
  top.z=Math.max(0,bottom.max.z-.5);
}
export function exportSTL(items) {
  if(!items.length)throw Error('Lägg till en form först.');
  const result=union(items);
  try{return new STLExporter().parse(result,{binary:true});}
  finally{result.geometry.dispose();result.material.dispose();}
}
