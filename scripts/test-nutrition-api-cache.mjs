// Run the actual GET with isolated dependency stubs. No DB/network access.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
const source=await readFile(new URL("../app/api/nutrition-data/route.ts",import.meta.url),"utf8");
const calls=[];let ok=true;
const result=o=>({ok,status:ok?200:503,dataset:{slug:o.dataset},cacheSource:"db",searchScope:o.source??"stored",totalCount:0,count:0,foods:[],failureReason:ok?undefined:"lookup_failed"});
const context=vm.createContext({Request,URL,Set,Promise});
const dependency=values=>new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value] of Object.entries(values))this.setExport(key,value);},{context});
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const queryModule=new vm.SourceTextModule(transpile(await readFile(new URL("../lib/nutrition-query.ts",import.meta.url),"utf8")),{context});
await queryModule.link(()=>{throw new Error("unexpected query import");});await queryModule.evaluate();
const dependencies={
  "next/server":dependency({NextResponse:{json:(body,init={})=>({body,status:init.status??200})}}),
  "../../../lib/national-nutrition-db":dependency({
    fetchNationalNutritionItemsWithDbCache:async options=>{calls.push({kind:"uncached",options});return result(options);},
    fetchNationalNutritionItemsWithDbCacheCached:async options=>{calls.push({kind:"cached",options});return result(options);},
  }),
  "../../../lib/db":dependency({isTursoConfigured:true}),
  "../../../lib/nutrition-query":queryModule,
  "../../../lib/national-nutrition-api":dependency({getNationalNutritionApiKey:()=>null,NATIONAL_NUTRITION_SOURCE:"fixture",NATIONAL_NUTRITION_DATASETS:[{slug:"food",name:"Food",shortName:"Food"},{slug:"processed",name:"Processed",shortName:"Processed"}]}),
};
const handler=new vm.SourceTextModule(transpile(source),{context});
await handler.link(s=>{assert.ok(dependencies[s],`unexpected import: ${s}`);return dependencies[s];});await handler.evaluate();
const get=q=>handler.namespace.GET(new Request("https://fixture.invalid/api/nutrition-data"+q));
let response=await get("?dataset=food&q=%20milk%20&pageNo=3&numOfRows=99");
assert.equal(response.status,200);assert.equal(calls.at(-1).kind,"cached");assert.equal(calls.at(-1).options.query,"milk");assert.equal(calls.at(-1).options.pageNo,3);assert.equal(calls.at(-1).options.numOfRows,50);assert.equal(response.body.count,0);assert.equal(response.body.ok,true);
response=await get("?dataset=food&source=upstream");assert.equal(calls.at(-1).kind,"uncached");assert.equal(calls.at(-1).options.source,"upstream");
const before=calls.length;response=await get("?q=rice&numOfRows=10");assert.equal(calls.length-before,2);assert.ok(calls.slice(before).every(c=>c.kind==="cached"&&c.options.numOfRows===6));assert.equal(response.body.datasets.length,2);
ok=false;response=await get("?dataset=food");assert.equal(response.status,503);assert.equal(response.body.ok,false);assert.equal(response.body.failureReason,"lookup_failed");
ok=true;response=await get("?dataset=food");assert.equal(response.status,200);assert.equal(response.body.ok,true);
ok=false;response=await get("");assert.equal(response.status,502);assert.equal(response.body.ok,false);
console.log("Nutrition API: stored/multi-dataset cache, upstream bypass, bounded inputs, empty success and failure recovery PASS; production reads0.");
