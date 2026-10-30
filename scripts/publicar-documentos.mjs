// Publicar solo el catálogo cerrado de PDF privados. Nunca imprime claves ni contenidos.
// ENV_ARCHIVO=.env.prod node scripts/publicar-documentos.mjs prod
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {admin} from './prueba.mjs';
const destino=process.argv[2];assert.ok(['dev','prod'].includes(destino));
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL.includes(destino==='prod'?'xvzkijllizurvmmhmxvl':'ethmpqizaeptmrdvudur'));
if(destino==='prod')assert.equal(process.env.ENV_ARCHIVO,'.env.prod');
const manifest=JSON.parse(await readFile('src/lib/hackaton/documentos.json','utf8'));
const guia=JSON.parse(await readFile('src/lib/hackaton/guia-pdf.json','utf8'));
const db=admin(),bucket=await db.storage.getBucket('desafios-empresas');
if(bucket.error)throw bucket.error;
assert.equal(bucket.data.public,false,'El bucket debe ser privado antes de subir documentos.');
const storage=db.storage.from('desafios-empresas'),sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir('src/contenidos/hackaton',{recursive:true});
for(const doc of [...Object.values(manifest),guia]){
 assert.ok(/^(kankay|v-go|fardo|lisa|bienvenida-completa)\.pdf$/.test(doc.archivo));
 const ruta=`src/contenidos/hackaton/${doc.archivo}`;let bytes;
 try{bytes=await readFile(ruta);}catch(err){
  if(err.code!=='ENOENT')throw err;
  const actual=await storage.download(doc.archivo);if(actual.error)throw new Error(`Falta el original ${doc.archivo}.`);
  bytes=Buffer.from(await actual.data.arrayBuffer());assert.equal(sha(bytes),doc.sha256);await writeFile(ruta,bytes,{flag:'wx'});
 }
 assert.equal(sha(bytes),doc.sha256,`Hash inesperado: ${doc.archivo}`);
 const r=await storage.upload(doc.archivo,bytes,{contentType:'application/pdf',cacheControl:'0',upsert:true});if(r.error)throw r.error;
 const comprobacion=await storage.download(doc.archivo);if(comprobacion.error)throw comprobacion.error;
 assert.equal(sha(Buffer.from(await comprobacion.data.arrayBuffer())),doc.sha256);
 console.log(`${destino}: ${doc.archivo} publicado en Storage privado y verificado.`);
}
