import {data} from '@/lib/model';
import {ProfessorDetail} from '@/components/professor';
import {notFound} from 'next/navigation';
export function generateStaticParams(){return data.professors.map(p=>({id:p.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;return {title:data.professors.find(p=>p.id===id)?.name||'Professor'}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=data.professors.find(p=>p.id===id);if(!p)notFound();return <ProfessorDetail professor={p}/>}
