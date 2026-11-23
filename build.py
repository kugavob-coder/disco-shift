# Disco Shift — build
#   python3 build.py                -> disco-full.html  (svi nivoi + "your version" replay na kraju)
#   python3 build.py test 3 44    -> disco-level3-test.html (samo nivo 3, start sa 44 s pesme, bez replay-a)
import sys,base64
rd=lambda f:open(f,encoding='utf-8').read()
js=rd('script16_head.js')+rd('script16_tail.js')
js=js.replace('__AUDIO__',base64.b64encode(open('clip6.mp3','rb').read()).decode()).replace('__POSES__',rd('poses16.json'))
js=js.replace('locked=[false,false,false,false],','locked=LEVELS[0].locked,')
js=js.replace('let lineDone,lineFlash,','let lineDone=LEVELS[0].done,lineFlash=LEVELS[0].flash,')
js=js.replace('const figH=Math.min(feetY-figTop-base*0.6,W*1.25)','const figH=Math.min(feetY-topY-base*3.1,W*1.25)')
out='disco-full.html'
if len(sys.argv)>1 and sys.argv[1]=='test':
  n=int(sys.argv[2]);start=sys.argv[3];out='disco-level%d-test.html'%n
  a=js.index('\n',js.index('if(!L.loops)'))+1
  js=js[:a]+'LEVELS.splice(0,%d);LEVELS.splice(1); // TEST: level %d only\n'%(n-1,n)+js[a:]
  js=js.replace('const t=newSource(0);','const t=newSource(c(%s));'%start)
  js=js.replace("if(state==='replay'){finish();return;}","finish();return; // TEST: no replay")
  js=js.replace("state='after';setDev(0);","setDev(0);if(src){src.onended=null;try{src.stop()}catch(e){}}finish();") # TEST: stop right after the level
open(out,'w',encoding='utf-8').write(rd('head_part3.html')+js+'\n</body>\n</html>\n')
print('built',out)
