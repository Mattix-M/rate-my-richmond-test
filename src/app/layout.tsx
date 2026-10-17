import type {Metadata} from 'next';
import {Shell} from '@/components/shell';
import './globals.css';
import './redesign.css';
import './tools.css';
export const metadata:Metadata={title:{default:'Rate My Richmond',template:'%s | Rate My Richmond'},description:'An unofficial student project exploring University of Richmond professor reviews. Compare ratings, courses, and student experiences.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Shell>{children}</Shell></body></html>}
