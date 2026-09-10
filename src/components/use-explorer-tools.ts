'use client';
import {useEffect} from 'react';
import {flushSync} from 'react-dom';
import {data,departments,groups,Period} from '@/lib/model';
type FilterInput={search:string;department:string;group:string;minimumReviews:number;period:Period};
type Tool={name:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown};
type ModelContext={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function useExplorerTools(apply:(input:FilterInput)=>void,fixedDepartment?:string){
 useEffect(()=>{
  const context=(document as Document&{modelContext?:ModelContext}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tool:Tool={name:'filter_professors',description:'Set the visible professor explorer filters and review period. Returns professors matching those filters; search highlights matching points on the scatterplot.',inputSchema:{type:'object',properties:{search:{type:'string'},department:{type:'string'},group:{type:'string'},minimumReviews:{type:'integer',enum:[1,5,15,20,30,50,100]},period:{type:'string',enum:['all','recent']}},required:['search','department','group','minimumReviews','period'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
   if(!input||typeof input!=='object')throw new Error('Expected filters');
   const v=input as FilterInput;
   if(typeof v.search!=='string'||v.search.length>200||typeof v.department!=='string'||v.department!==''&&!departments.includes(v.department)||typeof v.group!=='string'||v.group!==''&&!groups.includes(v.group)||![1,5,15,20,30,50,100].includes(v.minimumReviews)||!['all','recent'].includes(v.period))throw new Error('Invalid professor filters');
   if(fixedDepartment&&v.department!==fixedDepartment)throw new Error('This explorer is limited to '+fixedDepartment);
   flushSync(()=>apply(v));
   const results=data.professors.filter(p=>p[v.period]&&p[v.period]!.reviews>=v.minimumReviews&&(!v.department||p.department===v.department)&&(!v.group||p.group===v.group)&&p.name.toLowerCase().includes(v.search.toLowerCase()));
   return {count:results.length,professors:results.slice(0,20).map(p=>({name:p.name,id:p.id,department:p.department,quality:p[v.period]!.quality,difficulty:p[v.period]!.difficulty,reviews:p[v.period]!.reviews,url:`/professors/${p.id}/`}))};
  }};
  try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{/* Optional enhancement; native controls remain available. */}
  return ()=>lifecycle.abort();
 },[apply,fixedDepartment]);
}
