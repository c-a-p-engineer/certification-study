/** Default: the rebuilt learner. Legacy features remain available via ?legacy=1. */
if(new URLSearchParams(window.location.search).get('legacy')==='1'){
 void import('./main.tsx');
}else{
 void import('./reborn/index.tsx');
}
