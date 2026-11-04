import React from 'react';
import type {BossDomain} from './bossCampaign.ts';
import {bossArmorPhase} from './bossArmorPhase.ts';
import './bossArmorBreak.css';

/**
 * Teardown-inspired visual layer: armor plates follow the existing boss shield,
 * but never change the state that determines rewards or correctness.
 * SVG is decorative; the accessible boss shield meter remains authoritative.
 */
export default function BossArmorBreak({domain,remaining,target,correct}:{
 domain:BossDomain;remaining:number;target:number;correct:number;
}){
 const phase=bossArmorPhase(remaining,target);
 const theme=({'セキュリティ':'security','耐障害性':'resilience','パフォーマンス':'performance','コスト最適化':'cost'} as const)[domain];
 return <div className={'od4-armor-break od4-armor-'+theme+' od4-armor-'+phase} aria-hidden="true">
  <div className="od4-armor-heading"><span>TACTICAL SHIELD // DISASSEMBLY</span><strong>{phase==='broken'?'CORE EXPOSED':phase==='exposed'?'CRITICAL BREACH':phase==='strained'?'ARMOR COMPROMISED':'ARMOR ONLINE'}</strong></div>
  <svg viewBox="0 0 720 205" className="od4-armor-svg" focusable="false">
   <g className="od4-armor-grid">
    <path d="M28 164L360 203L692 164 M64 142L360 174L656 142 M96 122L360 147L624 122 M360 28V205 M222 66L176 205 M498 66L544 205" fill="none"/>
    <ellipse cx="360" cy="100" rx="260" ry="80" fill="none"/>
   </g>
   <g className="od4-armor-halo"><circle cx="360" cy="101" r="70" fill="none" strokeWidth="2"/><circle cx="360" cy="101" r="57" fill="none" strokeWidth="1"/></g>
   <g className="od4-armor-reactor">
    <circle cx="360" cy="101" r="41" className="od4-armor-core-border"/>
    <circle cx="360" cy="101" r="30" className="od4-armor-core-fill"/>
    <path d="M360 76L380 89V112L360 125L340 112V89Z" className="od4-armor-core-hex"/>
    <circle cx="360" cy="101" r="10" className="od4-armor-iris"/>
   </g>
   <g className="od4-armor-part od4-armor-part-left">
    <path d="M244 74L294 39L332 55L335 88L303 101L333 115L329 145L294 160L244 127Z" className="od4-armor-plate"/>
    <path d="M251 83L289 57L315 64 M252 121L289 142L315 136 M272 103H318" className="od4-armor-etch"/>
    <path d="M238 86L244 74V127L236 116Z" className="od4-armor-edge"/>
   </g>
   <g className="od4-armor-part od4-armor-part-right">
    <path d="M476 74L426 39L388 55L385 88L417 101L387 115L391 145L426 160L476 127Z" className="od4-armor-plate"/>
    <path d="M469 83L431 57L405 64 M468 121L431 142L405 136 M448 103H402" className="od4-armor-etch"/>
    <path d="M482 86L476 74V127L484 116Z" className="od4-armor-edge"/>
   </g>
   <g className="od4-armor-part od4-armor-part-top">
    <path d="M323 29H397L415 56L392 70H328L305 56Z" className="od4-armor-plate"/>
    <path d="M333 41H387" className="od4-armor-etch"/>
   </g>
   <g className="od4-armor-part od4-armor-part-bottom">
    <path d="M328 133H392L415 148L397 172H323L305 148Z" className="od4-armor-plate"/>
    <path d="M333 157H387" className="od4-armor-etch"/>
   </g>
   <g className="od4-armor-technical">
    <path d="M210 103H144 M510 103H576 M360 18V5 M360 187V199" />
    <circle cx="144" cy="103" r="3"/><circle cx="576" cy="103" r="3"/>
    <text x="142" y="91" textAnchor="end">PLATE / L</text><text x="578" y="91">PLATE / R</text>
    <text x="360" y="195" textAnchor="middle">REACTOR CORE</text>
   </g>
   {correct>0&&<g key={correct} className="od4-armor-strike">
    <path d="M360 101L355 11 M360 101L408 18 M360 101L475 39 M360 101L494 103 M360 101L463 166 M360 101L352 192 M360 101L247 162 M360 101L230 90 M360 101L256 30 M360 101L294 22" fill="none"/>
    <circle cx="360" cy="101" r="54" fill="none"/>
   </g>}
  </svg>
  <div className="od4-armor-footer"><span>ARMOR INTEGRITY</span><span>{remaining} / {target} SHIELD</span></div>
 </div>;
}
