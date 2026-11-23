<script>
const AUDIO="__AUDIO__";
const POSES=__POSES__;
(()=>{
"use strict";
const cv=document.getElementById('c'),g=cv.getContext('2d');
let W=0,H=0,DPR=1;
// the game is a phone-shaped column: full height, at most 9:16 wide, in the middle of a wide screen
let cvLeft=0;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);H=innerHeight;W=Math.min(innerWidth,Math.round(H*9/16));cvLeft=Math.round((innerWidth-W)/2);
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';g.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();

// ---------- song map (song seconds; clip starts at CLIP0) ----------
const BEAT=0.4918,PHASE=0.0066,CLIP0=8.367;
const c=s=>s-CLIP0;
const LEVELS=[
  {num:1,col:'#ffcf6e',cmd:'TUNE IT UP OR DOWN',keys:'TAP: NARROWER / WIDER · HOLD: FLATTER / TALLER',kind:'tune',
   units:["Woke up in the morning, head just like a cave,","Echoes in my mind, every beat a rave.","One beer, two beers, three then lost the score,","Dancing with the universe across the club floor."].map(t=>({text:t})),
   win:[c(16.236),c(20.170),c(24.105),c(26.955),c(31.974)],loops:[[c(16.236),c(20.170)],[c(20.170),c(24.105)],[c(23.020),c(26.955)],[c(26.955),c(30.890)]]},
  {num:2,col:'#ff9a3d',cmd:'MAKE IT FASTER OR SLOWER',keys:'TAP: SLOWER / FASTER',kind:'gear',
   units:["Neon lights were melting, colors in the sky,","Vodka kissed my memory, gin was flying high.","Whiskey did a twirl, bourbon took a shot,","Did I drink the whole dance floor or maybe not?"].map(t=>({text:t})),
   win:[c(31.974),c(35.909),c(39.843),c(43.29),c(47.712)],loops:[[c(31.974),c(35.909)],[c(35.909),c(39.843)],[c(39.351),c(43.286)],[c(43.29),c(47.224)]]},
  {num:3,col:'#5dff9a',cmd:'LINE UP THE COLORS',keys:'TAP: LEFT / RIGHT · HOLD: BACK / FRONT',kind:'rgb',
   units:[["Oh-oh, last night was a disco hurricane,","Spinning round, champagne inside my veins."],["City lights, still dancing in my brain,","I'd do it, I'd do it, I'd do it all again!"],
          ["Hey! (Hey!) – I feel alive today","Hey! (Hey!) – again and again!"],["Life's too short to fade away","So pour the beat and let it play!"]].map(t=>({text:t[0],text2:t[1]})),
   win:[...Array(5)].map((_,k)=>c(47.712+k*7.8688))},
  {num:4,col:'#7fa6ff',cmd:'MORNING OR NIGHT? CATCH THE LIGHT',keys:'LEFT: MORNING ☀ · RIGHT: NIGHT ☾',kind:'world',
   units:["Stumbled down the sidewalk, rhythm in my feet,","Pavement turned to ocean, waves beneath the beat.","Taxi lights were shining like a cosmic show,","But I just kept on dancing, moving nice and slow.",
          "Wine turned into memories, rum turned into dreams,","The night became forever in glitter laser beams.","Cognac made me sing, tequila made me fly,","I hugged half of the city and never said goodbye."].map(t=>({text:t})),
   // lights per line: [beat in the line, 'N' = night light, 'M' = morning light]
   lights:[[[2,'N'],[4,'N'],[6,'N']],[[2,'M'],[4,'M'],[6,'N']],[[1,'N'],[3,'N'],[5,'M'],[7,'N']],[[2,'M'],[4,'N'],[6,'M']],
           [[1,'N'],[3,'M'],[5,'N'],[7,'M']],[[1,'N'],[4,'M'],[6,'N'],[7,'M']],[[1,'M'],[3,'N'],[5,'M'],[7,'N']],[[1,'N'],[3,'N'],[5,'M'],[6,'N'],[7,'M']]],
   win:[...Array(9)].map((_,k)=>c(79.186+k*3.9344))},
  {num:5,col:'#c27cff',cmd:'STRAIGHTEN THE VIEW',keys:'TAP: TURN · HOLD: SHORTER / TALLER',kind:'persp',
   units:[["Oh-oh, last night was a disco hurricane,","Spinning round, champagne inside my veins."],["City lights, still dancing in my brain,","I'd do it, I'd do it, I'd do it all again!"],
          ["Hey! (Hey!) – I feel alive today","Hey! (Hey!) – again and again!"],["Life's too short to fade away","So pour the beat and let it play!"]].map(t=>({text:t[0],text2:t[1]})),
   win:[...Array(5)].map((_,k)=>c(110.66+k*7.8688))},
  {num:6,col:'#4fe3ff',cmd:'MOVE WHERE SHE POINTS',keys:'PRESS THE SIDE SHE POINTS TO',kind:'mirror',
   units:["Echo, echo, in my head it goes,","But I still feel the rhythm in my bones.","Hangover symphony, play that track,","Life's a party – no turning back!"].map(t=>({text:t})),
   win:[...Array(5)].map((_,k)=>c(142.135+k*8*0.4918))},
  // instrumental + last chorus: free dance to the end of the song
  {col:'#f2c35a',cmd:'FREE DANCE · TAP ANYTHING',kind:'free',noScore:true,
   units:[{text:'Oh-oh,'}],win:[c(157.87),c(192.3)],cardDur:3}
];
for(const L of LEVELS){if(!L.loops)L.loops=L.units.map((_,k)=>[L.win[k],L.win[k+1]]);}
for(const L of LEVELS){const n=L.units.length;L.locked=Array(n).fill(false);L.score=Array(n).fill(0);L.rec=[...Array(n)].map(()=>[]);L.done=Array(n).fill(false);L.flash=Array(n).fill(0);}
const CHORUS=c(142.135);
let wGot=0,wTot=0,recCur=[],lineMsg=null,replayIdx=[-1,-1],REPLAY0=c(14.3);
let lv=0,UNITS=LEVELS[0].units,cardT=-99;

// ---------- pitch shifter (delay-line, two crossfaded taps) ----------
const WORKLET=`class PS extends AudioWorkletProcessor{
static get parameterDescriptors(){return[{name:'semi',defaultValue:0,minValue:-24,maxValue:24,automationRate:'k-rate'}]}
constructor(){super();this.N=16384;this.m=this.N-1;this.b=[new Float32Array(this.N),new Float32Array(this.N)];this.w=0;this.ph=0;this.W=Math.round(sampleRate*0.07);}
rd(b,p){p+=this.N;const i=Math.floor(p),f=p-i;return b[i&this.m]*(1-f)+b[(i+1)&this.m]*f}
process(ins,outs,par){const inp=ins[0],o=outs[0];const n=o[0].length;
if(!inp||!inp.length){for(const c of o)c.fill(0);return true}
const r=Math.pow(2,par.semi[0]/12),Wn=this.W,step=(1-r)/Wn,m=this.m;
const i0=inp[0],i1=inp[1]||inp[0],b0=this.b[0],b1=this.b[1],o0=o[0],o1=o[1]||o[0];
let w=this.w,ph=this.ph;
for(let s=0;s<n;s++){b0[w]=i0[s];b1[w]=i1[s];
let ph2=ph+0.5;if(ph2>=1)ph2-=1;
const d1=ph*Wn+2,d2=ph2*Wn+2,s1=Math.sin(Math.PI*ph),s2=Math.sin(Math.PI*ph2),g1=s1*s1,g2=s2*s2;
o0[s]=this.rd(b0,w-d1)*g1+this.rd(b0,w-d2)*g2;
o1[s]=this.rd(b1,w-d1)*g1+this.rd(b1,w-d2)*g2;
w=(w+1)&m;ph+=step;if(ph<0)ph+=1;else if(ph>=1)ph-=1;}
this.w=w;this.ph=ph;return true}}
registerProcessor('ps',PS);`;

let ctx=null,buf=null,src=null,shifter=null,semiP=null,useWL=false,spSemi=0,spTarget=0,spPending=null;
let dryG,wetG,mix,lp,hp,ws,noiseG,master,echoSend=null,echoPan=null,rgbA=null,rgbB=null,wobG=null;
let started=false,t0=0,lat=0;
let posBase=0,ctxBase=0,loopOn=false,loopS=0,loopE=0;
let state='idle',cur=-1,semi=0,locked=[false,false,false,false];
let lineDone,lineFlash,rate=1;

function b64(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer}
function makeSP(){
  const sp=ctx.createScriptProcessor(2048,2,2),N=16384,m=N-1,bb=[new Float32Array(N),new Float32Array(N)],Wn=Math.round(ctx.sampleRate*0.07);let w=0,ph=0;
  const rd=(b,p)=>{p+=N;const i=Math.floor(p),f=p-i;return b[i&m]*(1-f)+b[(i+1)&m]*f};
  sp.onaudioprocess=e=>{spSemi+=(spTarget-spSemi)*0.6;const r=Math.pow(2,spSemi/12),step=(1-r)/Wn;
    const I=e.inputBuffer,O=e.outputBuffer,i0=I.getChannelData(0),i1=I.getChannelData(I.numberOfChannels>1?1:0),o0=O.getChannelData(0),o1=O.getChannelData(1);
    for(let s=0;s<o0.length;s++){bb[0][w]=i0[s];bb[1][w]=i1[s];let ph2=ph+0.5;if(ph2>=1)ph2-=1;const d1=ph*Wn+2,d2=ph2*Wn+2,s1=Math.sin(Math.PI*ph),s2=Math.sin(Math.PI*ph2);
      o0[s]=rd(bb[0],w-d1)*s1*s1+rd(bb[0],w-d2)*s2*s2;o1[s]=rd(bb[1],w-d1)*s1*s1+rd(bb[1],w-d2)*s2*s2;w=(w+1)&m;ph+=step;if(ph<0)ph+=1;else if(ph>=1)ph-=1;}};
  return sp;
}
async function initAudio(){
  ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
  if(ctx.state==='suspended')await ctx.resume();
  buf=await ctx.decodeAudioData(b64(AUDIO));
  master=ctx.createGain();master.gain.value=0.9;
  ws=ctx.createWaveShaper();ws.oversample='none';
  hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=20;noiseG=ctx.createGain();noiseG.gain.value=0;
  lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=0.6;lp.frequency.value=900;
  dryG=ctx.createGain();wetG=ctx.createGain();wetG.gain.value=0;mix=ctx.createGain();
  try{
    try{await ctx.audioWorklet.addModule('data:application/javascript;base64,'+btoa(WORKLET));}
    catch(e1){await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET],{type:'application/javascript'})));}
    shifter=new AudioWorkletNode(ctx,'ps',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]});semiP=shifter.parameters.get('semi');useWL=true;}
  catch(e){shifter=makeSP();useWL=false;}
  shifter.connect(wetG);wetG.connect(mix);dryG.connect(mix);mix.connect(ws);ws.connect(hp);hp.connect(lp);lp.connect(master);master.connect(ctx.destination);
  // level 6: a second copy of the song, off the beat, on her side (closer to the middle = quieter)
  // level 3: two more copies of the song, a quarter and a half beat late, one left and one right (the colours apart)
  {const mk=(d,pn)=>{const gn=ctx.createGain(),dl=ctx.createDelay(0.3);gn.gain.value=0;dl.delayTime.value=d;lp.connect(gn);gn.connect(dl);
     if(ctx.createStereoPanner){const pp=ctx.createStereoPanner();pp.pan.value=pn;dl.connect(pp);pp.connect(master);}else dl.connect(master);return gn;};
   rgbA=mk(BEAT/4,-0.8);rgbB=mk(BEAT/2,0.8);}
  // level 5: the pitch slowly floats up and down, like a warped record
  {const o=ctx.createOscillator();o.frequency.value=0.9;wobG=ctx.createGain();wobG.gain.value=0;o.connect(wobG);if(useWL)wobG.connect(semiP);o.start();}
  {echoSend=ctx.createGain();echoSend.gain.value=0;const dl=ctx.createDelay(1),fbG=ctx.createGain();dl.delayTime.value=BEAT*1.5;fbG.gain.value=0; // one copy of the song, 1.5 beats late (right between the beats)
   echoPan=ctx.createStereoPanner?ctx.createStereoPanner():null;
   lp.connect(echoSend);echoSend.connect(dl);dl.connect(fbG);fbG.connect(dl);if(echoPan){dl.connect(echoPan);echoPan.connect(master);}else dl.connect(master);}
  {const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(Math.random()<0.02?1:0.35);
   const ns=ctx.createBufferSource();ns.buffer=nb;ns.loop=true;const nf=ctx.createBiquadFilter();nf.type='bandpass';nf.frequency.value=2500;nf.Q.value=0.8;
   ns.connect(nf);nf.connect(noiseG);noiseG.connect(master);ns.start();}
}
const cutoff=s=>900+17100*Math.exp(-Math.abs(s)*0.9);
function useLevel(i){lv=i;const L=LEVELS[i];UNITS=L.units;locked=L.locked;lineDone=L.done;lineFlash=L.flash;}
// pitch level: shift the pitch.  tempo level: change the speed, and shift the pitch back so only the tempo changes.
function applyDev(v){
  const t=ctx.currentTime,kind=LEVELS[lv].kind;
  if(echoSend){echoSend.gain.cancelScheduledValues(t);echoSend.gain.setTargetAtTime(kind==='mirror'?1.1*v:0,t,0.05);
    if(echoPan){echoPan.pan.cancelScheduledValues(t);echoPan.pan.setTargetAtTime(kind==='mirror'?0.85*mS:0,t,0.05);}}
  // every part that is not fixed must be heard clearly: even a small miss starts at a strong bend
  if(rgbA){const g2=kind==='rgb'&&v>0?0.6+0.4*v:0;for(const n of [rgbA,rgbB]){n.gain.cancelScheduledValues(t);n.gain.setTargetAtTime(g2,t,0.04);}}
  if(wobG){wobG.gain.cancelScheduledValues(t);wobG.gain.setTargetAtTime(kind==='persp'&&v>0&&useWL?0.7+1.3*v:0,t,0.05);}
  if(kind==='tune'){const fx=Math.round(v/16),fy=v-fx*16;syncPos();rate=1;src.playbackRate.cancelScheduledValues(t);src.playbackRate.setValueAtTime(1,t);
    if(useWL){semiP.cancelScheduledValues(t);if(fx!==0)semiP.setTargetAtTime(fx,t,0.02);}else if(fx!==0)spTarget=fx;
    const vol=fy<0?1+0.12*fy:1+0.06*fy;
    dryG.gain.cancelScheduledValues(t);wetG.gain.cancelScheduledValues(t);lp.frequency.cancelScheduledValues(t);hp.frequency.cancelScheduledValues(t);noiseG.gain.cancelScheduledValues(t);
    dryG.gain.setTargetAtTime(fx===0?vol:0,t,0.015);wetG.gain.setTargetAtTime(fx===0?0:vol,t,0.015);hp.frequency.setTargetAtTime(20,t,0.03);noiseG.gain.setTargetAtTime(0,t,0.03);
    lp.frequency.setTargetAtTime(fy<0?700*Math.pow(28,(6+fy)/6):fx!==0?cutoff(fx):20000,t,0.04);
    if(ws){if(fy>0){const d=1+fy*1.6,cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cv[i]=Math.tanh(d*x)/Math.tanh(d);}ws.curve=cv;}else ws.curve=null;}
    if(echoSend){echoSend.gain.cancelScheduledValues(t);echoSend.gain.setTargetAtTime(0,t,0.05);}return;}
  if(kind==='persp'){if(ws)ws.curve=null;syncPos();rate=1;src.playbackRate.cancelScheduledValues(t);src.playbackRate.setValueAtTime(1,t);
    dryG.gain.cancelScheduledValues(t);wetG.gain.cancelScheduledValues(t);lp.frequency.cancelScheduledValues(t);hp.frequency.cancelScheduledValues(t);noiseG.gain.cancelScheduledValues(t);
    const wob=v>0&&useWL;if(useWL){semiP.cancelScheduledValues(t);semiP.setTargetAtTime(0,t,0.02);}
    dryG.gain.setTargetAtTime(wob?0:1-0.35*v,t,0.02);wetG.gain.setTargetAtTime(wob?1-0.2*v:0,t,0.02);hp.frequency.setTargetAtTime(20,t,0.04);noiseG.gain.setTargetAtTime(0,t,0.03);
    lp.frequency.setTargetAtTime(v>0?(wob?9000-5000*v:1500*Math.pow(0.4,v)):20000,t,0.04);if(echoSend){echoSend.gain.cancelScheduledValues(t);echoSend.gain.setTargetAtTime(0,t,0.05);}return;}
  if(kind==='rgb'){if(ws)ws.curve=null;syncPos();rate=1;src.playbackRate.cancelScheduledValues(t);src.playbackRate.setValueAtTime(1,t);
    dryG.gain.cancelScheduledValues(t);wetG.gain.cancelScheduledValues(t);lp.frequency.cancelScheduledValues(t);hp.frequency.cancelScheduledValues(t);noiseG.gain.cancelScheduledValues(t);
    dryG.gain.setTargetAtTime(v>0?0.85-0.2*v:1,t,0.02);wetG.gain.setTargetAtTime(0,t,0.02);hp.frequency.setTargetAtTime(20,t,0.04);noiseG.gain.setTargetAtTime(0,t,0.03);lp.frequency.setTargetAtTime(v>0?12000-6000*v:20000,t,0.04);
    if(echoSend){echoSend.gain.cancelScheduledValues(t);echoSend.gain.setTargetAtTime(0,t,0.05);}return;}
  if(kind==='mirror'||kind==='free'){if(ws)ws.curve=null;syncPos();rate=1;src.playbackRate.cancelScheduledValues(t);src.playbackRate.setValueAtTime(1,t);
    dryG.gain.cancelScheduledValues(t);wetG.gain.cancelScheduledValues(t);lp.frequency.cancelScheduledValues(t);hp.frequency.cancelScheduledValues(t);noiseG.gain.cancelScheduledValues(t);
    dryG.gain.setTargetAtTime(kind==='mirror'?1-0.3*v:1,t,0.015);wetG.gain.setTargetAtTime(0,t,0.015);hp.frequency.setTargetAtTime(20,t,0.03);noiseG.gain.setTargetAtTime(0,t,0.03);lp.frequency.setTargetAtTime(20000,t,0.03);return;}
  hp.frequency.cancelScheduledValues(t);noiseG.gain.cancelScheduledValues(t);
  if(ws)ws.curve=null;
  if(kind==='world'){syncPos();rate=1;src.playbackRate.cancelScheduledValues(t);src.playbackRate.setValueAtTime(1,t);
    dryG.gain.cancelScheduledValues(t);wetG.gain.cancelScheduledValues(t);lp.frequency.cancelScheduledValues(t);
    const m=state==='replay'?v:(world===0?1:0); // morning / missed lights: through a pillow
    dryG.gain.setTargetAtTime(1-0.3*m,t,0.015);wetG.gain.setTargetAtTime(0,t,0.015);
    hp.frequency.setTargetAtTime(20+300*m,t,0.04);lp.frequency.setTargetAtTime(m>0?2500*Math.pow(0.2,Math.max(0,(m-0.4)/0.6)):20000,t,0.04);noiseG.gain.setTargetAtTime(0,t,0.03);return;}
  hp.frequency.setTargetAtTime(20,t,0.03);noiseG.gain.setTargetAtTime(0,t,0.03);
  // level 2 off the zone: a record at the wrong speed, tempo and pitch together, twice as far
  const isT=kind==='gear',r=isT?Math.pow(2,2*v/12):1, ps=isT?0:v;
  syncPos();rate=r;src.playbackRate.cancelScheduledValues(t);src.playbackRate.setValueAtTime(r,t);
  if(useWL){semiP.cancelScheduledValues(t);if(ps!==0)semiP.setTargetAtTime(ps,t,0.02);}else if(ps!==0)spTarget=ps;
  dryG.gain.cancelScheduledValues(t);wetG.gain.cancelScheduledValues(t);lp.frequency.cancelScheduledValues(t);
  dryG.gain.setTargetAtTime(v===0||isT?1:0,t,0.015);wetG.gain.setTargetAtTime(v===0||isT?0:1,t,0.015);
  lp.frequency.setTargetAtTime(v===0?20000:cutoff(isT?v*0.7:v),t,0.04);
}
let eqAn=null,eqData=null;
function newSource(offset){
  if(src){src.onended=null;try{src.stop()}catch(e){}}
  const s=ctx.createBufferSource();src=s;s.buffer=buf;s.connect(dryG);s.connect(shifter);
  if(!eqAn){eqAn=ctx.createAnalyser();eqAn.fftSize=2048;eqAn.smoothingTimeConstant=0.72;eqData=new Uint8Array(eqAn.frequencyBinCount);}s.connect(eqAn);
  const t=ctx.currentTime+0.08;s.start(t,offset);posBase=offset;ctxBase=t;rate=1;loopOn=false;
  s.onended=()=>{if(src===s)onEnd();};
  return t;
}
function play(){
  for(const L of LEVELS){L.locked.fill(false);L.score.fill(0);L.rec=L.rec.map(()=>[]);L.done.fill(false);L.flash.fill(0);}
  useLevel(0);cardT=performance.now()/1000+0.3;lineMsg=null;againBtn.style.display='none';stopBtn.style.display='none';world=0;lights=[];
  cur=-1;semi=0;state='intro';recCur=[];
  lat=(ctx.outputLatency||0)+(ctx.baseLatency||0);
  for(const p of [dryG.gain,wetG.gain,lp.frequency])p.cancelScheduledValues(0);
  const t=newSource(0);t0=t;
  dryG.gain.setValueAtTime(1,t);wetG.gain.setValueAtTime(0,t);lp.frequency.setValueAtTime(900,t);
  if(useWL){semiP.cancelScheduledValues(0);semiP.setValueAtTime(0,t);}else{spTarget=0;spSemi=0;}
  resetVisuals();
}
// song position: integrates the playback speed and follows the loop
function syncPos(){const ct=ctx.currentTime;if(ct>ctxBase){posBase+=(ct-ctxBase)*rate;ctxBase=ct;}
  if(loopOn&&posBase>=loopE)posBase=loopS+(posBase-loopE);}
function pos(){let p=posBase+Math.max(0,ctx.currentTime-ctxBase)*rate;if(loopOn&&p>=loopE)p=loopS+(p-loopE);return p;}
function setLoop(a,b){loopS=a;loopE=b;loopOn=true;src.loopEnd=b;src.loopStart=a;src.loop=true;}
function loopOff(){loopOn=false;src.loop=false;}
// beat position of what you hear right now (follows the tempo, compensates output latency)
function beatNow(){return (pos()-lat*rate+CLIP0-PHASE)/BEAT-17;}
let btnFlash=[0,0];
function setDev(v){semi=v;applyDev(v);recCur.push({p:pos(),v});}
function press(dir){
  btnFlash[dir<0?0:1]=1;
  if(ctx&&state==='replay'){replayJump(dir);return;}
  if(!ctx||!started||state==='done')return;
  if(state==='line'&&LEVELS[lv].kind==='mirror'){mirrorPress(dir);return;}
  if(state==='line'&&LEVELS[lv].kind==='rgb'){rgbDown(dir);return;}
  if(state==='line'&&LEVELS[lv].kind==='persp'){pDown(dir);return;}
  if(state==='line'&&LEVELS[lv].kind==='tune'){tDown(dir);return;}
  if(state==='line'&&LEVELS[lv].kind==='gear'){gPress(dir);return;}
  if(state==='line'&&LEVELS[lv].kind==='free'){if(dir<0)freeFloor();else freeGirl();freeBurst(dir<0?fGeo.br*1.35:W-fGeo.br*1.35,fGeo.btnY,Math.floor(Math.random()*360));return;}
  if((state==='line'||state==='intro')&&LEVELS[lv].kind==='world')switchWorld(dir<0?0:1);
}
function startLine(l,i){
  if(l!==lv){useLevel(l);}cur=i;recCur=[];
  const L=LEVELS[l];setLoop(L.loops[i][0],L.loops[i][1]);
  if(L.kind==='rgb'){startRGB();return;}
  if(L.kind==='persp'){pPart=-1;cur=0;loopOff();setDev(1);return;}
  if(L.kind==='tune'){tPart=-1;cur=0;loopOff();return;}
  if(L.kind==='gear'){gPart=-1;cur=0;loopOff();return;}
  if(L.kind==='mirror'){startMirror();return;}
  if(L.kind==='free'){cur=0;loopOff();setDev(0);return;}
  if(L.kind==='world'){if(i===0){if(world!==0)switchWorld(0);wGot=0;wTot=0;}buildLights(l,i);loopOff();setDev(1);} // one pass for the whole level
}
// level 4 ends: the score is the share of all its lights you caught, with 10% tolerance (27 of 30 counts as 100%)
function worldEnd(){const L=LEVELS[lv],now=performance.now()/1000,sc=wTot?Math.min(100,Math.round(100*wGot/(0.9*wTot))):0;
  L.score.fill(sc);L.locked.fill(sc===100);L.wv=1-sc/100;L.flash.fill(1);lights=[];
  lineMsg={t:now,text:sc===100?'FIXED!':sc+'%',good:sc>=50};}
function levelTick(dt){
  const p=pos();
  if(state==='intro'&&p>=LEVELS[0].win[0]){state='line';startLine(0,0);return;}
  if(state==='replay'){replayTick(p);return;}
  if(state!=='line')return;
  if(LEVELS[lv].kind==='mirror'){mirrorTick(p);return;}
  if(LEVELS[lv].kind==='rgb'){rgbTick(p);return;}
  if(LEVELS[lv].kind==='persp'){pTick(p);return;}
  if(LEVELS[lv].kind==='tune'){tTick(p);return;}
  if(LEVELS[lv].kind==='gear'){gTick(p);return;}
  if(LEVELS[lv].kind==='free'){const L=LEVELS[lv];
    if(p>=L.win[1]){L.done[0]=true;if(lv+1<LEVELS.length){const nl=lv+1;cardT=performance.now()/1000;startLine(nl,0);}else{state='after';setDev(0);}}
    return;}
  const L=LEVELS[lv];
  if(!loopOn&&p>=L.win[cur+1]){
    L.done[cur]=true;
    if(cur<L.units.length-1){startLine(lv,cur+1);}
    else{worldEnd();
      if(lv+1<LEVELS.length){cardT=performance.now()/1000;startLine(lv+1,0);return;}
      else{state='after';setDev(0);return;}}
  }
  if(L.kind==='world')worldTick();
}
// ---- the ending: your version of the song ----
function onEnd(){
  if(state==='replay'){finish();return;}
  state='replay';cardT=-99;againBtn.style.display='block';
  replayIdx=[-1,-1];useLevel(0);semi=0;cur=0;
  const t=newSource(REPLAY0);applyDev(0);
}
function replayJump(dir){const l=replayIdx[0];let tg;
  if(dir>0){if(l+1>=LEVELS.length)return;tg=LEVELS[l+1].win[0];}else tg=l-1>=0?LEVELS[l-1].win[0]:REPLAY0;
  newSource(Math.max(REPLAY0,tg));}
function replayTick(p){
  let l=-1,i=-1;for(let a=0;a<LEVELS.length;a++)for(let b=0;b<LEVELS[a].units.length;b++)if(p>=LEVELS[a].win[b]&&p<LEVELS[a].win[b+1]){l=a;i=b;}
  replayIdx=[l,i];
  if(stopBtn.style.display!=='block')stopBtn.style.display='block';
  if(l<0){if(semi!==0){semi=0;applyDev(0);}return;}
  if(l!==lv)useLevel(l);cur=i;
  const L=LEVELS[l];let v=0;
  // levels 3-6 not fixed: a steady bend; any miss is clearly heard (40%), a bigger miss bends more
  const audible=x=>x>0?0.4+0.6*Math.min(1,x):0;
  if(L.kind==='mirror'){v=audible(L.mv||0);}
  else if(L.kind==='rgb'||L.kind==='persp'){v=L.locked[i]?0:audible(1-L.score[i]/100);}
  else if(L.kind==='tune'||L.kind==='gear'){v=0;if(!L.locked[0])for(const e of L.rec[0])if(e.p<=p)v=e.v;}
  else if(L.kind==='world'){v=audible(L.wv||0);}
  if(v!==semi){semi=v;applyDev(v);}
}
// ---- sounds for presses ----
function beep(type){const t=ctx.currentTime,o=ctx.createOscillator(),gg=ctx.createGain();o.type='sine';o.frequency.value=type==='.'?880:660;
  const d=type==='.'?0.07:0.2;gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(0.18,t+0.005);gg.gain.setValueAtTime(0.18,t+d);gg.gain.linearRampToValueAtTime(0,t+d+0.02);
  o.connect(gg);gg.connect(master);o.start(t);o.stop(t+d+0.05);}
function buzz(){const t=ctx.currentTime,o=ctx.createOscillator(),gg=ctx.createGain();o.type='square';o.frequency.value=110;
  gg.gain.setValueAtTime(0.08,t);gg.gain.linearRampToValueAtTime(0,t+0.18);o.connect(gg);gg.connect(master);o.start(t);o.stop(t+0.2);}
// ---- RGB: five spotlights (red, green, blue, violet, orange) throw five copies of her outline, all off her real place
// (the thin gold outline). Tap = move the copy left / right, hold = move it back / front (smaller / bigger).
// one copy at a time; when it sits on the gold outline it locks and the next one is yours. One go for the whole level.
const RGBN=4,RGBC=['#ff4a5a','#4dff88','#4a7dff','#c46bff'],RGB_HOLD=0.25,RGB_STEP=0.16;
let rOffs=[],rAct=0,rInit=1,rPart=-1,rHold=[null,null],rFixed=false,rLockT=[];
function rgbRem(){let s=0;for(const o of rOffs)s+=Math.abs(o.dx)+Math.abs(o.dz);return s;}
// at the start every copy has its own place, 3 steps apart from the others (none overlap)
function rgbNewPart(){const slots=[-8,-5,-2,2,5,8].sort(()=>Math.random()-0.5).slice(0,RGBN);
  rOffs=slots.map(dx=>({dx,dz:Math.floor(Math.random()*7)-3}));
  rAct=0;rInit=rgbRem();rFixed=false;rLockT=Array(RGBN).fill(-9);rHold=[null,null];setDev(1);}
function startRGB(){rPart=-1;cur=0;loopOff();setDev(1);}
function rgbStepDone(){const o=rOffs[rAct],now=performance.now()/1000;
  if(o.dx===0&&o.dz===0){rLockT[rAct]=now;chime(false);
    let n=rAct;do{n++;}while(n<RGBN&&rOffs[n].dx===0&&rOffs[n].dz===0);
    if(n<RGBN)rAct=n;else{rFixed=true;flash=1;lineMsg={t:now,text:'FIXED!',good:true};}}
  setDev(rFixed?0:rgbRem()/rInit);}
function rgbDown(dir){const side=dir<0?0:1,now=performance.now()/1000;
  if(rFixed||rPart<0)return;rHold[side]={t:now,held:false,last:now};}
function rgbUp(dir){const side=dir<0?0:1,hd=rHold[side];rHold[side]=null;
  if(!hd||rFixed||rPart<0||hd.held)return;
  rOffs[rAct].dx+=dir;beep(dir<0?'-':'.');rgbStepDone();}   // a tap: left / right
function rgbTick(p){
  const L=LEVELS[lv],now=performance.now()/1000;
  // holding a button: back (left) / front (right), one step every RGB_STEP s
  for(let s=0;s<2;s++){const hd=rHold[s];if(!hd||rFixed)continue;
    if(!hd.held&&now-hd.t>=RGB_HOLD){hd.held=true;hd.last=now-RGB_STEP;}
    if(hd.held&&now-hd.last>=RGB_STEP){hd.last=now;rOffs[rAct].dz+=s?1:-1;beep(s?'.':'-');rgbStepDone();}}
  for(let k=0;k<L.units.length;k++)if(p>=L.win[k]&&p<L.win[k+1])cur=k;
  if(rPart<0&&p>=L.win[0]){rPart=0;L.rec[0]=recCur=[];rgbNewPart();}
  if(p>=L.win[L.units.length]){
    if(rPart>=0){const sc=rFixed?100:Math.max(0,Math.round(100*(1-rgbRem()/rInit)));L.score.fill(sc);L.locked.fill(rFixed);L.done.fill(true);L.flash.fill(1);
      if(!rFixed)lineMsg={t:now,text:sc+'%',good:sc>=50};}
    if(lv+1<LEVELS.length){const nl=lv+1;cardT=now;startLine(nl,0);}
    else{state='after';setDev(0);}}
}
// ---- perspective + shape: the world is tilted and she is out of shape. 4 parts (2 lines each).
// tap = turn the world left / right, hold left = shorter (and wider), hold right = taller (and thinner).
// a part is fixed when the world is straight and she fits the gold outline.
const P_ROT=6*Math.PI/180,P_SHP=0.09;
let pRot=0,pShp=0,pInit=1,pPart=-1,pHold=[null,null],pFixed=false;
const pRem=()=>Math.abs(pRot)+Math.abs(pShp);
function pNewPart(){pRot=(Math.random()<0.5?-1:1)*(2+Math.floor(Math.random()*3));pShp=(Math.random()<0.5?-1:1)*(1+Math.floor(Math.random()*3));
  pInit=pRem();pFixed=false;pHold=[null,null];setDev(1);}
function pStep(){const now=performance.now()/1000;
  if(pRot===0&&pShp===0){pFixed=true;flash=1;chime(false);lineMsg={t:now,text:'FIXED!',good:true};setDev(0);}else setDev(Math.min(1,pRem()/pInit));}
function pDown(dir){const side=dir<0?0:1,now=performance.now()/1000;if(pFixed||pPart<0)return;pHold[side]={t:now,held:false,last:now};}
function pUp(dir){const side=dir<0?0:1,hd=pHold[side];pHold[side]=null;if(!hd||pFixed||pPart<0||hd.held)return;
  pRot=Math.max(-8,Math.min(8,pRot+dir));beep(dir<0?'-':'.');pStep();}   // a tap: turn the world
function pTick(p){
  const L=LEVELS[lv],now=performance.now()/1000;
  for(let s=0;s<2;s++){const hd=pHold[s];if(!hd||pFixed)continue;
    if(!hd.held&&now-hd.t>=RGB_HOLD){hd.held=true;hd.last=now-RGB_STEP;}
    if(hd.held&&now-hd.last>=RGB_STEP){hd.last=now;pShp=Math.max(-5,Math.min(5,pShp+(s?1:-1)));beep(s?'.':'-');pStep();}}
  let i=-1;for(let k=0;k<L.units.length;k++)if(p>=L.win[k]&&p<L.win[k+1])i=k;
  const end=()=>{const sc=pFixed?100:Math.max(0,Math.round(100*(1-pRem()/pInit)));L.score[pPart]=sc;L.locked[pPart]=pFixed;L.done[pPart]=true;L.flash[pPart]=1;
    if(!pFixed)lineMsg={t:now,text:sc+'%',good:sc>=50};};
  if(i!==pPart&&i>=0){if(pPart>=0)end();pPart=i;cur=i;L.rec[i]=recCur=[];pNewPart();}
  if(p>=L.win[L.units.length]){if(pPart>=0&&!L.done[pPart])end();
    if(lv+1<LEVELS.length){const nl=lv+1;cardT=now;startLine(nl,0);}
    else{state='after';setDev(0);}}
}
// ---- level 1, tune: the wave is right; the outline over it (top and bottom line) is out of shape.
// tap left / right = narrower / wider (pitch: narrower = too high), hold left / right = flatter / taller (loudness).
// one go for the whole level; it is fixed when the outline hugs the bars.
let tFx=0,tFy=0,tInit=1,tPart=-1,tHold=[null,null],tFixed=false;
const tRem=()=>Math.abs(tFx)+Math.abs(tFy),tV=()=>tFx*16+tFy;
function tNewPart(){tFx=(Math.random()<0.5?-1:1)*(1+Math.floor(Math.random()*2));tFy=(Math.random()<0.5?-1:1)*(1+Math.floor(Math.random()*2));
  tInit=tRem();tFixed=false;tHold=[null,null];setDev(tV());}
function tStep(){const now=performance.now()/1000;
  if(tFx===0&&tFy===0){tFixed=true;flash=1;chime(false);lineMsg={t:now,text:'FIXED!',good:true};}setDev(tV());}
function tDown(dir){const side=dir<0?0:1,now=performance.now()/1000;if(tFixed||tPart<0)return;tHold[side]={t:now,held:false,last:now};}
function tUp(dir){const side=dir<0?0:1,hd=tHold[side];tHold[side]=null;if(!hd||tFixed||tPart<0||hd.held)return;
  tFx=Math.max(-6,Math.min(6,tFx-dir));beep(dir<0?'-':'.');tStep();}   // a tap: left = narrower (higher), right = wider (lower)
function tTick(p){
  const L=LEVELS[lv],now=performance.now()/1000;
  for(let s=0;s<2;s++){const hd=tHold[s];if(!hd||tFixed)continue;
    if(!hd.held&&now-hd.t>=RGB_HOLD){hd.held=true;hd.last=now-RGB_STEP;}
    if(hd.held&&now-hd.last>=RGB_STEP){hd.last=now;tFy=Math.max(-6,Math.min(6,tFy+(s?1:-1)));beep(s?'.':'-');tStep();}}
  for(let k=0;k<L.units.length;k++)if(p>=L.win[k]&&p<L.win[k+1])cur=k;
  if(tPart<0&&p>=L.win[0]){tPart=0;L.rec[0]=recCur=[];tNewPart();}
  if(p>=L.win[L.units.length]){
    if(tPart>=0){const sc=tFixed?100:Math.max(0,Math.round(100*(1-tRem()/tInit)));L.score.fill(sc);L.locked.fill(tFixed);L.done.fill(true);L.flash.fill(1);
      if(!tFixed)lineMsg={t:now,text:sc+'%',good:sc>=50};}
    if(lv+1<LEVELS.length){const nl=lv+1;cardT=now;startLine(nl,0);}
    else{state='after';setDev(0);}}
}
// ---- level 2, keep the speed: a rev counter shows the speed of the song, the gold zone is right.
// the needle keeps slipping (now faster, now slower, and the direction changes now and then);
// tap left / right = a little slower / faster. Score = how much of the level the needle was in the gold zone.
const G_MAX=10,G_ZONE=1.0; // the zone is wider than one tap, so a tap can bring the needle back without flying past it
// level 2 score: time in the zone, with 10% tolerance (90% of the time counts as 100%)
const gScore=()=>gTot>0?Math.min(100,Math.round(100*gIn/(0.9*gTot))):0;
let gV=0,gPart=-1,gVis=0,gDrift=0,gDriftT=0,gNextT=0,gIn=0,gTot=0,gLastP=0,gRecV=99,gRecT=0;
function gPress(dir){const now=performance.now()/1000;if(gPart<0)return;
  gV=Math.max(-G_MAX,Math.min(G_MAX,gV+dir));beep(dir<0?'-':'.');}
// a new direction and speed every 2-4.5 s; the needle eases into it (about half a second), no sudden turns
function gNewDrift(now){gDriftT=(Math.random()<0.5?-1:1)*(1.3+Math.random()*1.7);gNextT=now+2+Math.random()*2.5;}
function gTick(p){
  const L=LEVELS[lv],now=performance.now()/1000;
  for(let k=0;k<L.units.length;k++)if(p>=L.win[k]&&p<L.win[k+1])cur=k;
  if(gPart<0&&p>=L.win[0]){gPart=0;L.rec[0]=recCur=[];gV=0;   // starts in the gold zone, then slips at once
    gIn=0;gTot=0;gLastP=now;gRecV=99;gDrift=0;gNewDrift(now);}
  if(gPart>=0&&p<L.win[L.units.length]){
    const dp=Math.max(0,Math.min(0.1,now-gLastP));gLastP=now; // real seconds
    if(now>=gNextT)gNewDrift(now);
    gDrift+=(gDriftT-gDrift)*Math.min(1,dp/0.2);
    gV=Math.max(-G_MAX,Math.min(G_MAX,gV+gDrift*dp));
    gTot+=dp;if(Math.abs(gV)<=G_ZONE)gIn+=dp;
    // the song follows the needle (recorded for your version at the end)
    const v=Math.abs(gV)<=G_ZONE?0:Math.round(gV*4)/8;
    if(v!==gRecV&&now-gRecT>0.08){gRecV=v;gRecT=now;setDev(v);}}
  if(p>=L.win[L.units.length]){
    if(gPart>=0){const sc=gScore();L.score.fill(sc);L.locked.fill(sc===100);L.done.fill(true);L.flash.fill(1);
      lineMsg={t:now,text:sc+'% IN THE ZONE',good:sc>=50};}
    if(lv+1<LEVELS.length){const nl=lv+1;cardT=now;startLine(nl,0);}
    else{state='after';setDev(0);}}
}
// ---- mirror: she stands off to one side and points to the middle; press that side to bring her in.
// 10 shifts (random, 0.8-1.8 s apart) throw her to the other side, same distance.
// the further she is from the middle, the stronger the echo in the song.
const MD0=12,MDMAX=16;
let mD0=MD0,mS=-1,mD=MD0,mShifts=[],mSi=0,mShiftT=-9,mFixed=false;
function startMirror(){const L=LEVELS[lv];mD0=L.md0||MD0;mS=-1;mD=mD0;mSi=0;mFixed=false;cur=0;
  // n shifts (10 in level 6) from about 1 s in to the end, at random gaps
  const n=L.shifts||10,end=L.win[L.units.length]-0.5,gp=(end-L.win[0])/(n+0.5);
  do{mShifts=[];let t=L.win[0];for(let k=0;k<n;k++){t+=gp*(0.55+Math.random()*0.9);mShifts.push(t);}}while(mShifts[n-1]>end);
  loopOff();setDev(1);}
function mirrorPress(dir){
  const now=performance.now()/1000;
  if(mFixed)return;
  if(dir===-mS){mD--;beep(dir<0?'-':'.');}else{mD=Math.min(MDMAX,mD+1);buzz();}
  if(mD<=0){mD=0;mFixed=true;flash=1;lineMsg={t:now,text:'FIXED!',good:true};LEVELS[lv].locked.fill(true);setDev(0);}
  else setDev(Math.min(1,mD/mD0));
}
function mirrorTick(p){
  const L=LEVELS[lv],now=performance.now()/1000;
  for(let i=0;i<L.units.length;i++){if(p>=L.win[i]&&p<L.win[i+1])cur=i;if(p>=L.win[i+1]&&!L.done[i]){L.done[i]=true;L.flash[i]=1;}}
  while(mSi<mShifts.length&&p>=mShifts[mSi]){if(!mFixed){mS=-mS;mShiftT=now;lineMsg={t:now,text:'SHIFT!',good:true};setDev(semi);}mSi++;}
  if(p>=L.win[L.units.length]){
    const sc=mFixed?100:Math.max(0,Math.round(100*(1-mD/mD0)));
    L.score.fill(sc);L.locked.fill(mFixed);L.done.fill(true);L.flash.fill(1);L.mv=mFixed?0:Math.min(1,mD/mD0);
    if(!mFixed)lineMsg={t:now,text:sc+'% FIXED',good:sc>=50};
    if(lv+1<LEVELS.length){const nl=lv+1;cardT=now;startLine(nl,0);}
    else{state='after';setDev(0);}
  }
}
// ---- two worlds ----
let world=0,wipeT=-9,wipeDir=1,lights=[],LEAD=1.7;
function buildLights(l,i){const L=LEVELS[l];wTot+=L.lights[i].length;lights=L.lights[i].map(([b,w])=>({t:L.win[i]+b*BEAT,w:w==='N'?1:0,st:0,rt:0}));}
function chime(night){const t=ctx.currentTime;for(const f of night?[1047,1568]:[784,988]){const o=ctx.createOscillator(),gg=ctx.createGain();o.type='triangle';o.frequency.value=f;
  gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(0.09,t+0.01);gg.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.connect(gg);gg.connect(master);o.start(t);o.stop(t+0.4);}}
function switchWorld(w){if(w===world)return;world=w;wipeT=performance.now()/1000;wipeDir=w?-1:1;if(src)applyDev(semi);}
function worldTick(){
  const th=pos()-lat*rate,now=performance.now()/1000;
  for(const L of lights)if(L.st===0&&th>=L.t){if(world===L.w){L.st=1;wGot++;chime(L.w===1);}else{L.st=2;buzz();}L.rt=now;}
  if(semi!==0&&lights.length&&lights.every(L=>L.st===1)){setDev(0);flash=1;}
}
function levelScore(i){const L=LEVELS[i];return Math.round(L.score.reduce((a,b)=>a+b,0)/L.score.length);}
function totalLocked(){let n=0;for(const L of LEVELS)if(!L.noScore)n+=L.locked.filter(Boolean).length;return n;}
function totalScore(){let s=0,n=0;LEVELS.forEach((L,i)=>{if(L.noScore)return;s+=levelScore(i);n++;});return Math.round(s/n);}
// the end (song over, or STOP): she falls asleep again, the lights go out, then nothing moves
let doneT=-9,doneB=0;
function finish(){if(ctx)doneB=beatNow();doneT=performance.now()/1000;state='done';if(src){src.onended=null;try{src.stop()}catch(e){}}
  againBtn.style.display='block';stopBtn.style.display='none';}

// ---------- overlay / input ----------
const ov=document.getElementById('ov'),go=document.getElementById('go'),againBtn=document.getElementById('again'),stopBtn=document.getElementById('stop');
againBtn.addEventListener('pointerdown',e=>e.stopPropagation());
stopBtn.addEventListener('pointerdown',e=>e.stopPropagation());
stopBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='replay')finish();});
againBtn.addEventListener('click',e=>{e.stopPropagation();if(!ctx)return;againBtn.style.display='none';play();});
async function start(){
  if(ov.style.display==='none')return;
  ov.style.display='none';
  if(!ctx){go.disabled=true;await initAudio();go.disabled=false;}
  if(ctx.state==='suspended')await ctx.resume();
  started=true;play();
}
go.addEventListener('click',e=>{e.stopPropagation();start();});
// start screen: 4 pages, NEXT goes forward, the last one has START
let ovPage=0;const ovPages=[...document.querySelectorAll('#ov .pg')],ovDots=[...document.querySelectorAll('#ov .dots b')];
function ovShow(n){ovPage=n;ovPages.forEach((p,i)=>p.classList.toggle('on',i===n));ovDots.forEach((d,i)=>d.classList.toggle('on',i===n));}
function ovStep(){if(ovPage<ovPages.length-1)ovShow(ovPage+1);else start();}
document.querySelectorAll('#ov .nx').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();ovStep();}));
const fsb=document.getElementById('fs');
function toggleFS(){const d=document;if(!d.fullscreenElement)(d.documentElement.requestFullscreen||d.documentElement.webkitRequestFullscreen||(()=>{})).call(d.documentElement);else (d.exitFullscreen||d.webkitExitFullscreen).call(d);}
fsb.addEventListener('click',e=>{e.stopPropagation();toggleFS();});
fsb.addEventListener('pointerdown',e=>e.stopPropagation());
const releaseAt=x=>{if(!started||state!=='line')return;const k=LEVELS[lv].kind,d=x<W/2?-1:1;if(k==='rgb')rgbUp(d);else if(k==='persp')pUp(d);else if(k==='tune')tUp(d);};
const onUI=e=>e.target&&e.target.closest&&e.target.closest('button,#ov');
addEventListener('pointerup',e=>{if(!onUI(e))releaseAt(e.clientX-cvLeft);});addEventListener('pointercancel',e=>{if(!onUI(e))releaseAt(e.clientX-cvLeft);});
addEventListener('keyup',e=>{if(!started||state!=='line')return;const up=LEVELS[lv].kind==='rgb'?rgbUp:LEVELS[lv].kind==='persp'?pUp:LEVELS[lv].kind==='tune'?tUp:null;if(!up)return;
  if(e.code==='ShiftLeft'||e.code==='ArrowLeft')up(-1);else if(e.code==='ShiftRight'||e.code==='ArrowRight')up(1);});
addEventListener('pointerdown',e=>{if(ov.style.display!=='none'||onUI(e))return;const x=e.clientX-cvLeft;if(started&&state==='line'&&LEVELS[lv].kind==='free'){freeTap(x,e.clientY);return;}press(x<W/2?-1:1);});
addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(e.code==='KeyF'){toggleFS();return;}
  if(ov.style.display!=='none'){if(['ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code)){e.preventDefault();ovStep();}return;}
  if(e.code==='ShiftLeft'||e.code==='ArrowLeft'){e.preventDefault();press(-1);}
  else if(e.code==='ShiftRight'||e.code==='ArrowRight'){e.preventDefault();press(1);}
});

// ---------- poses (packed: left half = neon line, right half = body alpha) ----------
const POSE={};let PW=0,PH=0;
const poseNames=Object.keys(POSES);
let posesReady=0;
for(const k of poseNames){
  const im=new Image();
  im.onload=()=>{
    const w=im.width/2,h=im.height;PW=w;PH=h;
    const t=document.createElement('canvas');t.width=im.width;t.height=h;const tg=t.getContext('2d');tg.drawImage(im,0,0);
    const d=tg.getImageData(0,0,im.width,h).data;
    const mk=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
    const L=mk(),B=mk(),lg=L.getContext('2d'),bg=B.getContext('2d');
    const li=lg.createImageData(w,h),bi=bg.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const o=(y*w+x)*4,sl=(y*im.width+x)*4,sa=(y*im.width+x+w)*4;
      li.data[o]=li.data[o+1]=li.data[o+2]=255;li.data[o+3]=d[sl];
      bi.data[o]=11;bi.data[o+1]=9;bi.data[o+2]=16;bi.data[o+3]=d[sa];}
    lg.putImageData(li,0,0);bg.putImageData(bi,0,0);
    POSE[k]={L,B};posesReady++;
  };
  im.src='data:image/png;base64,'+POSES[k];
}
const tint=document.createElement('canvas'),tg2=tint.getContext('2d');
// pose geometry in packed image pixels: feet bottom ≈ 842.6, head ≈ 150
const FEET=842.6,HEAD=160,FIG=749;


