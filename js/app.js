(function(){'use strict';
var C=window.DV_CONFIG,F=(window.DV_DATA||{}).forening||{},TODAY=(function(){var d=new Date();d.setHours(0,0,0,0);return d})();
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ic(n){return '<svg class="i" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
function pd(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function dm(s){var d=pd(s);return{d:d.getDate(),m:d.toLocaleDateString('da-DK',{month:'short'}).replace('.',''),long:d.toLocaleDateString('da-DK',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),mon:d.toLocaleDateString('da-DK',{month:'long',year:'numeric'}),key:s.slice(0,7)}}
var TYPES={cafe:'Café',sejlads:'Sejlads',udflugt:'Udflugt',moede:'Møde',arrangement:'Andet'};
var EV=[],TASKS=[];

/* ---------- Data ---------- */
function load(){
  if(C.DEMO&&window.DV_DEMO){EV=DV_DEMO.events.slice();TASKS=DV_DEMO.tasks.slice();return Promise.resolve()}
  if(!C.API_URL)return Promise.resolve();
  return fetch(C.API_URL+'?action=events').then(function(r){return r.json()}).then(function(j){if(j&&j.ok){EV=j.events||[];TASKS=j.tasks||[]}}).catch(function(){});
}
function status(e){if(e.status==='aflyst')return'aflyst';if(e.status==='fuldt')return'fuldt';if(e.pladser>0&&e.tilmeldte>=e.pladser)return'fuldt';return'aktiv'}
function free(e){return e.pladser>0?Math.max(0,e.pladser-e.tilmeldte):null}
function upcoming(a){return a.filter(function(e){return pd(e.dato)>=TODAY}).sort(function(x,y){return(x.dato+x.start)<(y.dato+y.start)?-1:1})}
function tickerItems(){return upcoming(EV).filter(function(e){return status(e)!=='aflyst'})}

/* ---------- Router ---------- */
var ROUTES={'':'forside','arrangementer':'arrangementer','veterancafeer':'veterancafeer','nyheder':'nyheder','foreningen':'foreningen','om':'om','bestyrelsen':'bestyrelsen','partnere':'partnere','stoet-os':'stoet','vedtaegter':'vedtaegter','forretningsorden':'forretningsorden','referater':'referater','kommunikation':'kommunikation','frivillig':'frivillig','hjaelp':'hjaelp','paaroerende':'paaroerende','veterankoordinator':'koordinator','kontakt':'kontakt','vejledning':'vejledning','afmeld':'afmeld','admin':'admin','juridisk':'juridisk'};
function route(){
  var h=location.hash.replace(/^#\/?/,'').split('?')[0],parts=h.split('/'),key=parts[0],page=ROUTES[key];
  if(key==='arrangement'){page='arrangement'}
  if(!page&&key!=='arrangement'){page='fejl'}
  $$('.page').forEach(function(p){p.classList.toggle('on',p.id==='p-'+page)});
  if(page==='arrangement')renderEvent(parts[1]);
  if(page==='arrangementer')renderList();
  if(page==='frivillig')renderTasks();
  if(page==='veterancafeer')renderCafes();
  if(page==='forside')renderHome();
  if(page==='bestyrelsen')renderBoard();
  $$('.nav a,.drawer nav a').forEach(function(a){var t=(a.getAttribute('href')||'').replace(/^#\/?/,'');a.toggleAttribute('aria-current',t===key||(key==='arrangement'&&t==='arrangementer'));if(a.hasAttribute('aria-current'))a.setAttribute('aria-current','page')});
  closeDrawer();if(page==='hjaelp'&&parts[1]&&$('#'+parts[1])){setTimeout(function(){$('#'+parts[1]).scrollIntoView({behavior:reduce()?'auto':'smooth',block:'start'})},30)}else window.scrollTo(0,0);
  var t=$('#p-'+page+' h1');document.title=(t&&page!=='forside'?t.textContent+' · ':'')+'Djurslands Veteraner';
}
window.addEventListener('hashchange',route);

/* ---------- Forside ---------- */
function eventMeta(e){return '<div class="meta"><span>'+ic('clock')+esc(e.start)+(e.slut?'–'+esc(e.slut):'')+'</span><span>'+ic('pin')+esc(e.sted)+'</span>'+(e.ansvarlig_navn?'<span>'+ic('user')+'Ansvarlig: '+esc(e.ansvarlig_navn)+'</span>':'')+'</div>'}
function badge(e){var s=status(e),o='';if(e.testdata)o+='<span class="badge test">Testdata</span> ';if(s==='fuldt')o+='<span class="badge full">Fuldt booket</span>';else if(s==='aflyst')o+='<span class="badge cancel">Aflyst</span>';else if(e.tilmelding&&free(e)!==null)o+='<span class="badge">'+free(e)+' ledige pladser</span>';else if(!e.tilmelding)o+='<span class="badge">Ingen tilmelding</span>';return o}
function renderHome(){
  var n=upcoming(EV).filter(function(e){return status(e)!=='aflyst'})[0],b=$('#nextBox');
  if(!n){b.innerHTML='<div class="empty">Der er ingen kommende arrangementer lige nu. Se veterancaféerne eller kontakt os, hvis du har spørgsmål.</div>';return}
  var d=dm(n.dato);
  b.innerHTML='<div class="next"><div class="date"><b>'+d.d+'</b><span>'+esc(d.m)+'</span></div><div><div>'+badge(n)+'</div><h3 style="margin:8px 0 0">'+esc(n.titel)+'</h3>'+eventMeta(n)+'</div><a class="btn" href="#/arrangement/'+encodeURIComponent(n.id)+'">'+(n.tilmelding&&status(n)==='aktiv'?'Tilmeld':'Læs mere')+ic('arrow')+'</a></div>';
}
/* Bjælke */
var tIdx=0,tTimer=null;
function renderBar(){
  var items=tickerItems(),a=$('#barItem'),prev=$('#barPrev'),next=$('#barNext');
  if(!items.length){var bb=$('.bar');bb.hidden=true;document.body.style.paddingBottom='0';return}
  prev.hidden=next.hidden=items.length<2;
  function show(i){tIdx=(i+items.length)%items.length;var e=items[tIdx],d=dm(e.dato);a.innerHTML='<time>'+d.d+'. '+esc(d.m)+'</time>'+esc(e.titel);a.href='#/arrangement/'+encodeURIComponent(e.id);a.classList.remove('fade');void a.offsetWidth;if(!reduce())a.classList.add('fade')}
  show(0);prev.onclick=function(){show(tIdx-1);reset()};next.onclick=function(){show(tIdx+1);reset()};
  function reset(){clearInterval(tTimer);if(!reduce()&&items.length>1)tTimer=setInterval(function(){show(tIdx+1)},6000)}
  reset();
}
function reduce(){return window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches}

/* ---------- Arrangementer ---------- */
var filt='alle',showPast=false;
function evCard(e){var d=dm(e.dato),s=status(e),past=pd(e.dato)<TODAY;
  return '<article class="ev'+(past?' past':'')+'"><div class="date"><b>'+d.d+'</b><span>'+esc(d.m)+'</span></div><div><div>'+badge(e)+' <span class="badge">'+esc(TYPES[e.type]||'Andet')+'</span></div><h3 style="margin:8px 0 0">'+esc(e.titel)+'</h3>'+eventMeta(e)+'</div><div class="act"><a class="btn'+(e.tilmelding&&s==='aktiv'&&!past?'':' alt')+'" href="#/arrangement/'+encodeURIComponent(e.id)+'">'+(e.tilmelding&&s==='aktiv'&&!past?'Tilmeld':'Læs mere')+'</a></div></article>'}
function renderList(){
  var types=['alle'].concat(Object.keys(TYPES).filter(function(t){return EV.some(function(e){return e.type===t})}));
  $('#evChips').innerHTML=types.map(function(t){return '<button type="button" data-t="'+t+'" aria-pressed="'+(t===filt)+'">'+(t==='alle'?'Alle':TYPES[t])+'</button>'}).join('');
  $$('#evChips button').forEach(function(b){b.onclick=function(){filt=b.dataset.t;renderList()}});
  var list=(showPast?EV.slice().sort(function(a,b){return a.dato<b.dato?1:-1}):upcoming(EV)).filter(function(e){return filt==='alle'||e.type===filt});
  var out='',last='';
  list.forEach(function(e){var m=dm(e.dato);if(m.key!==last){last=m.key;out+='<h2 class="mh">'+esc(m.mon)+'</h2>'}out+=evCard(e)});
  $('#evList').innerHTML=out||'<div class="empty">Der er ingen kommende arrangementer lige nu. Kig forbi igen senere, eller kontakt foreningen på '+esc(F.telefon||'')+'.</div>';
  var h=$('#evHist');h.textContent=showPast?'Vis kun kommende':'Vis tidligere arrangementer';h.onclick=function(){showPast=!showPast;renderList()};
}
function renderEvent(id){
  var e=EV.filter(function(x){return String(x.id)===decodeURIComponent(id||'')})[0],box=$('#evDetail');
  if(!e){box.innerHTML='<div class="empty">Arrangementet findes ikke eller er udløbet. <a href="#/arrangementer">Se alle arrangementer</a>.</div>';return}
  var s=status(e),past=pd(e.dato)<TODAY,d=dm(e.dato),f=free(e),open=e.tilmelding&&s==='aktiv'&&!past;
  var h='<div class="two"><div><p>'+badge(e)+'</p><h2>'+esc(e.titel)+'</h2><div class="meta" style="margin-bottom:16px"><span>'+ic('calendar')+esc(d.long)+'</span></div>'+eventMeta(e)+'<p style="margin-top:18px">'+esc(e.beskrivelse)+'</p>'+(e.tilmelding&&f!==null?'<p class="hint">'+esc(e.tilmeldte)+' af '+esc(e.pladser)+' pladser er optaget.</p>':'')+'</div><div>';
  if(s==='aflyst')h+='<div class="note ghostbox"><b>Arrangementet er aflyst.</b></div>';
  else if(past)h+='<div class="note ghostbox"><b>Arrangementet er afholdt.</b></div>';
  else if(!e.tilmelding)h+='<div class="note ghostbox"><b>Ingen tilmelding nødvendig.</b><br>Kom forbi – alle er velkomne.</div>';
  else if(s==='fuldt')h+='<div class="note ghostbox"><b>Arrangementet er fuldt booket.</b><br>Kontakt den ansvarlige for at høre om afbud.</div>';
  else h+=form(e);
  box.innerHTML=h+'</div></div>';
  if(open)wireForm(e);
}
function field(id,l,t,extra){return '<div class="f" id="f-'+id+'"><label for="'+id+'">'+l+'</label>'+extra+'<div class="err" id="e-'+id+'"></div></div>'}
function form(e){var f=free(e),max=Math.min(10,f===null?10:f),o='';for(var i=1;i<=max;i++)o+='<option>'+i+'</option>';
  return '<form id="signup" class="card" novalidate><h3>Tilmeld dig</h3>'+field('navn','Navn','', '<input id="navn" autocomplete="name" maxlength="100">')+field('email','E-mail','', '<input id="email" type="email" inputmode="email" autocomplete="email" maxlength="160">')+field('antal','Antal deltagere','', '<select id="antal">'+o+'</select>')+(e.kraever_telefon?field('tlf','Telefonnummer','', '<input id="tlf" type="tel" inputmode="tel" autocomplete="tel" maxlength="20">'):'')+(e.kraever_bemaerkning?field('bem','Bemærkning (valgfri)','', '<textarea id="bem" rows="3" maxlength="500"></textarea>'):'')+'<div style="position:absolute;left:-9999px" aria-hidden="true"><input id="website" tabindex="-1" autocomplete="off"></div><button class="btn" type="submit" style="width:100%">Send tilmelding</button><div id="sres" aria-live="polite"></div></form>'}
function wireForm(e){
  var f=$('#signup');if(!f)return;
  f.addEventListener('submit',function(ev){ev.preventDefault();
    var v={navn:$('#navn').value.trim(),email:$('#email').value.trim(),tlf:$('#tlf')?$('#tlf').value.trim():'',antal:+$('#antal').value},er={};
    if(v.navn.length<2)er.navn='Skriv dit navn.';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email))er.email='Skriv en gyldig e-mailadresse.';
    if($('#tlf')&&!/^[+0-9 ()-]{8,20}$/.test(v.tlf))er.tlf='Skriv et gyldigt telefonnummer.';
    ['navn','email','tlf'].forEach(function(k){var el=$('#f-'+k);if(!el)return;el.classList.toggle('bad',!!er[k]);$('#e-'+k).textContent=er[k]||''});
    if(Object.keys(er).length){var first=$('#f-'+Object.keys(er)[0]+' input');first&&first.focus();return}
    var res=$('#sres');
    if(C.DEMO||!C.API_URL){
      res.innerHTML='<div class="note demo-n"><b>Demoversion – tilmeldingen er hverken sendt eller gemt.</b><br>Tilmeldingen kobles først på, når design og tekniske tests er godkendt. Der er ikke sendt nogen e-mail.</div><details class="note ghostbox"><summary><b>Se et eksempel på, hvordan bekræftelsen bliver</b></summary><div class="watermark" style="padding:14px 0"><p><b>Tak, '+esc(v.navn)+'.</b><br>Din tilmelding til '+esc(e.titel)+' er registreret. Vi har sendt en bekræftelse til '+esc(v.email)+'. I mailen finder du et link, hvis du skal melde dig fra.</p></div></details>';
      res.scrollIntoView({block:'nearest'});return}
    res.innerHTML='<div class="note ghostbox">Tilmelding er endnu ikke åbnet.</div>';
  });
}

/* ---------- Veterancaféer ---------- */
function photo(el,src,cb){var im=new Image();im.onload=function(){el.style.backgroundImage='url("'+src+'")';el.classList.add('has');cb&&cb()};im.src=src}
function renderCafes(){
  var cs=(window.DV_DATA||{}).cafeer||[],box=$('#cafeList');
  box.innerHTML=cs.map(function(c){var tel=(c.kontakt||F.telefon||'').replace(/\s/g,''),q=encodeURIComponent(c.adresse);
    return '<article class="cafe"><div class="cph" data-src="'+esc(c.foto)+'" role="img" aria-label="'+esc(c.navn)+'"><span>'+esc(c.navn.replace('Veterancafé ',''))+'</span></div><div class="cb"><h3>'+esc(c.navn)+'</h3><dl><dt>Tid</dt><dd>'+esc(c.tid)+'</dd><dt>Adresse</dt><dd>'+esc(c.adresse)+'</dd><dt>Kontakt</dt><dd><a href="tel:'+tel+'">'+esc(c.kontakt)+'</a></dd></dl><p>'+esc(c.desc)+'</p><a class="btn" href="https://www.google.com/maps/search/?api=1&query='+q+'" target="_blank" rel="noopener">'+ic('pin')+'Find vej</a></div></article>'}).join('');
  $$('.cph',box).forEach(function(el){photo(el,el.dataset.src)});
}
function renderBoard(){var b=(window.DV_DATA||{}).bestyrelse||[];$('#boardList').innerHTML=b.map(function(m){return '<div class="person"><div class="av" data-src="'+esc(m.foto||'')+'">'+ic('user')+'</div><h3 style="margin:0">'+esc(m.navn||m.rolle)+'</h3><p class="hint" style="margin:4px 0 0">'+(m.navn?esc(m.rolle)+' · ':'')+esc(m.region||(m.navn?'':'Navn offentliggøres efter generalforsamlingen'))+'</p></div>'}).join('');$$('#boardList .av').forEach(function(el){if(el.dataset.src)photo(el,el.dataset.src,function(){el.innerHTML=''})})}
/* ---------- Frivillig ---------- */
function renderTasks(){
  var t=TASKS.filter(function(x){return pd(x.dato)>=TODAY}).sort(function(a,b){return a.dato<b.dato?-1:1}),box=$('#taskList');
  box.innerHTML=t.length?t.map(function(x){var d=dm(x.dato),left=Math.max(0,x.onsket-x.tilmeldte),late=x.frist&&pd(x.frist)<TODAY,full=left===0;
    return '<article class="card"><p>'+(x.testdata?'<span class="badge test">Testdata</span> ':'')+'<span class="badge'+(full?' full':'')+'">'+(full?'Dækket':left+' frivillige mangler')+'</span></p><h3>'+esc(x.titel)+'</h3><div class="meta"><span>'+ic('calendar')+esc(d.long)+'</span><span>'+ic('clock')+'kl. '+esc(x.start)+'</span><span>'+ic('pin')+esc(x.sted)+'</span></div><p>'+esc(x.beskrivelse)+'</p><p class="hint">Tilmeldingsfrist: '+esc(dm(x.frist).long)+' · Ansvarlig: '+esc(x.ansvarlig_navn)+'</p><button class="btn'+(full||late?' alt':'')+'" data-task="'+esc(x.id)+'" '+(full||late?'disabled':'')+'>'+(full||late?'Ikke åben':'Meld dig')+'</button><div class="tres"></div></article>'}).join(''):'<div class="empty">Der er ingen konkrete opgaver lige nu. Kontakt os, hvis du gerne vil hjælpe.</div>';
  $$('#taskList [data-task]').forEach(function(b){b.onclick=function(){var r=b.parentNode.querySelector('.tres');r.innerHTML='<form class="vol" novalidate style="margin-top:14px"><div class="f"><label>Navn</label><input name="n" autocomplete="name"></div><div class="f"><label>E-mail</label><input name="e" type="email" autocomplete="email"></div><button class="btn" type="submit" style="width:100%">Send tilmelding</button><div class="vr"></div></form>';
    r.querySelector('form').onsubmit=function(ev){ev.preventDefault();var f=ev.target,ok=f.n.value.trim().length>1&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.e.value.trim());f.querySelector('.vr').innerHTML=ok?'<div class="note demo-n"><b>Demoversion – tilmeldingen er hverken sendt eller gemt.</b></div>':'<div class="note" style="color:#8a2f2a;border-color:#8a2f2a">Skriv navn og en gyldig e-mailadresse.</div>'};b.hidden=true}});
}

/* ---------- Menu ---------- */
function closeDrawer(){$('#drawer').classList.remove('open');$('#burger').setAttribute('aria-expanded','false');document.body.style.overflow=''}
function wireMenu(){
  $('#burger').onclick=function(){$('#drawer').classList.add('open');this.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';$('#drawer .x').focus()};
  $('#drawer .bg').onclick=closeDrawer;$('#drawer .x').onclick=closeDrawer;
  var dd=$('.dd'),btn=$('.dd>button');btn.onclick=function(e){e.stopPropagation();var o=dd.classList.toggle('open');btn.setAttribute('aria-expanded',o)};
  document.addEventListener('click',function(){dd.classList.remove('open');btn.setAttribute('aria-expanded','false')});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeDrawer();dd.classList.remove('open');closePop()}});
}
/* ---------- Hero ---------- */
function wireHero(){
  var box=$('#slides'),dots=$('#dots'),pp=$('#pp'),on=0,t=null,paused=reduce(),slides=[];
  function brand(){var s=document.createElement('div');s.className='slide brand on';s.innerHTML='<div class="ph"></div>';s.setAttribute('role','img');s.setAttribute('aria-label','Djurslands Veteraner');box.appendChild(s)}
  brand();$('.hctl').hidden=true;
  var found=new Array(C.HERO.length),left=C.HERO.length;
  C.HERO.forEach(function(h,i){var im=new Image();im.onload=function(){found[i]=h;done()};im.onerror=function(){done()};im.src=h.src});
  function done(){if(--left)return;slides=found.filter(Boolean);if(!slides.length)return;
    box.innerHTML='';dots.innerHTML='';
    slides.forEach(function(h,i){var s=document.createElement('div');s.className='slide';s.dataset.d=i%3;
      var p=(h.pos||'50% 50%').split(' ');s.innerHTML='<div class="ph" style="--ox:'+p[0]+';--oy:'+p[1]+';background-image:url(\''+h.src+'\');background-position:'+(h.pos||'center')+'"></div>';
      s.setAttribute('role','img');s.setAttribute('aria-label',h.alt);box.appendChild(s);
      var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Vis billede '+(i+1)+' af '+slides.length);b.onclick=function(){go(i);restart()};dots.appendChild(b)});
    $('.hctl').hidden=slides.length<2;go(0);restart()}
  function go(i){on=(i+slides.length)%slides.length;$$('.slide',box).forEach(function(s,k){s.classList.toggle('on',k===on)});$$('button',dots).forEach(function(b,k){b.setAttribute('aria-current',k===on)})}
  function restart(){clearInterval(t);if(!paused&&slides.length>1)t=setInterval(function(){go(on+1)},C.SLIDE_SEC*1000)}
  pp.onclick=function(){paused=!paused;lab();restart()};
  function lab(){pp.innerHTML=ic(paused?'play':'pause');pp.setAttribute('aria-label',paused?'Start billedserie':'Stop billedserie')}lab();
  document.addEventListener('visibilitychange',function(){document.hidden?clearInterval(t):restart()});
}
function closePop(){var p=$('#pop');if(p.classList.contains('open')){p.classList.remove('open');try{sessionStorage.setItem('dv_pop','1')}catch(e){}}}
function wirePop(){
  var P=C.POPUP,p=$('#pop');if(!P||!P.aktiv)return;
  var t=TODAY,ok=(!P.start||pd(P.start)<=t)&&(!P.slut||pd(P.slut)>=t),seen=false;try{seen=sessionStorage.getItem('dv_pop')==='1'}catch(e){}
  if(!ok||seen)return;
  $('#popH').textContent=P.overskrift;$('#popT').textContent=P.tekst;var a=$('#popA');a.textContent=P.knap;a.href=P.link;a.onclick=closePop;
  var pi=$('#popImg');photo(pi,P.billede,function(){pi.hidden=false});
  $('#popX').onclick=closePop;p.onclick=function(e){if(e.target===p)closePop()};
  setTimeout(function(){p.classList.add('open');$('#popX').focus()},1200);
}
/* ---------- Admin-demo ---------- */
function wireAdmin(){
  $$('#atabs button').forEach(function(b){b.onclick=function(){$$('#atabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});$$('.apane').forEach(function(p){p.classList.toggle('on',p.id===b.dataset.p)})}});
  var ub=$('#unBtn');ub&&(ub.onclick=function(){$('#unRes').innerHTML='<div class="note demo-n" style="margin-top:16px"><b>Eksempelside – ingen tilmelding er ændret, og der er ikke sendt nogen mail.</b> I den rigtige løsning bekræftes afmeldingen her og i en mail, pladsen frigives, og den ansvarlige får besked.</div>'});
  var f=$('#aLogin');f&&(f.onsubmit=function(e){e.preventDefault();$('#aRes').innerHTML='<div class="note demo-n"><b>Demoversion – der er ikke sendt nogen kode.</b> I den rigtige løsning sendes en engangskode via Brevo, og den virker kun én gang i 10 minutter.</div>'});
}
/* ---------- Start ---------- */
function init(){
  if(C.DEMO)$('#demoBand').hidden=false;
  if(!C.DEMO&&!C.API_URL)$$('a.adm').forEach(function(x){x.hidden=true});
  $('#fTel').textContent=F.telefon||'';$('#fTel').href='tel:'+(F.telefon||'').replace(/\s/g,'');
  var lg=$('#logoImg'),im=new Image();im.onload=function(){lg.src=C.LOGO;lg.hidden=false;$('#logoMark').hidden=true};im.src=C.LOGO;
  wireMenu();wireHero();wireAdmin();
  $$('[data-pdf]').forEach(function(p){fetch(p.dataset.pdf,{method:'HEAD'}).then(function(r){if(r.ok)p.hidden=false}).catch(function(){})});
  load().then(function(){renderBar();route();wirePop()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
