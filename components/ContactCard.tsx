'use client';
import {useState} from 'react';
import type {Locale} from '@/lib/types';
import {ui} from '@/lib/content';
const email='1806189648@qq.com';
export default function ContactCard({locale}:{locale:Locale}){
 const [copied,setCopied]=useState(false); const copy=async()=>{await navigator.clipboard.writeText(email);setCopied(true);setTimeout(()=>setCopied(false),1500)};
 return <section className="contactCard" aria-label={locale==='zh'?'联系信息':'Contact information'}>
  <div className="contactStatus"><span className="statusDot"/><span><small>STATUS / OPEN</small><strong>{locale==='zh'?'接受合作洽询':'AVAILABLE FOR COLLABORATION'}</strong></span></div>
  <div className="contactEmailGroup"><span>{locale==='zh'?'直接联系':'DIRECT CONTACT'}</span><a href={`mailto:${email}`}>{email}</a></div>
  <button className="contactCopy" type="button" onClick={copy} aria-live="polite" aria-label={locale==='zh'?'复制邮箱地址':'Copy email address'}><span>{copied?ui[locale].copied:ui[locale].copy}</span><i aria-hidden="true"/></button>
 </section>
}
