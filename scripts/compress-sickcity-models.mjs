import { readdir, stat, rename, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
async function files(dir) {
  return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();
}
const report=[];
for(const file of (await files('public/models/sickcity')).filter(p=>p.endsWith('.glb'))){
  const before=(await stat(file)).size;
  const output=file.replace(/\.glb$/,'.compressed.glb');
  execFileSync('npm',['exec','--yes','--package=@gltf-transform/cli@4.5.0','--','gltf-transform','draco',file,output,'--quantize-position','16','--quantize-normal','12','--quantize-texcoord','14'],{stdio:'pipe'});
  const after=(await stat(output)).size;
  await rename(output,file);
  report.push({file,before,after});
  console.log(`${file}: ${before} -> ${after}`);
}
await writeFile('artifacts/sickcity-blender/draco-compression.json',JSON.stringify(report,null,2)+'\n');
