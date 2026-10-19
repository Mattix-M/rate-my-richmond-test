import type {Metadata} from 'next';
import {Analytics} from '@vercel/analytics/next';
import {Shell} from '@/components/shell';
import './globals.css';
import './redesign.css';
import './tools.css';
import './mobile.css';
const description = '12,239 anonymous and probably biased reviews. Find Richmond professors, compare ratings, and read what students actually wrote.';
export const metadata:Metadata={
  metadataBase:new URL('https://www.ratemyrichmond.com'),
  title:{default:'Rate My Richmond',template:'%s | Rate My Richmond'},
  description,
  openGraph:{
    type:'website',
    siteName:'Rate My Richmond',
    title:'Rate My Richmond',
    description,
    images:[{url:'/share-card-v2.png',width:1200,height:630,type:'image/png',alt:'Rate My Richmond — 12,239 anonymous and probably biased reviews, with average review ratings by reported difficulty.'}],
  },
  twitter:{card:'summary_large_image',title:'Rate My Richmond',description,images:['/share-card-v2.png']},
  icons:{icon:[{url:'/icon-v2.png',type:'image/png',sizes:'64x64'}],apple:[{url:'/apple-touch-icon-v2.png',sizes:'180x180',type:'image/png'}]},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Shell>{children}</Shell><Analytics /></body></html>}
