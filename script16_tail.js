// ---------- visuals state ----------
let wb=1,colorF=0.05,danceF=0,flash=0,mem=Array(32).fill(0);
const stars=[...Array(140)].map(()=>({x:Math.random()*2-1,y:Math.random()*2-1,s:Math.random()*1.6+0.4,p:Math.random()*6.28}));
const bubbles=[...Array(46)].map(()=>({x:Math.random(),y:Math.random(),r:Math.random()*5+2,v:Math.random()*0.05+0.04,w:Math.random()*6.28}));
let rings=[],lastBeat=-1,poseSlot=-1;
let mVX=0;
// ---- free dance (instrumental): taps change things on screen, nothing counts ----
let fPose='armsup',fFloor=0,fFloorHue=320,fGirlHue=-1,fBgHue=-1,fBgT=-9,fRip=[],fBurst=[],fGeo={cx:0,feetY:0,figH:1,fy0:0};
const FREE_POSES=['pointup','pointside','pointdown','handroll','clap','armsup','hairflip','spin','jump','hips','crouch'];
const FX_LIFE=[0.9,1.7,2.6,3.4,2.4,2.6,1.1],FX_DRINKS=['VODKA','WHISKEY','GIN','BOURBON','CHAMPAGNE','RUM','WINE','COGNAC','TEQUILA','BEER'];let fFx=0;
// 0 fireworks, 1 kisses, 2 hearts, 3 a drink name floating up, 4 melting neon, 5 confetti, 6 stars
function freeBurst(x,y,hu){const k=fFx++%7,r=Math.random,M=Math.min(W,H),ps=[];
  const n=[0,7,6,0,14,44,10][k];
  for(let i=0;i<n;i++)ps.push({a:r()*6.283,d:r(),s:r(),h:k===1?[340,350,320,0,300][i%5]:k===2?[340,320,0,300,355][i%5]:r()*360,ph:r()*6.283});
  fBurst.push({x,y,t:performance.now()/1000,h:hu,a:r()*6.28,k,ps,w:FX_DRINKS[Math.floor(r()*FX_DRINKS.length)],M});}
const backOut=p=>{const q=p-1;return 1+2.70158*q*q*q+1.70158*q*q;};
function star4(x,y,r){g.beginPath();g.moveTo(x,y-r);g.quadraticCurveTo(x,y,x+r,y);g.quadraticCurveTo(x,y,x,y+r);g.quadraticCurveTo(x,y,x-r,y);g.quadraticCurveTo(x,y,x,y-r);g.fill();}
function heartPath(x,y,r){g.beginPath();g.moveTo(x,y+r*.35);g.bezierCurveTo(x+r*1.1,y-r*.4,x+r*.55,y-r*1.15,x,y-r*.45);g.bezierCurveTo(x-r*.55,y-r*1.15,x-r*1.1,y-r*.4,x,y+r*.35);g.closePath();}
function lips(x,y,s,rot,hue,al){g.save();g.translate(x,y);g.rotate(rot);g.scale(s,s);g.globalAlpha=al;g.fillStyle=`hsl(${hue},100%,58%)`;g.shadowColor=`hsl(${hue},100%,60%)`;g.shadowBlur=14;
  g.beginPath();g.moveTo(-1,0);g.bezierCurveTo(-.6,-.55,-.25,-.62,0,-.3);g.bezierCurveTo(.25,-.62,.6,-.55,1,0);g.bezierCurveTo(.5,.08,-.5,.08,-1,0);g.fill();
  g.beginPath();g.moveTo(-1,.04);g.bezierCurveTo(-.5,.18,.5,.18,1,.04);g.bezierCurveTo(.6,.75,-.6,.75,-1,.04);g.fill();
  g.shadowBlur=0;g.fillStyle=`rgba(255,225,240,${.75*al})`;g.beginPath();g.ellipse(-.25,.38,.22,.07,-.2,0,7);g.fill();g.restore();}
function drawFreeFx(now){
  fBurst=fBurst.filter(b=>now-b.t<FX_LIFE[b.k]);
  for(const b of fBurst){const age=now-b.t,L=FX_LIFE[b.k],a=age/L,M=b.M;g.save();
    if(b.k===0){g.globalCompositeOperation='lighter';const R=M*(0.08+0.45*a);
      for(let k=0;k<12;k++){const an=b.a+k*Math.PI/6;g.strokeStyle=`hsla(${(b.h+k*30)%360},100%,65%,${1-a})`;g.lineWidth=3*(1-a)+1;
        g.beginPath();g.moveTo(b.x+Math.cos(an)*R*0.3,b.y+Math.sin(an)*R*0.3);g.lineTo(b.x+Math.cos(an)*R,b.y+Math.sin(an)*R);g.stroke();}
      const gl=g.createRadialGradient(b.x,b.y,0,b.x,b.y,R*0.6);gl.addColorStop(0,`hsla(${b.h},100%,80%,${0.7*(1-a)})`);gl.addColorStop(1,`hsla(${b.h},100%,60%,0)`);
      g.fillStyle=gl;g.fillRect(b.x-R,b.y-R,R*2,R*2);}
    else if(b.k===1){const al=1-Math.max(0,(age-L+0.5)/0.5);
      b.ps.forEach((p,i)=>{const st=i*0.06,q=Math.max(0,age-st);if(q<=0)return;const sc=M*(0.045+0.04*p.s)*(q<0.22?backOut(q/0.22):1),dd=M*(0.05+0.22*p.d);
        lips(b.x+Math.cos(p.a)*dd,b.y+Math.sin(p.a)*dd-age*M*0.04,sc,(p.s-0.5)*0.9,p.h,al);});}
    else if(b.k===2){g.globalCompositeOperation='lighter';
      b.ps.forEach(p=>{const al=Math.min(1,age/0.2)*(1-a),x=b.x+(p.d-0.5)*M*0.35*a+Math.sin(age*3+p.ph)*M*0.025,y=b.y-age*M*(0.25+0.2*p.s),r=M*(0.05+0.04*p.s);
        heartPath(x,y,r);g.fillStyle=`hsla(${p.h},100%,55%,${0.25*al})`;g.fill();g.strokeStyle=`hsla(${p.h},100%,62%,${0.45*al})`;g.lineWidth=8;g.stroke();g.strokeStyle=`hsla(${p.h},100%,85%,${al})`;g.lineWidth=2.5;g.stroke();});}
    else if(b.k===3){g.globalCompositeOperation='lighter';const al=Math.min(1,age/0.3)*(1-Math.max(0,(age-L+1)/1));
      let fs=M*0.13;g.font=`900 ${fs}px "Arial Black",Impact,system-ui,sans-serif`;const tw=g.measureText(b.w).width;if(tw>W*0.85){fs*=W*0.85/tw;g.font=`900 ${fs}px "Arial Black",Impact,system-ui,sans-serif`;}
      g.translate(Math.min(W-W*0.45,Math.max(W*0.45,b.x)),b.y-age*M*0.16);g.rotate(0.12*Math.sin(age*1.6+b.a));g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
      g.strokeStyle=`hsla(${b.h},100%,62%,${0.35*al})`;g.lineWidth=fs*0.12;g.strokeText(b.w,0,0);g.strokeStyle=`hsla(${b.h},100%,80%,${0.8*al})`;g.lineWidth=2.5;g.strokeText(b.w,0,0);}
    else if(b.k===4){g.globalCompositeOperation='lighter';
      b.ps.forEach(p=>{const st=p.s*0.5,q=age-st;if(q<0)return;const al=1-Math.max(0,q/(L-st)),x=b.x+(p.d-0.5)*M*0.5,y0=b.y+(p.s-0.5)*M*0.12,y=y0+0.5*M*1.1*q*q+M*0.05*q,len=M*(0.03+0.25*q),w=M*(0.013+0.012*p.d);
        const gr=g.createLinearGradient(0,y-len,0,y);gr.addColorStop(0,`hsla(${p.h},100%,60%,0)`);gr.addColorStop(1,`hsla(${p.h},100%,72%,${al})`);g.fillStyle=gr;
        g.beginPath();g.roundRect(x-w/2,y-len,w,len,w/2);g.fill();g.fillStyle=`hsla(${p.h},100%,80%,${al})`;g.beginPath();g.arc(x,y,w*0.9,0,7);g.fill();});}
    else if(b.k===5){b.ps.forEach(p=>{const an=-Math.PI/2+(p.a/6.283-0.5)*2.4,v=M*(0.7+0.7*p.d),x=b.x+Math.cos(an)*v*age*0.8,y=b.y+Math.sin(an)*v*age*0.8+0.5*M*1.3*age*age,fl=Math.cos(age*(6+p.s*6)+p.ph);
        g.save();g.translate(x,y);g.rotate(age*4*(p.s-0.5)+p.ph);g.scale(1,fl);g.globalAlpha=1-Math.max(0,(age-L+0.6)/0.6);g.fillStyle=`hsl(${p.h},100%,${50+20*Math.abs(fl)}%)`;
        const ww=M*(0.02+0.02*p.s);g.fillRect(-ww/2,-ww*0.3,ww,ww*0.6);g.restore();});}
    else{g.globalCompositeOperation='lighter';
      if(age<0.15){const R=M*0.12,gl=g.createRadialGradient(b.x,b.y,0,b.x,b.y,R);gl.addColorStop(0,`rgba(255,255,255,${1-age/0.15})`);gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(b.x-R,b.y-R,R*2,R*2);}
      b.ps.forEach(p=>{const d=M*(0.04+0.3*(0.6+0.4*p.d)*Math.sqrt(a)),r=M*(0.02+0.025*p.s)*(1-a);g.fillStyle=`hsla(${p.h},100%,75%,${1-a})`;star4(b.x+Math.cos(p.a)*d,b.y+Math.sin(p.a)*d,r);
        g.fillStyle=`rgba(255,255,255,${1-a})`;star4(b.x+Math.cos(p.a)*d,b.y+Math.sin(p.a)*d,r*0.4);});}
    g.restore();}
}
function freeFloor(){fFloor=(fFloor+1)%4;fFloorHue=(fFloorHue+70+Math.random()*80)%360;}
function freeGirl(){let n;do{n=FREE_POSES[Math.floor(Math.random()*FREE_POSES.length)];}while(n===curPose);
  fPose=n;prevPose=curPose;prevFlip=curFlip;curPose=n;curFlip=Math.random()<0.5;poseT=0;fGirlHue=Math.floor(Math.random()*360);}
function freeBg(x,y){fBgHue=Math.floor(Math.random()*360);fBgT=performance.now()/1000;fRip.push({x,y,t:fBgT,h:fBgHue});}
function freeTap(x,y){const G=fGeo;freeBurst(x,y,Math.floor(Math.random()*360));
  if(Math.hypot(x-G.br*1.35,y-G.btnY)<G.br*1.2){freeFloor();btnFlash[0]=1;return;}   // the two buttons: left = floor, right = her
  if(Math.hypot(x-(W-G.br*1.35),y-G.btnY)<G.br*1.2){freeGirl();btnFlash[1]=1;return;}
  if(Math.abs(x-G.cx)<G.figH*0.22&&y>G.feetY-G.figH*0.95&&y<G.feetY+G.figH*0.03)freeGirl();
  else if(y>G.fy0)freeFloor();else freeBg(x,y);}
let pVR=0,pVS=0;
let tVX=0,tVY=0;const eqH=new Float32Array(72);
function resetVisuals(){colorF=0.05;danceF=0;flash=0;mem=Array(32).fill(0);rings=[];lastBeat=-1;poseSlot=-1;curPose=prevPose='sleepy';poseT=1;}
function hsl(h,s,l,a){return `hsla(${h},${(s*colorF).toFixed(1)}%,${l}%,${a})`}
const lerp=(a,b,t)=>a+(b-a)*t;
function hash(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
// which poses, and how often (in beats), for each stage
const replayStill=()=>state==='replay'&&Math.floor(beatNow()/8)%2===1;
function poseSeq(){
  if(state==='line'&&LEVELS[lv]&&LEVELS[lv].kind==='free')return [1e6,[fPose]];
  if(LEVELS[lv]&&LEVELS[lv].kind==='world'&&(state==='line'||state==='intro'))return world?[1,['pointup','pointside','pointdown','handroll','clap','armsup','hairflip','spin']]:[2,['sleepy','rubeyes','headhold','stretch']];
  const cnt=Math.min(4,totalLocked()+(lv>0?1:0));
  if(state==='done')return [1e6,['sleepy']];
  if(state==='chorus')return [1,['crouch','jump','landing','clap','armsup','spin','hairflip','handroll']];
  if(state==='after')return [1,['pointup','pointside','pointdown','handroll','clap','armsup','hairflip','spin']];
  if(state==='replay')return replayStill()?[1,['armsup','pointup','clap','spin','hairflip','pointside','jump','hips']]:[2,['hips','handroll','pointdown','clap','armsup','pointside']];
  if(state==='line'){
    if(cnt>=3)return [1,['pointup','pointside','pointdown','hips','clap','armsup','handroll','hairflip']];
    if(cnt===2)return [2,['hips','pointdown','pointside','pointup','handroll','clap']];
    if(cnt===1)return [2,['stretch','hips','handroll','hips']];
  }
  return [4,['sleepy','rubeyes','headhold','stretch']];
}
let curPose='sleepy',prevPose='sleepy',poseT=1,curFlip=false,prevFlip=false;
function drawPoseLine(name,flip,cx,feetY,scale,alpha,col,sx,sy,rot){
  const P=POSE[name];if(!P||alpha<=0)return;
  const w=PW*scale,h=PH*scale;
  g.save();g.globalAlpha=alpha;g.translate(cx,feetY);g.rotate(rot);g.scale(sx,sy);if(flip)g.scale(-1,1);
  if(tint.width!==PW||tint.height!==PH){tint.width=PW;tint.height=PH;}
  tg2.globalCompositeOperation='source-over';tg2.clearRect(0,0,PW,PH);tg2.drawImage(P.L,0,0);
  tg2.globalCompositeOperation='source-in';tg2.fillStyle=col;tg2.fillRect(0,0,PW,PH);
  g.drawImage(tint,-w/2,-FEET*scale,w,h);g.restore();}
function drawPose(name,flip,cx,feetY,scale,alpha,col,sx,sy,rot){
  const P=POSE[name];if(!P||alpha<=0)return;
  const w=PW*scale,h=PH*scale;
  g.save();g.globalAlpha=alpha;g.translate(cx,feetY);g.rotate(rot);g.scale(sx,sy);if(flip)g.scale(-1,1);
  const x=-w/2,y=-FEET*scale;
  g.drawImage(P.B,x,y,w,h);
  if(tint.width!==PW||tint.height!==PH){tint.width=PW;tint.height=PH;}
  tg2.globalCompositeOperation='source-over';tg2.clearRect(0,0,PW,PH);tg2.drawImage(P.L,0,0);
  tg2.globalCompositeOperation='source-in';tg2.fillStyle=col;tg2.fillRect(0,0,PW,PH);
  g.drawImage(tint,x,y,w,h);
  g.restore();
}

// ---------- draw ----------
const hexRgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
let LC=[242,201,107],LCS='#f2c96b';
// scanner line across the screen, with a gap for the text (like the title on the start screen)
function scanLine(cy,tw,col){const gap=tw/2+16,sl=g.createLinearGradient(0,0,W,0);
  sl.addColorStop(0,'rgba(0,0,0,0)');sl.addColorStop(0.12,col);sl.addColorStop(0.88,col);sl.addColorStop(1,'rgba(0,0,0,0)');
  g.save();g.fillStyle=sl;g.shadowColor=col;g.shadowBlur=8;g.fillRect(0,cy-0.5,W/2-gap,1);g.fillRect(W/2+gap,cy-0.5,W/2-gap,1);g.restore();}
function lcA(a){return `rgba(${LC[0]},${LC[1]},${LC[2]},${a})`;}
function drawText(txt,x,y,size,clos,lockedL,t){
  g.font=`800 ${size}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;g.textBaseline='middle';g.textAlign='left';
  const tw=g.measureText(txt).width;let xx=x-tw/2;
  const jit=lockedL?0:(1-clos)*size*0.35,fr=Math.floor(t*12);
  const c0=[140,138,150],c1=LC,k=lockedL?1:clos*0.55;
  const col=`rgb(${Math.round(lerp(c0[0],c1[0],k))},${Math.round(lerp(c0[1],c1[1],k))},${Math.round(lerp(c0[2],c1[2],k))})`;
  g.fillStyle=col;g.shadowColor=lockedL?lcA(.8):'transparent';g.shadowBlur=lockedL?14:0;
  for(let i=0;i<txt.length;i++){const ch=txt[i],w=g.measureText(ch).width;
    const dx=(hash(i*7+fr)-0.5)*jit,dy=(hash(i*13+fr*3)-0.5)*jit;g.globalAlpha=lockedL?1:0.55+0.45*clos;g.fillText(ch,xx+dx,y+dy);xx+=w;}
  g.globalAlpha=1;g.shadowBlur=0;
}
function fitSize(txt,maxW,base){g.font=`800 ${base}px system-ui,sans-serif`;const w=g.measureText(txt).width;return Math.min(base,base*maxW/w);}

let lastT=performance.now()/1000;
function frame(){
  requestAnimationFrame(frame);
  const nowR=performance.now()/1000,fz=state==='done'&&nowR-doneT>1.6; // the end: 1.6 s to fall asleep and go dark, then everything holds still
  const now=fz?doneT+1.6:nowR,dt=fz?0:Math.min(0.05,nowR-lastT);lastT=nowR;
  const outF=state==='done'?Math.min(1,(now-doneT)/1.5):0;
  let p=0;
  if(started&&ctx&&state!=='done'){
    p=pos();
    if(spPending&&ctx.currentTime>=spPending.at){spTarget=spPending.v;spSemi=spPending.v;spPending=null;}
    syncPos();levelTick(dt);p=pos();
    if(state==='after'&&p>=CHORUS)state='chorus';
  }
  const live=started&&ctx;
  const bAbs=state==='done'?doneB:live?beatNow():now/BEAT;
  const bi=Math.floor(bAbs),ph=bAbs-bi;
  const cnt=totalLocked();
  const inLine=state==='line'||state==='replay',lk=inLine&&semi===0;
  const clos=inLine?(lk?1:Math.max(0,1-Math.abs(semi)/((LEVELS[lv].kind==='tune'?6:LEVELS[lv].kind==='gear'?4:1)+0.5))):1;
  let tC=0.05,tD=0;
  if(inLine){tC=Math.min(1,0.08+(cnt+clos*0.6)/8*0.92);tD=0.1+cnt*0.11+(lk?0.12:0);}
  if(state==='line'&&LEVELS[lv].kind==='free'){tC=1;tD=1;}
  else if(state==='after'){tC=0.85;tD=0.85;}else if(state==='chorus'){tC=1;tD=1;}
  const isWorld=!!(LEVELS[lv]&&LEVELS[lv].kind==='world'&&(state==='line'||state==='intro'));
  wb+=((isWorld?world:1)-wb)*Math.min(1,dt*7);const party=isWorld?wb:1,freeOn=state==='line'&&LEVELS[lv]&&LEVELS[lv].kind==='free';
  // free dance: the disco is on (lights, glitter, disco ball, bubbles), but nothing switches by itself
  const memv=freeOn?mem.map((x,i)=>[0,1,1,0,0,1,1,0][i]||0):isWorld?mem.map(()=>0):mem.map(x=>x*party*(1-outF));
  if(isWorld){tC=0.12+0.88*wb;tD=0.08+0.85*wb;}
  colorF+=(tC-colorF)*Math.min(1,dt*(isWorld?7:2.2));danceF+=(tD-danceF)*Math.min(1,dt*1.6);
  {let k=0;for(let l=0;l<LEVELS.length;l++)for(let i=0;i<LEVELS[l].units.length;i++,k++)mem[k]+=((LEVELS[l].locked[i]?1:0)-mem[k])*Math.min(1,dt*1.5);}
  flash=Math.max(0,flash-dt*1.6);
  for(let i=0;i<2;i++)btnFlash[i]=Math.max(0,btnFlash[i]-dt*4);
  for(let i=0;i<lineFlash.length;i++)lineFlash[i]=Math.max(0,lineFlash[i]-dt*1.2);
  const pulse=Math.pow(1-ph,3);

  // ---- layout ----
  const mn=Math.min(W,H);
  const br=Math.max(28,Math.min(mn*0.075,60));
  const btnY=H-br*1.3;
  const feetY=btnY-br-H*0.045,fy0=feetY-H*0.06,hz=fy0-H*0.2;
  const topY=H*0.075,base=Math.min(34,mn*0.06);
  const figTop=topY+base*1.6;
  const figH=Math.min(feetY-figTop-base*0.6,W*1.25),cx=W/2;

  {const Lc=(state==='replay'&&replayIdx[0]>=0?LEVELS[replayIdx[0]]:LEVELS[lv]);LCS=(Lc&&Lc.col)||'#f2c96b';LC=hexRgb(LCS);}
  // ---- background ----
  const bg=g.createRadialGradient(W/2,H*0.42,0,W/2,H*0.42,Math.max(W,H)*0.8);
  bg.addColorStop(0,hsl(285,70,8+6*colorF,1));bg.addColorStop(1,hsl(250,60,3,1));
  g.fillStyle=bg;g.fillRect(0,0,W,H);
  const pOn=state==='line'&&LEVELS[lv].kind==='persp'&&pPart>=0;
  if(pOn){pVR+=(pRot*P_ROT-pVR)*0.3;pVS+=(pShp*P_SHP-pVS)*0.3;}else{pVR=0;pVS=0;}
  if(pOn){g.save();g.translate(W/2,feetY);g.rotate(pVR);g.translate(-W/2,-feetY);}
  if(freeOn&&fBgHue>=0){const tg=g.createRadialGradient(W/2,H*0.4,0,W/2,H*0.4,Math.max(W,H)*0.8);tg.addColorStop(0,`hsla(${fBgHue},90%,35%,.55)`);tg.addColorStop(1,`hsla(${(fBgHue+60)%360},90%,12%,.35)`);g.fillStyle=tg;g.fillRect(0,0,W,H);}
  if(freeOn){fRip=fRip.filter(r=>now-r.t<1.4);for(const r of fRip){const a=now-r.t;g.strokeStyle=`hsla(${r.h},100%,70%,${1-a/1.4})`;g.lineWidth=4;g.beginPath();g.arc(r.x,r.y,20+a*Math.max(W,H)*0.5,0,7);g.stroke();}}
  if(isWorld&&wb<0.999){const sk=g.createLinearGradient(0,0,0,H*0.8);sk.addColorStop(0,'#2c313c');sk.addColorStop(1,'#6e6c72');g.globalAlpha=1-wb;g.fillStyle=sk;g.fillRect(0,0,W,H);g.globalAlpha=1;}

  if(memv[3]>0.01){const rot=now*0.02,cy=H*0.4,R=Math.max(W,H)*0.75;
    for(const s of stars){const x=s.x*Math.cos(rot)-s.y*Math.sin(rot),y=s.x*Math.sin(rot)+s.y*Math.cos(rot);
      g.globalAlpha=memv[3]*(0.35+0.65*(0.5+0.5*Math.sin(now*2+s.p)));g.fillStyle=hsl(50+s.p*20,60,85,1);g.fillRect(cx+x*R,cy+y*R,s.s,s.s);}
    g.globalAlpha=1;}
  if(memv[1]>0.01){g.save();g.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){const left=i<3,ox=left?0:W,a=(left?1:-1)*(0.5+0.35*Math.sin(bAbs*Math.PI/4+i*1.3)),len=Math.hypot(W,H);
      const hue=[320,190,55][i%3];g.strokeStyle=hsl(hue,100,60,memv[1]*(0.25+0.55*pulse));g.lineWidth=2+3*pulse;
      g.beginPath();g.moveTo(ox,0);g.lineTo(ox+Math.sin(a)*len,Math.cos(Math.abs(a))*len);g.stroke();}
    g.restore();}

  // floor
  g.save();g.beginPath();g.rect(0,fy0,W,H-fy0);g.clip();
  const rowsY=[];for(let j=0;j<=6;j++)rowsY.push(fy0+(H-fy0)*Math.pow(j/6,1.5));
  const cols=9,spx=W*0.16;
  if(memv[3]>0.01){
    for(let j=0;j<6;j++)for(let cc=-cols;cc<cols;cc++){
      const y0=rowsY[j],y1=rowsY[j+1],k0=(y0-hz)/(H-hz),k1=(y1-hz)/(H-hz);
      const xa=W/2+cc*spx*k0,xb=W/2+(cc+1)*spx*k0,xc=W/2+(cc+1)*spx*k1,xd=W/2+cc*spx*k1;
      const r=hash(cc*31+j*17+bi*3);if(r<0.45)continue;
      g.fillStyle=hsl(Math.floor(r*6)*60,90,45,memv[3]*(0.25+0.45*pulse));
      g.beginPath();g.moveTo(xa,y0);g.lineTo(xb,y0);g.lineTo(xc,y1);g.lineTo(xd,y1);g.closePath();g.fill();}
  }
  if(freeOn&&fFloor>0){
    if(fFloor===1){for(let j=0;j<6;j++)for(let cc=-cols;cc<cols;cc++){if((cc+j)%2)continue;
      const y0=rowsY[j],y1=rowsY[j+1],k0=(y0-hz)/(H-hz),k1=(y1-hz)/(H-hz);
      g.fillStyle=`hsla(${(fFloorHue+j*20)%360},95%,55%,${0.35+0.4*pulse})`;g.beginPath();g.moveTo(W/2+cc*spx*k0,y0);g.lineTo(W/2+(cc+1)*spx*k0,y0);g.lineTo(W/2+(cc+1)*spx*k1,y1);g.lineTo(W/2+cc*spx*k1,y1);g.closePath();g.fill();}}
    else if(fFloor===2){for(let j=0;j<6;j++){const q=((now*0.8+j/6)%1);g.strokeStyle=`hsla(${(fFloorHue+j*25)%360},100%,62%,${0.8*(1-q)})`;g.lineWidth=3;g.beginPath();g.ellipse(W/2,feetY,W*0.9*q,(H-fy0)*0.6*q,0,0,7);g.stroke();}}
    else{const gr=g.createLinearGradient(0,fy0,0,H);gr.addColorStop(0,`hsla(${fFloorHue},100%,50%,0)`);gr.addColorStop(1,`hsla(${fFloorHue},100%,50%,${0.45+0.35*pulse})`);g.fillStyle=gr;g.fillRect(0,fy0,W,H-fy0);}
  }
  g.strokeStyle=freeOn&&fFloor>0?`hsla(${fFloorHue},100%,70%,.45)`:'rgba(200,190,220,0.14)';g.lineWidth=1;
  for(const y of rowsY){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  for(let cc=-cols;cc<=cols;cc++){const k0=(fy0-hz)/(H-hz);g.beginPath();g.moveTo(W/2+cc*spx*k0,fy0);g.lineTo(W/2+cc*spx,H);g.stroke();}
  g.restore();

  if(isWorld){
    // street lamps along both sides of the road; they only burn at night
    for(let k=0;k<6;k++){const z=k/6,sc=1-z*0.8,y=fy0+(H-fy0)*Math.pow(1-z,1.6)*0.9;
      for(const sd of [-1,1]){const x=W/2+sd*W*0.55*sc*1.05,ph2=H*0.32*sc;
        g.strokeStyle=`rgba(${Math.round(90+60*wb)},${Math.round(90+40*wb)},${Math.round(105+60*wb)},.8)`;g.lineWidth=Math.max(1.5,4*sc);
        g.beginPath();g.moveTo(x,y);g.lineTo(x,y-ph2);g.lineTo(x-sd*14*sc,y-ph2);g.stroke();
        if(wb>0.02){const gl=g.createRadialGradient(x-sd*14*sc,y-ph2,0,x-sd*14*sc,y-ph2,40*sc);gl.addColorStop(0,`rgba(255,214,140,${0.9*wb})`);gl.addColorStop(1,'rgba(255,214,140,0)');
          g.fillStyle=gl;g.fillRect(x-sd*14*sc-40*sc,y-ph2-40*sc,80*sc,80*sc);}}}
    // at night the pavement turns into ocean, and taxi lights streak past
    if(wb>0.02){g.save();g.beginPath();g.rect(0,fy0,W,H-fy0);g.clip();
      for(let j=0;j<7;j++){const y=fy0+(H-fy0)*((j+((now*0.4)%1))/7);g.strokeStyle=`hsla(${190+j*12},90%,60%,${wb*0.45})`;g.lineWidth=2.5;
        g.beginPath();for(let x=0;x<=W;x+=8){const yy=y+Math.sin(x*0.025+now*2.5+j*1.7)*(3+j*1.2);x?g.lineTo(x,yy):g.moveTo(x,yy);}g.stroke();}
      g.restore();
      for(let k=0;k<3;k++){const sp=((now*0.5+k*0.37)%1),x=sp*W*1.4-W*0.2,y=fy0-6-k*5;g.strokeStyle=`rgba(255,${180+k*20},90,${wb*0.6})`;g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+W*0.18,y);g.stroke();}}
  }
  if(memv[2]>0.01){for(const b of bubbles){b.y-=b.v*dt*(0.6+danceF);if(b.y<-0.05){b.y=1.05;b.x=Math.random();}
    const x=(b.x+Math.sin(now*1.5+b.w)*0.01)*W,y=b.y*H;g.strokeStyle=hsl(45,90,70,memv[2]*0.7);g.lineWidth=1.5;
    g.beginPath();g.arc(x,y,b.r*(mn/600),0,7);g.stroke();}}

  // level 2 memories: melting neon, glitter in the sky, a disco ball, the floor in waves
  if(memv[4]>0.01){for(let i=0;i<14;i++){const x=W*(i+0.5)/14,len=H*(0.08+0.18*hash(i*3.1)),sp=0.25+0.5*hash(i*7.7),y0=((now*sp*0.25+hash(i))%1)*H*0.55;
      g.strokeStyle=hsl([320,190,55,280][i%4],100,62,memv[4]*0.55);g.lineWidth=3;g.beginPath();g.moveTo(x,y0);g.lineTo(x,y0+len);g.stroke();
      g.fillStyle=g.strokeStyle;g.beginPath();g.arc(x,y0+len,4,0,7);g.fill();}}
  if(memv[5]>0.01){for(let i=0;i<60;i++){const x=hash(i*1.7)*W,y=hash(i*2.3)*H*0.6,tw=0.5+0.5*Math.sin(now*4+i);
      g.fillStyle=hsl((i*47)%360,100,75,memv[5]*tw);const s=1.5+2.5*tw;g.fillRect(x-s/2,y-s/2,s,s);}}
  if(memv[6]>0.01){const bx=W*0.84,by=H*0.26,brd=Math.min(W,H)*0.06;
    g.save();g.globalCompositeOperation='lighter';for(let i=0;i<10;i++){const a=now*0.7+i*Math.PI/5;
      g.strokeStyle=hsl((i*36)%360,100,65,memv[6]*(0.18+0.25*pulse));g.lineWidth=2;g.beginPath();g.moveTo(bx,by);g.lineTo(bx+Math.cos(a)*W,by+Math.abs(Math.sin(a))*H);g.stroke();}
    g.restore();g.globalAlpha=memv[6];g.fillStyle='#1a1622';g.beginPath();g.arc(bx,by,brd,0,7);g.fill();
    for(let i=0;i<24;i++){const a=i*0.26+now,r=brd*0.75*Math.abs(Math.sin(i*1.3));g.fillStyle=hsl((i*30)%360,80,70,0.9);g.fillRect(bx+Math.cos(a)*r-2,by+Math.sin(i)*brd*0.75-2,4,4);}
    g.strokeStyle='rgba(220,215,235,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(bx,0);g.lineTo(bx,by-brd);g.stroke();g.globalAlpha=1;}
  if(memv[7]>0.01){g.save();g.beginPath();g.rect(0,fy0,W,H-fy0);g.clip();
    for(let j=0;j<5;j++){const y=fy0+(H-fy0)*((ph+j)/5);g.strokeStyle=hsl((j*72+bi*20)%360,100,60,memv[7]*0.5*(1-j/5));g.lineWidth=3;
      g.beginPath();for(let x=0;x<=W;x+=8){const yy=y+Math.sin(x*0.02+now*3+j)*6;x?g.lineTo(x,yy):g.moveTo(x,yy);}g.stroke();}
    g.restore();}

  // ---- the wave behind her: swells with the drums, gold = right pitch, pink = what you hear ----
  if(live){
    const wy=feetY-figH*0.55;
    // the equalizer: mirrored bars around a middle line, from the clean song (low notes in the middle, high at the sides)
    const EQN=72,EQC=['#ffd24a','#ff8a3d','#ff3d8a','#c46bff','#6f7dff','#3ee0ff'],MAXH=figH*0.2,gap=W/EQN,bw=Math.max(1.5,gap*0.45);
    if(eqAn){eqAn.getByteFrequencyData(eqData);const ny=ctx.sampleRate/2,nb=eqData.length;
      for(let i=0;i<EQN;i++){const k=Math.abs(i-(EQN-1)/2)/((EQN-1)/2),f=60*Math.pow(12000/60,k),bb=Math.min(nb-1,Math.round(f/ny*nb));
        eqH[i]=Math.pow((eqData[bb]+eqData[Math.min(nb-1,bb+1)])/510,1.6)*(1-0.55*k);}}
    const eg=g.createLinearGradient(0,0,W,0);EQC.forEach((c,k)=>eg.addColorStop(k/(EQC.length-1),c));
    g.save();g.globalCompositeOperation='lighter';
    for(let i=0;i<EQN;i++){const x=(i+0.5)*gap,hh=Math.max(2,eqH[i]*MAXH);
      g.fillStyle=eg;g.globalAlpha=0.85*(1-outF);g.fillRect(x-bw/2,wy-hh,bw,hh*2);g.globalAlpha=0.22*(1-outF);g.fillRect(x-bw*1.2,wy-hh*1.05,bw*2.4,hh*2.1);}
    g.globalAlpha=1-outF;g.fillStyle=eg;g.shadowColor='#fff';g.shadowBlur=10;g.fillRect(0,wy-1,W,2);g.shadowBlur=0;g.restore();
    // level 1: the outline = the edge of the same bars, stretched wrong; you shape it until it hugs the bars
    if(state==='line'&&LEVELS[lv].kind==='tune'&&tPart>=0){tVX+=(tFx-tVX)*0.3;tVY+=(tFy-tVY)*0.3;
      const sx=Math.pow(2,-tVX*0.1),sy=Math.max(0.15,1+tVY*0.16),col=tFixed?'#ffffff':'#f2c96b';
      for(const sg of [-1,1]){g.beginPath();for(let i=0;i<EQN;i++){const xa=W/2+(i*gap-W/2)*sx,xb=W/2+((i+1)*gap-W/2)*sx,y=wy+sg*(Math.max(2,eqH[i]*MAXH)*sy+2);i?g.lineTo(xa,y):g.moveTo(xa,y);g.lineTo(xb,y);}
        g.strokeStyle=col;g.lineWidth=2.5;g.lineJoin='miter';g.shadowColor=col;g.shadowBlur=tFixed?22:12;g.stroke();}
      g.shadowBlur=0;}
  }
  // ---- the girl ----
  const [every,seq]=poseSeq();const slot=Math.floor(bAbs/every);
  if(slot!==poseSlot){poseSlot=slot;const nm=seq[((slot%seq.length)+seq.length)%seq.length],fl=Math.floor(slot/seq.length)%2===1;
    if(nm!==curPose||fl!==curFlip){prevPose=curPose;prevFlip=curFlip;curPose=nm;curFlip=fl;poseT=0;}}
  poseT=Math.min(1,poseT+dt/(every>=4?0.35:0.12));
  const sc=figH/FIG,still=replayStill(),D=still?0:danceF,idle=still?0:1;
  // groove on top of the pictures: dip on the beat, sway, a little squash
  const dip=D*figH*0.014*(0.5+0.5*Math.cos(2*Math.PI*ph));
  const swayX=D*figH*0.025*Math.sin(Math.PI*bAbs)+idle*(1-D)*figH*0.008*Math.sin(bAbs*Math.PI/4);
  const rot=D*0.035*Math.sin(Math.PI*bAbs)+idle*(1-D)*0.012*Math.sin(bAbs*Math.PI/4);
  const sqY=1-D*0.018*pulse,sqX=1+D*0.012*pulse;
  const hue=Math.floor(bAbs/4)%2?190:320;
  const line=freeOn?`hsl(${fGirlHue>=0?fGirlHue:190},100%,64%)`:colorF<0.12?'rgb(150,145,165)':`hsl(${hue},${(100*colorF).toFixed(0)}%,62%)`;
  fGeo={cx,feetY,figH,fy0,br,btnY};
  const headScr=[cx+swayX,feetY-(FEET-HEAD)*sc];
  if(live&&bi!==lastBeat){lastBeat=bi;if(memv[0]>0.05)rings.push({t:0});}
  for(const r of rings)r.t+=dt;rings=rings.filter(r=>r.t<1.6);
  for(const r of rings){const q=r.t/1.6;g.strokeStyle=hsl(190,90,70,memv[0]*(1-q)*0.8);g.lineWidth=2*(1-q)+0.5;
    g.beginPath();g.arc(headScr[0],headScr[1],figH*0.07*(1.4+q*7),0,7);g.stroke();}
  const rgbOn=state==='line'&&LEVELS[lv].kind==='rgb'&&rPart>=0&&rOffs.length===RGBN;
  if(rgbOn&&posesReady===poseNames.length){
    const stp=W*0.045,fy=feetY,pose=curPose,fl=curFlip;
    // three spotlights on top, each above its copy; the one you move is brighter
    g.save();g.globalCompositeOperation='lighter';
    for(let k=0;k<RGBN;k++){const o=rOffs[k],x=cx+o.dx*stp,hr=hexRgb(RGBC[k]),on=k===rAct&&!rFixed,a=on?0.2:0.08;
      const cg=g.createLinearGradient(0,0,0,fy);cg.addColorStop(0,`rgba(${hr},${a*1.8})`);cg.addColorStop(1,`rgba(${hr},${a*0.5})`);
      g.fillStyle=cg;g.beginPath();g.moveTo(x-W*0.02,0);g.lineTo(x+W*0.02,0);g.lineTo(x+figH*0.2,fy);g.lineTo(x-figH*0.2,fy);g.closePath();g.fill();
      g.fillStyle=RGBC[k];g.shadowColor=RGBC[k];g.shadowBlur=on?18:6;g.beginPath();g.arc(x,6,on?9:6,0,7);g.fill();g.shadowBlur=0;}
    g.restore();
    // her body, dark, on the real place, and the thin gold outline to aim at
    drawPose(pose,fl,cx,fy,sc,rFixed?1:0.85,rFixed?'#ffffff':'rgba(0,0,0,0)',1,1,0);
    if(!rFixed)drawPoseLine(pose,fl,cx,fy,sc,0.45,'#f2c96b',1,1,0);
    // the three coloured copies (added together: where all three meet, she is white)
    g.save();g.globalCompositeOperation='lighter';
    for(let k=0;k<RGBN;k++){const o=rOffs[k],z=1+o.dz*0.07,on=k===rAct&&!rFixed,la=now-rLockT[k];
      drawPoseLine(pose,fl,cx+o.dx*stp,fy+o.dz*figH*0.015,sc*z,on?1:0.8,RGBC[k],1,1,0);
      if(la<0.5){g.strokeStyle=`rgba(255,255,255,${1-la*2})`;g.lineWidth=3;g.beginPath();g.ellipse(cx,fy,figH*0.14*(1+la*2),figH*0.035*(1+la*2),0,0,7);g.stroke();}}
    g.restore();
  }
  const mirOn=state==='line'&&LEVELS[lv].kind==='mirror'&&!mFixed;
  if(rgbOn&&posesReady===poseNames.length){}
  else if(mirOn&&posesReady===poseNames.length){
    // she stands off to the side and points to the middle; fading copies behind her = the echo
    const stp=W*0.022,tx=mS*mD*stp;
    if(Math.sign(tx)!==Math.sign(mVX)&&mVX!==0)mVX=tx;else mVX+=(tx-mVX)*0.25;
    const fl=mS<0,fy=feetY,ec=Math.min(1,mD/mD0),gap=Math.max(W*0.03,Math.abs(mVX)*0.35);
    g.save();
    for(let j=3;j>=1;j--)drawPose('pointside',fl,cx+mVX+mS*gap*j,fy,sc,(0.32/j)*ec,'hsl(320,90%,65%)',1,1,0);
    drawPose('pointside',fl,cx+mVX,fy,sc,1,line,1,1,0);
    const sa=now-mShiftT;if(sa<0.5){g.strokeStyle=`rgba(242,201,107,${1-sa*2})`;g.lineWidth=3;g.beginPath();g.ellipse(cx+mVX,fy,figH*0.12*(1+sa*3),figH*0.03*(1+sa*3),0,0,7);g.stroke();}
    g.strokeStyle='rgba(242,201,107,.5)';g.lineWidth=2;g.setLineDash([6,6]);g.beginPath();g.moveTo(cx,fy-figH*0.02);g.lineTo(cx,fy+figH*0.04);g.stroke();g.setLineDash([]);
    g.restore();
  }
  else if(state==='line'&&LEVELS[lv].kind==='tune'&&tPart>=0&&!tFixed&&posesReady===poseNames.length){mVX=0;
    const lift=tVX>0?-tVX*figH*0.035*(1+0.15*Math.sin(now*2.2)):0,sq=tVX<0?1+tVX*0.035:1;
    drawPose(curPose,curFlip,cx,feetY+lift,figH/FIG,1,line,1,sq,0);}
  else if(pOn&&posesReady===poseNames.length){mVX=0;const k=1+pVS;
    drawPose(curPose,curFlip,cx,feetY,figH/FIG,1,line,1/Math.sqrt(k),k,0);}
  else if(posesReady===poseNames.length){mVX=0;
    g.save();
    const fy=feetY+dip*0.0;
    if(poseT<1)drawPose(prevPose,prevFlip,cx+swayX,fy,sc,1-poseT,line,sqX,sqY,rot);
    drawPose(curPose,curFlip,cx+swayX,fy,sc,poseT<1?poseT:1,line,sqX,sqY-dip/figH,rot);
    g.restore();
  }
  if(isWorld&&state==='line'){
    const th=pos()-lat*rate,cy=feetY-figH*0.06,vy=feetY-figH*0.66;
    // the catch zone at her feet, in the colour of the world she is in
    g.strokeStyle=world?'rgba(255,120,220,.85)':'rgba(220,225,235,.75)';g.lineWidth=3;g.beginPath();g.ellipse(W/2,cy,figH*0.13,figH*0.035,0,0,7);g.stroke();
    lights.forEach((L,k)=>{const z=(L.t-th)/LEAD;if(z>1)return;const age=now-L.rt;if(L.st&&age>0.5)return;
      const zz=Math.max(0,z),e=Math.pow(1-zz,1.5),x=W/2+(k%2?1:-1)*W*0.36*Math.sin(Math.PI*0.5*zz),y=vy+(cy-vy)*e,r=5+figH*0.05*e;
      if(L.st===1){g.strokeStyle=`rgba(242,201,107,${1-age*2})`;g.lineWidth=3;g.beginPath();g.arc(W/2,cy,r*(1+age*4),0,7);g.stroke();return;}
      if(L.st===2){g.strokeStyle=`rgba(255,90,120,${1-age*2})`;g.lineWidth=4;g.beginPath();g.moveTo(W/2-r,cy-r);g.lineTo(W/2+r,cy+r);g.moveTo(W/2+r,cy-r);g.lineTo(W/2-r,cy+r);g.stroke();return;}
      if(L.w){const gr=g.createRadialGradient(x,y,0,x,y,r*2.2);gr.addColorStop(0,'rgba(255,140,230,.95)');gr.addColorStop(0.45,'rgba(150,90,255,.55)');gr.addColorStop(1,'rgba(90,60,200,0)');
        g.fillStyle=gr;g.beginPath();g.arc(x,y,r*2.2,0,7);g.fill();g.fillStyle='#fff';g.font=`900 ${r*1.2}px system-ui,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('☾',x,y+1);}
      else{g.fillStyle='rgba(235,232,220,.95)';g.beginPath();g.arc(x,y,r*0.75,0,7);g.fill();g.strokeStyle='rgba(235,232,220,.8)';g.lineWidth=Math.max(1.5,r*0.12);
        for(let q=0;q<8;q++){const a=q*Math.PI/4;g.beginPath();g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.lineTo(x+Math.cos(a)*r*1.5,y+Math.sin(a)*r*1.5);g.stroke();}}
    });
  }
  if(isWorld){const wa=now-wipeT;if(wa<0.35){const k=wa/0.35,x=wipeDir<0?W*(1-k):W*k;const gl=g.createLinearGradient(x-40,0,x+40,0);
    gl.addColorStop(0,'rgba(255,255,255,0)');gl.addColorStop(0.5,world?'rgba(255,140,230,.55)':'rgba(230,235,245,.55)');gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(x-40,0,80,H);}}
  if(pOn){g.restore();
    // what straight looks like: a gold level line at her feet and the gold outline of her real shape
    g.save();g.strokeStyle='rgba(242,201,107,.55)';g.lineWidth=1.5;g.setLineDash([10,8]);g.beginPath();g.moveTo(W*0.1,feetY);g.lineTo(W*0.9,feetY);g.stroke();g.setLineDash([]);g.restore();
    if(!pFixed&&posesReady===poseNames.length)drawPoseLine(curPose,curFlip,cx,feetY,figH/FIG,0.5,'#f2c96b',1,1,0);}
  if(flash>0){const fg=g.createRadialGradient(cx,feetY-figH*0.55,0,cx,feetY-figH*0.55,figH*0.9);fg.addColorStop(0,`rgba(255,230,160,${flash*0.55})`);fg.addColorStop(1,'rgba(255,230,160,0)');g.fillStyle=fg;g.fillRect(0,0,W,H);}

  // free dance: a burst of light where you tapped
  if(freeOn)drawFreeFx(now);
  // ---- lyrics ----
  const maxW=W*0.92;
  if(freeOn){g.textAlign='center';g.textBaseline='middle';g.font=`800 ${Math.max(14,base*0.7)}px system-ui,sans-serif`;g.fillStyle='#f2c96b';g.fillText('FREE DANCE',W/2,topY);
    g.font=`600 ${Math.max(11,base*0.45)}px system-ui,sans-serif`;g.fillStyle='rgba(242,201,107,.8)';g.fillText('Tap anything!',W/2,topY+base*0.9);}
  else if(inLine){const U=UNITS[cur],tx=(U.text2&&pos()-lat*rate>=LEVELS[lv].win[cur]+8*BEAT)?U.text2:U.text;drawText(tx,W/2,state==='replay'?topY+base*3.0:topY,fitSize(tx,maxW,base),clos,lk,now);
  }
  else if(state==='after'||state==='chorus'){
    const n0=Math.max(0,UNITS.length-4);for(let i=n0;i<UNITS.length;i++){const tx=UNITS[i].text;g.globalAlpha=locked[i]?1:0.35;drawText(tx,W/2,topY+(i-n0)*base*0.95-base*0.6,fitSize(tx,maxW,base*0.62),locked[i]?1:0,locked[i],now);g.globalAlpha=1;}
  }
  if(started&&state!=='intro'&&state!=='replay'&&state!=='done'&&LEVELS[lv].kind!=='world'){const dy=inLine?topY+base*1.65:topY+base*2.75;const nd=UNITS.length;for(let i=0;i<nd;i++){const x=W/2+(i-(nd-1)/2)*20;g.beginPath();g.arc(x,dy,5+4*lineFlash[i],0,7);
    if(lineDone[i])g.fillStyle=locked[i]?LCS:'rgba(255,90,120,.75)';
    else g.fillStyle=i===cur&&inLine?lcA(.45):'rgba(150,145,160,.35)';g.fill();}}
  // ---- buttons (not at the end) ----
  if(state!=='done')for(let i=0;i<2;i++){const bx=i?W-br*1.35:br*1.35,by=btnY;
    g.beginPath();g.arc(bx,by,br,0,7);g.fillStyle=lcA(0.08+0.3*btnFlash[i]);g.fill();
    g.strokeStyle=lcA(.6);g.lineWidth=2;g.shadowColor=lcA(.7);g.shadowBlur=10;g.stroke();g.shadowBlur=0;
    g.fillStyle=LCS;g.font=`800 ${br*0.62}px system-ui,sans-serif`;g.textAlign='center';g.textBaseline='middle';
    g.fillText(state==='replay'?(i?'▶':'◀'):LEVELS[lv].kind==='persp'?(i?'↻':'↺'):LEVELS[lv].kind==='tune'?(i?'◂▸':'▸◂'):(i?'▶':'◀'),bx,by-br*0.08);g.font=`700 ${br*0.24}px system-ui,sans-serif`;const kd=LEVELS[lv].kind;g.fillText(state==='replay'?(i?'NEXT LEVEL':'PREV LEVEL'):kd==='gear'?(i?'FASTER':'SLOWER'):kd==='tune'?(i?'HOLD: TALLER':'HOLD: FLATTER'):kd==='persp'?(i?'HOLD: TALLER':'HOLD: SHORTER'):kd==='rgb'?(i?'HOLD: FRONT':'HOLD: BACK'):kd==='free'?(i?'HER':'FLOOR'):kd==='mirror'?(i?'RIGHT':'LEFT'):kd==='world'?(i?'NIGHT ☾':'MORNING ☀'):kd==='tempo'?(i?'FASTER':'SLOWER'):(i?'HIGHER':'LOWER'),bx,by+br*0.5);}
  if(state==='line'&&LEVELS[lv].kind==='gear'&&gPart>=0){gVis+=(gV-gVis)*0.4;
    const R=Math.min(W*0.34,base*3.3),ccx=W/2,ccy=topY+base*2.6+R,a0=Math.PI,AMAX=Math.PI*0.42,ang=-Math.PI/2+gVis/G_MAX*AMAX,zone=AMAX/G_MAX*G_ZONE;
    g.save();g.lineCap='round';
    const ag=g.createLinearGradient(ccx-R,0,ccx+R,0);ag.addColorStop(0,'#4fe3ff');ag.addColorStop(0.5,'#f2c96b');ag.addColorStop(1,'#ff4a5a');
    g.strokeStyle=ag;g.lineWidth=3;g.globalAlpha=0.75;g.beginPath();g.arc(ccx,ccy,R,-Math.PI/2-AMAX,-Math.PI/2+AMAX);g.stroke();g.globalAlpha=1;
    for(let k=-G_MAX;k<=G_MAX;k++){const an=-Math.PI/2+k/G_MAX*AMAX,r1=R*(k%5===0?0.86:0.92);g.strokeStyle='rgba(233,211,163,.45)';g.lineWidth=k%5===0?2:1;
      g.beginPath();g.moveTo(ccx+Math.cos(an)*r1,ccy+Math.sin(an)*r1);g.lineTo(ccx+Math.cos(an)*R,ccy+Math.sin(an)*R);g.stroke();}
    g.strokeStyle='#f2c96b';g.lineWidth=9;g.shadowColor='#f2c96b';g.shadowBlur=14;g.beginPath();g.arc(ccx,ccy,R,-Math.PI/2-zone,-Math.PI/2+zone);g.stroke();g.shadowBlur=0;
    const inZ=Math.abs(gV)<=G_ZONE,nc=inZ?'#ffffff':Math.abs(gV)<=2?'#f2c96b':'#ff7ad9';
    if(inZ){g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=14;g.shadowColor='#f2c96b';g.shadowBlur=24;g.beginPath();g.arc(ccx,ccy,R,-Math.PI/2-zone,-Math.PI/2+zone);g.stroke();g.shadowBlur=0;}
    g.strokeStyle=nc;g.lineWidth=3.5;g.shadowColor=nc;g.shadowBlur=12;g.beginPath();g.moveTo(ccx,ccy);g.lineTo(ccx+Math.cos(ang)*R*1.04,ccy+Math.sin(ang)*R*1.04);g.stroke();g.shadowBlur=0;
    g.fillStyle=nc;g.beginPath();g.arc(ccx,ccy,6,0,7);g.fill();
    g.font=`600 ${Math.max(10,base*0.36)}px "Avenir Next",Montserrat,system-ui,sans-serif`;g.letterSpacing='0.15em';g.fillStyle='rgba(233,211,163,.8)';g.textBaseline='middle';
    g.textAlign='right';g.fillText('SLOW',ccx-R*0.95,ccy-R*0.2);g.textAlign='left';g.fillText('FAST',ccx+R*0.95,ccy-R*0.2);g.letterSpacing='0px';
    g.textAlign='center';g.fillStyle='#f2c96b';g.fillText(gScore()+'% IN THE ZONE',ccx,ccy+base*0.6);
    g.restore();}
  if(lineMsg){const age=now-lineMsg.t;if(age<1.3){g.globalAlpha=Math.min(1,(1.3-age)*2);g.textAlign='center';
    g.font=`900 ${Math.max(16,base*0.9)}px system-ui,sans-serif`;g.fillStyle=lineMsg.good?LCS:'#ff6b8a';
    g.shadowColor=g.fillStyle;g.shadowBlur=14;g.fillText(lineMsg.text,W/2,(topY+base*3.9)-age*10);g.shadowBlur=0;g.globalAlpha=1;}}
  // level card: LEVEL n, the command in the level colour (flashes, scanner line through the middle), last score
  {const cd=(LEVELS[lv]&&LEVELS[lv].cardDur)||3,ca=now-cardT,Lv=LEVELS[lv];
   if(ca>=0&&ca<cd&&Lv&&Lv.cmd){const al=Math.min(1,ca*4,(cd-ca)*2)*(ca<1.2?(Math.floor(ca*5)%2?0.35:1):1);
    const cy=H*0.36,col=Lv.col,txt=Lv.cmd;g.save();g.globalAlpha=al;g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='rgba(0,0,0,.72)';g.fillRect(0,cy-base*1.9,W,base*3.7);
    g.letterSpacing='0.12em';g.font=`500 ${fitSize(txt,W*0.86,base*1.1)}px "Avenir Next",Montserrat,system-ui,sans-serif`;
    const tw=g.measureText(txt).width;
    scanLine(cy,tw,col);
    g.fillStyle=col;g.shadowColor=col;g.shadowBlur=18;g.fillText(txt,W/2,cy);g.shadowBlur=0;
    g.letterSpacing='0.3em';g.font=`400 ${Math.max(11,base*0.42)}px "Avenir Next",Montserrat,system-ui,sans-serif`;g.fillStyle=col;
    if(Lv.num)g.fillText('LEVEL '+Lv.num,W/2,cy-base*1.25);
    if(Lv.keys){g.letterSpacing='0.08em';const f0=Math.max(11,base*0.44);g.font=`500 ${f0}px "Avenir Next",Montserrat,system-ui,sans-serif`;
      const kw=g.measureText(Lv.keys).width;if(kw>W*0.92)g.font=`500 ${f0*W*0.92/kw}px "Avenir Next",Montserrat,system-ui,sans-serif`;
      g.fillStyle='rgba(242,201,107,.95)';g.fillText(Lv.keys,W/2,cy+base*1.2);}
    g.letterSpacing='0px';g.restore();}}
  // replay: your score on top, and what each part of the song was, as a reminder for the next try
  if(state==='replay'||state==='done'){g.save();g.textAlign='center';g.textBaseline='middle';
    const hy=topY-base*0.2,sc2='YOU FIXED THE SONG: '+totalScore()+'%';
    g.letterSpacing='0.1em';g.font=`500 ${fitSize(sc2,W*0.9,base*0.8)}px "Avenir Next",Montserrat,system-ui,sans-serif`;
    scanLine(hy,g.measureText(sc2).width,'#f2c35a');g.fillStyle='#f2c35a';g.shadowColor='#f2c35a';g.shadowBlur=14;g.fillText(sc2,W/2,hy);g.shadowBlur=0;
    if(state==='replay'){g.letterSpacing='0.06em';g.font=`300 ${Math.max(12,base*0.48)}px "Avenir Next",Montserrat,system-ui,sans-serif`;g.fillStyle='rgba(233,211,163,.9)';g.fillText('Listen to how it sounds.',W/2,hy+base*0.85);}
    const Lr=state==='replay'&&replayIdx[0]>=0?LEVELS[replayIdx[0]]:null;
    if(Lr&&Lr.cmd){const rt2=(Lr.num?'LEVEL '+Lr.num+' · ':'')+Lr.cmd+(Lr.noScore?'':' · '+levelScore(replayIdx[0])+'%');g.letterSpacing='0.12em';g.font=`500 ${fitSize(rt2,W*0.9,base*0.55)}px "Avenir Next",Montserrat,system-ui,sans-serif`;
      g.fillStyle=Lr.col;g.shadowColor=Lr.col;g.shadowBlur=10;g.fillText(rt2,W/2,hy+base*1.8);g.shadowBlur=0;}
    g.letterSpacing='0px';g.restore();}
  // all the levels and your score in each: from the free dance in the replay, and at the end
  if((state==='replay'&&replayIdx[0]>=0&&LEVELS[replayIdx[0]].noScore)||state==='done'){
    const rows=LEVELS.map((L,i)=>L.noScore?null:{t:'LEVEL '+L.num+' · '+L.cmd+' · '+levelScore(i)+'%',c:L.col}).filter(Boolean);
    g.save();g.letterSpacing='0.1em';const f0=base*0.52;g.font=`500 ${f0}px "Avenir Next",Montserrat,system-ui,sans-serif`;
    const fsz=Math.min(f0,f0*W*0.9/Math.max(...rows.map(r=>g.measureText(r.t).width))),rh=fsz*2.1,ph2=rows.length*rh+fsz*1.6,py=H*0.47-ph2/2;
    g.fillStyle='rgba(0,0,0,.72)';g.fillRect(0,py,W,ph2);
    g.textAlign='center';g.textBaseline='middle';g.font=`500 ${fsz}px "Avenir Next",Montserrat,system-ui,sans-serif`;
    rows.forEach((r,k)=>{const y=py+fsz*0.8+rh*(k+0.5);g.fillStyle=r.c;g.shadowColor=r.c;g.shadowBlur=10;g.fillText(r.t,W/2,y);});
    g.shadowBlur=0;g.letterSpacing='0px';g.restore();}
  g.textAlign='left';
}
requestAnimationFrame(frame);
})();
</script>
