import React from 'react';
import './characterStage.css';

export type AvatarPose='idle'|'charge'|'attack'|'hurt'|'victory';
/** Original lightweight character sprite for the game, not a canonical assistant portrait. */
export default function PlayerAvatar({pose='idle',pulse=0,compact=false}:{
 pose?:AvatarPose;pulse?:number;compact?:boolean
}){
 return <svg key={pulse} viewBox="0 0 112 124"
  className={'cs-avatar cs-avatar-'+pose+(compact?' cs-avatar-small':'')}
  role="img" aria-label="プレイヤーキャラクター" focusable="false">
  <defs>
   <linearGradient id="csSuit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#71d8fa"/><stop offset="1" stopColor="#3855a7"/></linearGradient>
   <linearGradient id="csHair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff4a9"/><stop offset="1" stopColor="#e4a646"/></linearGradient>
  </defs>
  <ellipse cx="55" cy="116" rx="34" ry="5.5" fill="#071d3b" opacity=".5"/>
  <g className="cs-pose">
   <path d="M42 91L34 112 43 116 54 97ZM68 91L80 112 70 117 57 99Z" fill="#4e6195" stroke="#9ad7f9" strokeWidth="2"/>
   <path d="M36 63Q20 65 16 89L29 93 47 77Z" fill="#4969a0" stroke="#9bd8ff" strokeWidth="2"/>
   <path d="M75 64Q93 66 99 89L87 93 66 78Z" fill="#4969a0" stroke="#9bd8ff" strokeWidth="2"/>
   <path className="cs-cape" d="M43 61Q18 62 12 108L32 100 47 76Z" fill="#c94872" stroke="#f597ac" strokeWidth="2"/>
   <path d="M43 63Q56 57 71 64L81 93Q57 109 30 92Z" fill="url(#csSuit)" stroke="#c7f6ff" strokeWidth="2.4"/>
   <path d="M51 74L61 74 66 84 57 92 47 84Z" fill="#ffcf64" stroke="#ffeaaa" strokeWidth="2"/>
   <path d="M44 92L71 92" stroke="#1b376a" strokeWidth="4" strokeLinecap="round"/>
   <g className="cs-head">
    <path d="M27 42Q22 11 57 10 94 10 88 45L83 66 32 64Z" fill="url(#csHair)" stroke="#fef5c1" strokeWidth="2.2"/>
    <path d="M36 39Q34 18 57 18 81 18 78 40L76 56Q57 70 38 56Z" fill="#ffe4c5" stroke="#e9b7a5" strokeWidth="2"/>
    <path d="M30 33Q28 14 46 12L43 32 55 21 58 36 69 19 81 33 89 25Q84 4 56 8 29 7 25 27Z" fill="url(#csHair)" stroke="#ffe7a5" strokeWidth="2"/>
    <ellipse cx="47" cy="43" rx="4.5" ry="6" fill="#ad394a"/><ellipse cx="68" cy="43" rx="4.5" ry="6" fill="#ad394a"/>
    <circle cx="48" cy="41" r="1.6" fill="#fff"/><circle cx="69" cy="41" r="1.6" fill="#fff"/>
    <path d="M54 56Q58 59 63 55" stroke="#b96d65" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M28 39Q21 52 31 62L37 57 34 36Z" fill="#f7c76a"/>
    <path d="M82 36L80 58 86 62Q95 47 88 38Z" fill="#f7c76a"/>
   </g>
   <path d="M22 85L29 77 38 87 30 97 22 94Z" fill="#344a87" stroke="#abe9ff" strokeWidth="2"/>
   <g className="cs-weapon">
    <path d="M86 84L92 79 98 85 92 92Z" fill="#f5d888" stroke="#fff1c0" strokeWidth="2"/>
    <path d="M96 84L102 69 106 30 109 69 103 85Z" fill="#71f4ff" stroke="#e0ffff" strokeWidth="2"/>
    <path d="M97 80L107 80" stroke="#ffdb7d" strokeWidth="3" strokeLinecap="round"/>
   </g>
  </g>
 </svg>;
}
