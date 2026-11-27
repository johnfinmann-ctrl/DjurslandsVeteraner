// Lokal test med simuleret Google-miljø (Sheet, Cache, Lock, Mail). Samtidighed testes rigtigt i Apps Script via testKonkurrence().
const fs=require('fs'),vm=require('vm'),cr=require('crypto');
const mails=[],reqs=[];let brevoMode='ok';const PROPS={BREVO_API_KEY:'TESTNOEGLE-xyz-123'};
const store={Gentagelser:[],Arrangementer:[],Tilmeldinger:[],Admins:[],Log:[],Indstillinger:[['site_url','https://test.invalid/dv'],['afsender_email','forening@test.invalid'],['afsender_navn','DV Test'],['forening_navn','DV Test']]};
let clock=Date.UTC(2026,10,19,12,0,0);
class FD extends Date{constructor(...a){a.length?super(...a):super(clock)}static now(){return clock}}
const heads={Gentagelser:['id','titel','type','sted','beskrivelse','ugedag','uge_i_maaneden','start','slut','ansvarlig_navn','ansvarlig_email','modtager_email','tilmelding','pladser','maaneder_frem','godkendt','afklares'],Arrangementer:['id','titel','dato','start','slut','sted','beskrivelse','ansvarlig_navn','ansvarlig_email','modtager_email','pladser','status','type','testdata','tilmelding','kraever_telefon','kraever_bemaerkning','popup','billede','skjul'],Tilmeldinger:['id','event_id','tidspunkt','navn','email','tlf','antal','bemaerkning','status','mail_deltager','mail_ansvarlig','mail_fejl','afmeld_token'],Admins:['email','rolle'],Log:['tid','admin','handling','event_id','detalje'],Indstillinger:['noegle','vaerdi']};
const sheet=n=>({getDataRange:()=>({getValues:()=>[heads[n].slice(),...store[n].map(r=>r.slice())]}),appendRow:r=>store[n].push(r),getLastRow:()=>store[n].length+1,
 getRange:(row,col,nr,nc)=>({setValue:v=>{store[n][row-2][col-1]=v},setValues:vs=>{vs[0].forEach((v,i)=>store[n][row-2][col-1+i]=v)}})});
const cache=new Map();const cget=k=>{const e=cache.get(k);if(!e)return null;if(e.exp<=clock){cache.delete(k);return null}return e.v};
const sb={Logger:{log(){}},console,JSON,Date:FD,Number,String,Math,
 SpreadsheetApp:{getActive:()=>({getSheetByName:sheet}),flush(){}},
 CacheService:{getScriptCache:()=>({get:cget,put:(k,v,ttl)=>cache.set(k,{v,exp:clock+(ttl||600)*1000}),remove:k=>cache.delete(k)})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>PROPS[k]??null})},
 UrlFetchApp:{fetch:(url,o)=>{reqs.push({url,o});if(brevoMode==='throw')throw new Error('net');const p=JSON.parse(o.payload);
   if(url!=='https://api.brevo.com/v3/smtp/email'||!o.headers||o.headers['api-key']!==PROPS.BREVO_API_KEY)return{getResponseCode:()=>401};
   if(brevoMode==='401')return{getResponseCode:()=>401};if(brevoMode==='400')return{getResponseCode:()=>400};
   if(brevoMode==='onlyAnsvarlig'&&p.to[0].email.includes('ex.dk'))return{getResponseCode:()=>400};
   mails.push({to:p.to[0].email,s:p.subject,b:p.textContent,sender:p.sender});return{getResponseCode:()=>201}}},
 ContentService:{createTextOutput:t=>({t,setMimeType(){return this}}),MimeType:{JSON:1}},
 Utilities:{getUuid:()=>cr.randomUUID(),DigestAlgorithm:{SHA_256:1},computeDigest:(a,s)=>[...cr.createHash('sha256').update(s).digest()].map(b=>b>127?b-256:b),formatDate:(d)=>d.toISOString().slice(0,10)}};
vm.createContext(sb);vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),sb);
const post=o=>JSON.parse(sb.doPost({postData:{contents:JSON.stringify(o)}}).t);
const get=a=>JSON.parse(sb.doGet({parameter:{action:a}}).t);
let f=0;const t=(n,c)=>{console.log((c?'OK   ':'FEJL ')+n);if(!c)f++};
const ev=(id,ans,p=5)=>[id,'T '+id,'2027-01-15','18:00','20:00','Sted','b','N',ans,'mod@x.dk',p,'aktiv','arrangement','JA'];
store.Arrangementer.push(ev('t1','a@x.dk'),ev('t2','b@x.dk'));
store.Admins.push(['a@x.dk','ansvarlig'],['b@x.dk','ansvarlig'],['h@x.dk','hoved']);
const su=(id,i,n=1)=>post({action:'signup',event_id:id,navn:'Test '+i,email:'p'+i+'@ex.dk',tlf:'12345678',antal:n,bemaerkning:''});
// Offentlig
const pub=JSON.stringify(get('events'));
t('offentlig: ingen e-mail/tilmeldte',!/@/.test(pub.replace(/"@/g,''))&&!pub.includes('a@x.dk')&&!pub.includes('mod@x.dk'));
// Kapacitet + mail
const res=[1,2,3,4,5,6,7,8].map(i=>su('t1',i));
t('præcis 5 gemt',res.filter(r=>r.ok).length===5);
t('resten fuldt',res.filter(r=>r.error==='fuldt').length===3);
t('A: 5 beskeder til ansvarlig via Brevo',mails.filter(m=>m.s.startsWith('Ny tilmelding')&&m.to==='mod@x.dk').length===5);
t('A: 5 bekræftelser til deltagere via Brevo',mails.filter(m=>m.s.startsWith('Bekræftelse')&&m.to.endsWith('@ex.dk')).length===5);
t('A: afsender fra Indstillinger',mails[0].sender.email==='forening@test.invalid');

t('A: status sendt registreret',store.Tilmeldinger.filter(r=>r[9]==='sendt'&&r[10]==='sendt').length===5);
t('afvist (fuldt) tilmelding udløser ingen mail',mails.length===10);
t('flere pers. over grænsen afvises',su('t2',1,6).error==='fuldt');
t('antal 5 passer præcis',su('t2',2,5).ok);
store.Arrangementer[1][10]=50;
brevoMode='401';const mf=su('t2',3);brevoMode='ok';
t('Brevo-fejl (401): tilmelding gemt + FEJL registreret',mf.ok&&mf.mail==='FEJL'&&store.Tilmeldinger.at(-1)[8]==='registreret'&&store.Tilmeldinger.at(-1)[9]==='FEJL'&&store.Tilmeldinger.at(-1)[10]==='FEJL'&&String(store.Tilmeldinger.at(-1)[11]).includes('HTTP 401'));
t('ugyldigt afvist uden række',(n=>{const b=store.Tilmeldinger.length;su('t1','x',0);return store.Tilmeldinger.length===b})());
t('ukendt event',su('findes_ikke',1).error==='ukendt_event');
// Login
const noTok=post({action:'admin_list',event_id:'t1'});
t('uden token: nægtet',noTok.error==='ikke_adgang');
t('falsk token: nægtet',post({action:'admin_list',event_id:'t1',token:'x'.repeat(80)}).error==='ikke_adgang');
mails.length=0;
t('ukendt e-mail: samme svar, ingen mail',post({action:'request_code',email:'ukendt@x.dk'}).ok===true&&mails.length===0);
post({action:'request_code',email:'a@x.dk'});
const code=/Kode: (\d{8})/.exec(mails.at(-1).b)[1];
t('C: kode sendt via Brevo til admin',mails.at(-1).to==='a@x.dk'&&code.length===8);
t('forkert kode nægtet',post({action:'verify_code',email:'a@x.dk',code:'00000000'}).ok===false);
const v=post({action:'verify_code',email:'a@x.dk',code});
t('rigtig kode giver token',v.ok&&v.token.length>=60);
t('kode kan ikke genbruges',post({action:'verify_code',email:'a@x.dk',code}).ok===false);
// Lockout
post({action:'request_code',email:'b@x.dk'});const code2=/Kode: (\d{8})/.exec(mails.at(-1).b)[1];
for(let i=0;i<5;i++)post({action:'verify_code',email:'b@x.dk',code:'11111111'});
t('låst efter 5 forkerte (rigtig kode virker ikke)',post({action:'verify_code',email:'b@x.dk',code:code2}).ok===false);
// Rate limit
let sent=0;for(let i=0;i<10;i++){const b=mails.length;post({action:'request_code',email:'h@x.dk'});sent+=mails.length-b}
t('max 5 koder/time pr. admin',sent===5);
// Autorisation
const L=post({action:'admin_list',event_id:'t1',token:v.token});
t('ansvarlig A ser egen liste (5 pers.)',L.ok&&L.total===5&&L.free===0&&L.regs.length===5);
t('A ser IKKE B\'s event',post({action:'admin_list',event_id:'t2',token:v.token}).error==='ikke_adgang');
t('A: ukendt id = samme svar',post({action:'admin_list',event_id:'zzz',token:v.token}).error==='ikke_adgang');
t('A kan ikke fjerne B\'s tilmelding',post({action:'admin_remove',event_id:'t2',reg_id:store.Tilmeldinger.find(r=>r[1]==='t2')[0],token:v.token}).ok===false);
t('A får kun egne events',post({action:'admin_events',token:v.token}).events.length===1);
const rm=post({action:'admin_remove',event_id:'t1',reg_id:L.regs[0].id,token:v.token});
t('A fjerner tilmelding → plads frigives',rm.ok&&post({action:'admin_list',event_id:'t1',token:v.token}).free===1);
t('CSV har BOM + 4 rækker',(c=>c.startsWith('﻿')&&c.split('\r\n').length===5)(post({action:'admin_csv',event_id:'t1',token:v.token}).csv));
// Fjernet admin
store.Admins.splice(0,1);
t('fjernet admin mister adgang straks',post({action:'admin_list',event_id:'t1',token:v.token}).error==='ikke_adgang');
// Hoved
post({action:'request_code',email:'h@x.dk'});cache.delete('req:h@x.dk');post({action:'request_code',email:'h@x.dk'});
const hc=/Kode: (\d{8})/.exec(mails.at(-1).b)[1];const hv=post({action:'verify_code',email:'h@x.dk',code:hc});
t('hovedadmin ser begge events',hv.ok&&post({action:'admin_events',token:hv.token}).events.length===2);


// ---- Brevo-specifikke tests ----
const nBefore=store.Tilmeldinger.length;
brevoMode='throw';const ex=su('t2','n1');brevoMode='ok';
t('netværksfejl mod Brevo: tilmelding gemt',ex.ok&&store.Tilmeldinger.length===nBefore+1&&store.Tilmeldinger.at(-1)[11].includes('undtagelse'));
brevoMode='onlyAnsvarlig';const half=su('t2','n2');brevoMode='ok';
t('kun deltagermail fejler: ansvarlig fik stadig besked',half.mail==='FEJL'&&store.Tilmeldinger.at(-1)[9]==='FEJL'&&store.Tilmeldinger.at(-1)[10]==='sendt');
const mb=mails.length;sb.gensendFejledeMails();
t('administrator kan gensende fejlede mails',store.Tilmeldinger.filter(r=>r[1]==='t2'&&r[8]==='registreret'&&r[3]!==''&&(r[9]==='FEJL'||r[10]==='FEJL')).length===0&&mails.length>mb);
t('gensend sender ikke dobbelt til allerede sendte',(()=>{const k=mails.length;sb.gensendFejledeMails();return mails.length===k})());
t('log: mailfejl registreret uden persondata',store.Log.some(r=>r[2]==='mail_fejl')&&!JSON.stringify(store.Log).includes('@ex.dk'));
t('API-nøgle kun i header (ikke i Sheet/Log/svar/offentlig data)',!JSON.stringify(store).includes(PROPS.BREVO_API_KEY)&&!JSON.stringify(get('events')).includes(PROPS.BREVO_API_KEY)&&reqs.every(r=>!String(r.o.payload).includes(PROPS.BREVO_API_KEY)&&r.o.headers['api-key']===PROPS.BREVO_API_KEY));
t('kode i mail men ikke i API-svar',(()=>{const r=JSON.stringify(post({action:'request_code',email:'h@x.dk'}));return !/\d{8}/.test(r)})());
delete PROPS.BREVO_API_KEY;const k0=mails.length;const nk=su('t2','n3');
t('uden API-nøgle: gemt, ingen mail, fejl "ikke_opsat"',nk.ok&&mails.length===k0&&store.Tilmeldinger.at(-1)[11].includes('ikke_opsat'));
cache.delete('req:h@x.dk');post({action:'request_code',email:'h@x.dk'});
t('login-mail kan ikke sendes uden nøgle: generisk svar + log',store.Log.some(r=>r[2]==='login_mail_fejl'));
PROPS.BREVO_API_KEY='TESTNOEGLE-xyz-123';
brevoMode='401';cache.delete('req:h@x.dk');const lr=post({action:'request_code',email:'h@x.dk'});brevoMode='ok';
t('Brevo afviser login-mail: svaret afslører intet',lr.ok===true&&Object.keys(lr).length===1);

// ---- Test C supplement: udløb, begrænsning, log, spam, persondata ----
post({action:'request_code',email:'h@x.dk'});cache.delete('req:h@x.dk');post({action:'request_code',email:'h@x.dk'});
const ec=/Kode: (\d{8})/.exec(mails.at(-1).b)[1];
clock+=9*60*1000;
const probe=post({action:'verify_code',email:'h@x.dk',code:'00000000'});
clock+=2*60*1000; // nu 11 min efter udstedelse
t('kode udløber efter 10 min',post({action:'verify_code',email:'h@x.dk',code:ec}).ok===false);
cache.delete('req:h@x.dk');post({action:'request_code',email:'h@x.dk'});
const ec2=/Kode: (\d{8})/.exec(mails.at(-1).b)[1];
clock+=9*60*1000;
const okLate=post({action:'verify_code',email:'h@x.dk',code:ec2});
t('kode virker inden for 10 min',okLate.ok===true);
clock+=5*3600*1000+59*60*1000;
t('session gyldig lige inden 6 timer',post({action:'admin_events',token:okLate.token}).ok===true);
clock+=2*60*1000;
t('session udløbet efter 6 timer',post({action:'admin_events',token:okLate.token}).error==='ikke_adgang');
t('log: login registreret',store.Log.some(r=>r[2]==='login'));
t('log: låsning registreret',store.Log.some(r=>r[2]==='login_laast'));
t('log: fjernelse registreret uden persondata',store.Log.some(r=>r[2]==='fjern_tilmelding')&&!JSON.stringify(store.Log).includes('@ex.dk')&&!JSON.stringify(store.Log).includes('Test '));
// spam
const spam=[1,2,3,4].map(()=>su('t2','spam'));
t('max 3 tilmeldinger/time pr. e-mail',spam.filter(r=>r.ok).length===3&&spam[3].error==='for_mange');
clock+=61*60*1000;
const base=store.Tilmeldinger.length;let blocked=0;
store.Arrangementer[1][10]=1000;
for(let i=0;i<70;i++){const r=su('t2','m'+i);if(r.error==='for_mange')blocked++}
t('global grænse pr. minut (60)',blocked===10);
t('honeypot: ingen række',(b=>{post({action:'signup',event_id:'t1',website:'x',navn:'Bot',email:'b@ex.dk',tlf:'12345678',antal:1});return store.Tilmeldinger.length===b})(store.Tilmeldinger.length));
// Afmelding via personligt link
clock+=180000;store.Arrangementer.push(ev('t3','a@x.dk',2));t('afmelding: forberedelse (2 pladser optaget)',su('t3',70,2).ok===true);const reg1=store.Tilmeldinger.find(r=>r[1]==='t3'),link=mails.find(m=>m.s.startsWith('Bekræftelse')&&m.to===reg1[4]);
t('afmelding: bekræftelsesmail indeholder personligt link',!!link&&link.b.includes('https://test.invalid/dv/#/afmeld?id='+reg1[0]+'&t='+reg1[12]));
t('afmelding: forkert token afvises',post({action:'unsubscribe',id:reg1[0],token:'x'.repeat(64)}).error==='ugyldigt_link'&&reg1[8]==='registreret');
t('afmelding: tom token afvises',post({action:'unsubscribe',id:reg1[0],token:''}).error==='ugyldigt_link');
const before=mails.length,ur=post({action:'unsubscribe',id:reg1[0],token:reg1[12]});
t('afmelding: korrekt link afmelder',ur.ok===true&&reg1[8]==='afmeldt');
t('afmelding: ansvarlig får besked via Brevo',mails.length===before+1&&mails[mails.length-1].s.startsWith('Afmelding')&&mails[mails.length-1].to==='mod@x.dk');
t('afmelding: gentaget klik ændrer intet og sender ingen ny mail',post({action:'unsubscribe',id:reg1[0],token:reg1[12]}).allerede===true&&mails.length===before+1);
t('afmelding: pladsen frigives (2 kan tilmelde sig igen, derefter fuldt)',su('t3',71,2).ok===true&&su('t3',72).error==='fuldt');
t('offentlig liste viser kun antal, aldrig navne/e-mail/token',!/Test 1|p1@ex|afmeld_token/.test(JSON.stringify(get('events'))));
// persondata
store.Arrangementer.push(['gammel','Gammel','2026-09-01','','','','','','a@x.dk','m@x.dk',5,'aktiv','arrangement','JA']);
store.Tilmeldinger.push(['g1','gammel','','Gammel Person','g@ex.dk','12345678',2,'bem','registreret','sendt']);
sb.slettGamlePersondata();
const g=store.Tilmeldinger.find(r=>r[0]==='g1');
t('persondata slettet efter arrangement (antal bevaret)',g[3]===''&&g[4]===''&&g[5]===''&&g[7]===''&&g[6]===2&&g[8]==='slettet');
t('nyt arrangement urørt af oprydning',store.Tilmeldinger.filter(r=>r[1]==='t2'&&r[3]!=='').length>0);
t('log: persondata-sletning',store.Log.some(r=>r[2]==='slet_persondata'));
// Gentagelser
const nd=sb.naesteDatoer_({ugedag:1,uge_i_maaneden:1},'2026-11-26',3);
t('gentagelse: første mandag i måneden',JSON.stringify(nd)==='["2026-12-07","2027-01-04","2027-02-01"]');
t('gentagelse: sidste fredag',JSON.stringify(sb.naesteDatoer_({ugedag:5,uge_i_maaneden:'sidste'},'2026-11-26',1))==='["2026-11-27","2026-12-25"]');
store.Gentagelser.push(['r1','Café','cafe','Sted','',1,1,'','','Ans','a@x.dk','m@x.dk','nej','',2,'nej','']);
store.Gentagelser.push(['r2','Afklares','cafe','Sted','',1,1,'14:00','17:00','Ans','a@x.dk','m@x.dk','nej','',2,'ja','Tid modstridende']);
const antalFoer=store.Arrangementer.length;sb.genererGentagelser();
t('gentagelse: ikke godkendt eller uafklaret opretter intet',store.Arrangementer.length===antalFoer);
store.Gentagelser[0][7]='14:00';store.Gentagelser[0][8]='17:00';store.Gentagelser[0][15]='ja';
sb.genererGentagelser();const nye=store.Arrangementer.length-antalFoer;
t('gentagelse: godkendt regel opretter rækker i Arrangementer',nye>=2&&store.Arrangementer.some(r=>String(r[0]).startsWith('rep-r1-')));
sb.genererGentagelser();t('gentagelse: kan køres igen uden dubletter',store.Arrangementer.length===antalFoer+nye);

/* ---- V4.5 QC-rettelser ---- */
{const mk=(id,x={})=>{const r=ev(id,'a@x.dk',0);while(r.length<20)r.push('');Object.assign(r,x);store.Arrangementer.push(r);};
 mk('q1');
 let r=post({action:'signup',event_id:'q1',navn:'Uden Telefon',email:'ut@ex.dk',tlf:'',antal:1,bemaerkning:''});
 t('V4.5: tilmelding uden telefon virker når telefon ikke kræves',r.ok===true);
 mk('q2',{14:'ja',15:'ja'}); // 14=kraever_telefon? se heads
 const iT=heads.Arrangementer.indexOf('kraever_telefon');store.Arrangementer.find(x=>x[0]==='q2')[iT]='ja';
 r=post({action:'signup',event_id:'q2',navn:'Uden Telefon',email:'ut2@ex.dk',tlf:'',antal:1,bemaerkning:''});
 t('V4.5: telefon kræves når arrangementet kræver den',r.ok===false&&r.felter&&r.felter.includes('tlf'));
 r=post({action:'signup',event_id:'q1',navn:'=HYPERLINK("http://x")',email:'fi@ex.dk',tlf:'',antal:1,bemaerkning:'@SUM(1)'});
 const row=store.Tilmeldinger[store.Tilmeldinger.length-1];
 t('V4.5: formelinjektion i navn/bemærkning neutraliseres i Sheet',r.ok&&row[3].startsWith("'=")&&row[7].startsWith("'@"));
 mk('q3');store.Arrangementer.find(x=>x[0]==='q3')[heads.Arrangementer.indexOf('skjul')]='ja';
 t('V4.5: skjult arrangement kan ikke tilmeldes',post({action:'signup',event_id:'q3',navn:'Abc',email:'s1@ex.dk',tlf:'',antal:1}).ok===false);
 mk('q4');store.Arrangementer.find(x=>x[0]==='q4')[heads.Arrangementer.indexOf('tilmelding')]='nej';
 t('V4.5: tilmelding=nej afviser tilmelding',post({action:'signup',event_id:'q4',navn:'Abc',email:'s2@ex.dk',tlf:'',antal:1}).ok===false);
 mk('q5',{});store.Arrangementer.find(x=>x[0]==='q5')[2]='2020-01-01';
 t('V4.5: tilmelding til fortidigt arrangement afvises',post({action:'signup',event_id:'q5',navn:'Abc',email:'s3@ex.dk',tlf:'',antal:1}).ok===false);
 mk('q6');store.Arrangementer.find(x=>x[0]==='q6')[heads.Arrangementer.indexOf('status')]=' Fuldt ';
 t('V4.5: status med store bogstaver/mellemrum læses korrekt (fuldt)',post({action:'signup',event_id:'q6',navn:'Abc',email:'s4@ex.dk',tlf:'',antal:1}).error==='fuldt');
 mk('q7');store.Arrangementer.find(x=>x[0]==='q7')[heads.Arrangementer.indexOf('status')]='';
 t('V4.5: tom status behandles som aktiv',post({action:'signup',event_id:'q7',navn:'Abc',email:'s5@ex.dk',tlf:'',antal:1}).ok===true);
 let g=get('events');
 t('V4.5: testdata-rækker skjules offentligt som standard',!g.events.some(e=>e.testdata)&&!g.events.some(e=>e.id==='t1'));
 store.Indstillinger.push(['vis_testdata','ja']);g=get('events');
 t('V4.5: testdata vises kun hvis vis_testdata=ja',g.events.some(e=>e.id==='t1'));
 store.Indstillinger.pop();
 store.Indstillinger.push(['vis_testdata','ja']);t('V4.5: offentlig status normaliseret til små bogstaver',get('events').events.find(e=>e.id==='q6').status==='fuldt');store.Indstillinger.pop();
}
process.exit(f?1:0);
