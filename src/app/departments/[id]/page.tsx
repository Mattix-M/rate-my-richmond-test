import {DepartmentDetail} from '@/components/departments';
import {data} from '@/lib/model';
import {notFound} from 'next/navigation';
export function generateStaticParams(){return data.departments.map(d=>({id:d.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;return {title:data.departments.find(d=>d.id===id)?.department||'Department'}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!data.departments.some(d=>d.id===id))notFound();return <DepartmentDetail id={id}/>}
