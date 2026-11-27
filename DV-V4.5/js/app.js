(function(){'use strict';
var C=window.DV_CONFIG,F=(window.DV_DATA||{}).forening||{},TODAY=(function(){var d=new Date();d.setHours(0,0,0,0);return d})();
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ic(n){return '<svg class="i" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
function pd(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function dm(s){var d=pd(s);return{d:d.getDate(),m:d.toLocaleDateString('da-DK',{month:'short'}).replace('.',''),long:d.toLocaleDateString('da-DK',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),mon:d.toLocaleDateString('da-DK',{month:'long',year:'numeric'}),key:s.slice(0,7)}}
var TYPES={cafe:'Café',frivillig:'Frivillig',sejlads:'Sejlads',udflugt:'Udflugt',moede:'Møde',arrangement:'Andet'};
var EV=[],TASKS=[],LOADERR=false;

/* ---------- Data: ÉN kilde (Arrangementer). Kalender, forside, bjælke, pop-up og frivilligopgaver afledes herfra. ---------- */
function derive(){TASKS=EV.filter(function(e){return e.type==='frivillig'})}
function dec(v){try{return decodeURIComponent(v)}catch(x){return ''}}
function load(){
  if(C.DEMO&&window.DV_DEMO){EV=DV_DEMO.events.slice();derive();return Promise.resolve()}
  if(!C.API_URL)return Promise.resolve();
  return fetch(C.API_URL+'?action=events').then(function(r){return r.json()}).then(function(j){if(j&&j.ok){EV=(j.events||[]).filter(function(e){return !e.testdata});derive()}else{LOADERR=true}}).catch(function(){LOADERR=true});
}
function status(e){var st=String(e.status||'').trim().toLowerCase();if(st==='aflyst')return'aflyst';if(st==='fuldt')return'fuldt';if(e.pladser>0&&e.tilmeldte>=e.pladser)return'fuldt';return'aktiv'}
function free(e){return e.pladser>0?Math.max(0,e.pladser-e.tilmeldte):null}
function upcoming(a){return a.filter(function(e){return pd(e.dato)>=TODAY}).sort(function(x,y){return(x.dato+x.start)<(y.dato+y.start)?-1:1})}
function pub(){return EV.filter(function(e){return String(e.type||'').toLowerCase()!=='frivillig'})}
function tickerItems(){return upcoming(pub()).filter(function(e){return status(e)!=='aflyst'})}

/* ---------- Router ---------- */
var ROUTES={'':'forside','arrangementer':'arrangementer','veterancafeer':'veterancafeer','nyheder':'nyheder','foreningen':'foreningen','om':'om','bestyrelsen':'bestyrelsen','partnere':'partnere','stoet-os':'stoet','vedtaegter':'vedtaegter','forretningsorden':'forretningsorden','referater':'referater','kommunikation':'kommunikation','frivillig':'frivillig','hjaelp':'hjaelp','paaroerende':'paaroerende','veterankoordinator':'koordinator','kontakt':'kontakt','vejledning':'vejledning','afmeld':'afmeld','admin':'admin','juridisk':'juridisk'};
function route(){
  var qs=location.hash.split('?')[1]||'',h=location.hash.replace(/^#\/?/,'').split('?')[0],parts=h.split('/'),key=parts[0],page=ROUTES[key];
  if(key==='arrangement'){page='arrangement'}
  if(!page&&key!=='arrangement'){page='fejl'}
  if(page==='admin'&&!C.DEMO){page='fejl'}
  $$('.page').forEach(function(p){p.classList.toggle('on',p.id==='p-'+page)});
  if(page==='arrangement')renderEvent(parts[1]);
  if(page==='arrangementer')renderList();
  if(page==='afmeld')renderAfmeld(qs);
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
function eventMeta(e){return '<div class="meta"><span>'+esc(e.start)+(e.slut?'–'+esc(e.slut):'')+'</span><span>'+esc(e.sted)+'</span>'+(e.ansvarlig_navn?'<span>'+'Ansvarlig: '+esc(e.ansvarlig_navn)+'</span>':'')+'</div>'}
function badge(e){var s=status(e),o='';if(e.testdata)o+='<span class="badge test">Testdata</span> ';if(s==='fuldt')o+='<span class="badge full">Fuldt booket</span>';else if(s==='aflyst')o+='<span class="badge cancel">Aflyst</span>';else if(e.tilmelding&&free(e)!==null)o+='<span class="badge">'+free(e)+' ledige pladser</span>';else if(!e.tilmelding)o+='<span class="badge">Ingen tilmelding</span>';return o}
function renderHome(){
  var items=upcoming(pub()).filter(function(e){return status(e)!=='aflyst'}).slice(0,4),b=$('#nextBox');
  if(!items.length){b.innerHTML='<div class="empty">Der er ingen kommende arrangementer lige nu. Se veterancaféerne eller kontakt os, hvis du har spørgsmål.</div>';return}
  b.innerHTML='<div class="nx">'+items.map(nxCard).join('')+'</div>';
  $$('.nph',b).forEach(function(el){photo(el,el.dataset.src)});
}
function nxCard(e){var d=dm(e.dato),s=status(e),f=free(e),open=e.tilmelding&&s==='aktiv',u='#/arrangement/'+encodeURIComponent(e.id);
  return '<article class="nxc">'+(e.billede?'<div class="nph" data-src="'+esc(e.billede)+'" role="img" aria-label="'+esc(e.titel)+'"></div>':'')+'<div class="nb"><div class="date"><b>'+d.d+'</b><span>'+esc(d.m)+'</span></div><div class="nt"><p class="nm">'+(e.testdata?'<span class="badge test">Testdata</span> ':'')+esc(d.long)+' · kl. '+esc(e.start)+(e.slut?'–'+esc(e.slut):'')+'</p><h3>'+esc(e.titel)+'</h3><p class="ns">'+esc(e.sted)+'</p><p class="nf">'+(!e.tilmelding?'Ingen tilmelding – mød blot op':s==='fuldt'?'Fuldt booket':f!==null?f+' ledige pladser':'Tilmelding nødvendig')+'</p></div></div><div class="na">'+(open?'<a class="btn" href="'+u+'">Tilmeld</a>':'')+'<a class="btn alt" href="'+u+'">Læs mere</a></div></article>'}
/* Bjælke */
var tIdx=0,tTimer=null;
function renderBar(){
  var items=tickerItems(),a=$('#barItem'),prev=$('#barPrev'),next=$('#barNext');
  if(!items.length){a.textContent=LOADERR?'Kalenderen kan ikke hentes lige nu. Prøv igen senere.':'Ingen kommende arrangementer lige nu.';a.removeAttribute('href');prev.hidden=next.hidden=true;return}
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
var view=null,cur=null;
function mobile(){return window.matchMedia&&matchMedia('(max-width:700px)').matches}
var MON=['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
function renderList(){
  if(!view)view=mobile()?'liste':'maaned';
  if(!cur){cur=new Date(TODAY.getFullYear(),TODAY.getMonth(),1);var nx=upcoming(EV)[0];if(nx&&!EV.some(function(e){var d=pd(e.dato);return d.getFullYear()===cur.getFullYear()&&d.getMonth()===cur.getMonth()&&d>=TODAY})){var nd=pd(nx.dato);cur=new Date(nd.getFullYear(),nd.getMonth(),1)}}
  var types=['alle'].concat(Object.keys(TYPES).filter(function(t){return EV.some(function(e){return e.type===t})}));
  $('#evChips').innerHTML=types.map(function(t){return '<button type="button" data-t="'+t+'" aria-pressed="'+(t===filt)+'">'+(t==='alle'?'Alle':TYPES[t])+'</button>'}).join('');
  $$('#evChips button').forEach(function(b){b.onclick=function(){filt=b.dataset.t;renderList()}});
  $$('#evView button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===view);b.onclick=function(){view=b.dataset.v;renderList()}});
  var src=EV.filter(function(e){return filt==='alle'||e.type===filt});
  $('#evList').hidden=view!=='liste';$('#evMonth').hidden=view!=='maaned';$('#evHist').parentNode.hidden=view!=='liste';
  if(view==='liste'){
    var list=(showPast?src.slice().sort(function(a,b){return a.dato<b.dato?1:-1}):upcoming(src)),out='',last='';
    list.forEach(function(e){var m=dm(e.dato);if(m.key!==last){last=m.key;out+='<h2 class="mh">'+esc(m.mon)+'</h2>'}out+=evCard(e)});
    $('#evList').innerHTML=out||'<div class="empty">Der er ingen kommende arrangementer lige nu. Kig forbi igen senere, eller kontakt foreningen på '+esc(F.telefon||'')+'.</div>';
    var h=$('#evHist');h.textContent=showPast?'Vis kun kommende':'Vis tidligere arrangementer';h.onclick=function(){showPast=!showPast;renderList()};
  }else renderMonth(src);
}
function renderMonth(src){
  var y=cur.getFullYear(),m=cur.getMonth(),first=new Date(y,m,1),off=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),cells='';
  ['Man','Tir','Ons','Tor','Fre','Lør','Søn'].forEach(function(d){cells+='<div class="wd" aria-hidden="true">'+d+'</div>'});
  for(var i=0;i<off;i++)cells+='<div class="dc out"></div>';
  for(var d=1;d<=days;d++){
    var iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),evs=src.filter(function(e){return e.dato===iso}).sort(function(a,b){return a.start<b.start?-1:1}),isT=pd(iso).getTime()===TODAY.getTime();
    cells+='<div class="dc'+(isT?' today':'')+(evs.length?' has':'')+'"><span class="dn">'+d+'</span>'+evs.map(function(e){var s=status(e);return '<a class="ce t-'+esc(e.type||'arrangement')+(s==='aflyst'?' x':'')+(s==='fuldt'?' f':'')+'" href="#/arrangement/'+encodeURIComponent(e.id)+'" title="'+esc(e.titel)+'"><b>'+esc(e.start)+'</b> '+esc(e.titel)+(s==='aflyst'?' (aflyst)':s==='fuldt'?' (fuldt)':'')+'</a>'}).join('')+'</div>';
  }
  $('#evMonth').innerHTML='<div class="mnav"><button type="button" id="mPrev" aria-label="Forrige måned">'+ic('arrow')+'</button><h2 aria-live="polite">'+MON[m]+' '+y+'</h2><button type="button" id="mNext" aria-label="Næste måned">'+ic('arrow')+'</button><button type="button" class="btn alt" id="mToday">I dag</button></div><div class="mgrid" role="grid" aria-label="Månedskalender">'+cells+'</div><p class="hint">Tryk på et arrangement for detaljer og tilmelding.</p>';
  $('#mPrev').onclick=function(){cur=new Date(y,m-1,1);renderList()};$('#mNext').onclick=function(){cur=new Date(y,m+1,1);renderList()};$('#mToday').onclick=function(){cur=new Date(TODAY.getFullYear(),TODAY.getMonth(),1);renderList()};
}
function renderEvent(id){
  var e=EV.filter(function(x){return String(x.id)===dec(id||'')})[0],box=$('#evDetail');
  if(!e){box.innerHTML='<div class="empty">Arrangementet findes ikke eller er udløbet. <a href="#/arrangementer">Se alle arrangementer</a>.</div>';return}
  var s=status(e),past=pd(e.dato)<TODAY,d=dm(e.dato),f=free(e),open=e.tilmelding&&s==='aktiv'&&!past;
  var h='<div class="two"><div><p>'+badge(e)+'</p><h2>'+esc(e.titel)+'</h2><div class="meta" style="margin-bottom:16px"><span>'+esc(d.long)+'</span></div>'+eventMeta(e)+'<p style="margin-top:18px">'+esc(e.beskrivelse)+'</p>'+(e.tilmelding&&f!==null?'<p class="hint">'+esc(e.tilmeldte)+' af '+esc(e.pladser)+' pladser er optaget.</p>':'')+'</div><div>';
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
    var btn=f.querySelector('button[type=submit]');btn.disabled=true;res.innerHTML='<div class="note ghostbox">Sender tilmelding …</div>';
    post({action:'signup',event_id:e.id,navn:v.navn,email:v.email,tlf:v.tlf,antal:v.antal,bemaerkning:$('#bem')?$('#bem').value.trim():'',website:$('#website').value}).then(function(j){
      if(j&&j.ok){f.innerHTML='<h3>Tak, '+esc(v.navn)+'.</h3><p>Din tilmelding er registreret.</p><p>'+(j.mail==='FEJL'?'Vi kunne desværre ikke sende bekræftelsesmailen, men din plads er gemt. Kontakt den ansvarlige, hvis du er i tvivl.':'Vi har sendt en bekræftelse til '+esc(v.email)+'. Mailen indeholder et personligt link, hvis du senere skal afmelde dig.')+'</p>';return}
      btn.disabled=false;var er=j&&j.error;res.innerHTML='<div class="note" style="color:#8a2f2a;border-color:#8a2f2a">'+(er==='fuldt'?'Der er ikke nok ledige pladser til så mange deltagere.':er==='for_mange'?'For mange forsøg. Prøv igen om lidt.':er==='validering'?'Tjek de udfyldte felter.':'Tilmeldingen kunne ikke gennemføres. Prøv igen, eller ring til foreningen på '+esc(F.telefon||'')+'.')+'</div>'
    }).catch(function(){btn.disabled=false;res.innerHTML='<div class="note" style="color:#8a2f2a;border-color:#8a2f2a">Tilmeldingen kunne ikke gennemføres. Prøv igen, eller ring til foreningen på '+esc(F.telefon||'')+'.</div>'});
  });
}

function post(o){return fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o)}).then(function(r){return r.json()})}
function renderAfmeld(qs){
  var q={},box=$('#unBox');qs.split('&').forEach(function(p){var k=p.split('=');if(k[0])q[k[0]]=dec(k[1]||'')});
  if(!C.DEMO&&!C.API_URL){box.innerHTML='<div class="note">Afmelding via linket er endnu ikke åbnet. Ring til foreningen på '+esc(F.telefon||'')+', så hjælper vi dig.</div>';return}
  if(C.DEMO||!C.API_URL){box.innerHTML='<div class="card"><span class="badge test">Eksempelside</span><h3 style="margin-top:12px">Vil du afmelde dig fra dette arrangement?</h3><p>Linket giver kun adgang til din egen tilmelding. Intet sker, før du trykker på knappen.</p><div class="row"><button class="btn" id="unBtn" type="button">Ja, afmeld mig</button><a class="btn alt" href="#/">Nej, behold min tilmelding</a></div><div id="unRes" aria-live="polite"></div></div>';wireUnDemo();return}
  if(!q.id||!q.t){box.innerHTML='<div class="note">Linket er ugyldigt. Brug linket i din bekræftelsesmail, eller ring til foreningen på '+esc(F.telefon||'')+'.</div>';return}
  box.innerHTML='<div class="card"><h3>Vil du afmelde dig fra arrangementet?</h3><p>Intet sker, før du trykker på knappen.</p><div class="row"><button class="btn" id="unGo" type="button">Ja, afmeld mig</button><a class="btn alt" href="#/">Nej, behold min tilmelding</a></div><div id="unRes" aria-live="polite"></div></div>';
  $('#unGo').onclick=function(){var b=this;b.disabled=true;
    post({action:'unsubscribe',id:q.id,token:q.t}).then(function(j){var r=$('#unRes');
      if(j&&j.ok){box.innerHTML='<div class="card"><h3>'+(j.allerede?'Du er allerede afmeldt.':'Din tilmelding er afmeldt.')+'</h3><p>'+(j.allerede?'':'Pladsen er frigivet, og den ansvarlige har fået besked. ')+'<a href="#/arrangementer">Se kalenderen</a></p></div>';return}
      b.disabled=false;r.innerHTML='<div class="note" style="color:#8a2f2a;border-color:#8a2f2a;margin-top:14px">'+(j&&j.error==='ugyldigt_link'?'Linket er ugyldigt. Kontakt foreningen på '+esc(F.telefon||'')+'.':'Afmeldingen kunne ikke gennemføres. Prøv igen, eller ring til foreningen på '+esc(F.telefon||'')+'.')+'</div>'
    }).catch(function(){b.disabled=false;$('#unRes').innerHTML='<div class="note" style="color:#8a2f2a;border-color:#8a2f2a;margin-top:14px">Afmeldingen kunne ikke gennemføres. Prøv igen, eller ring til foreningen på '+esc(F.telefon||'')+'.</div>'})}
}
function wireUnDemo(){var ub=$('#unBtn');ub&&(ub.onclick=function(){$('#unRes').innerHTML='<div class="note demo-n" style="margin-top:16px"><b>Eksempelside – ingen tilmelding er ændret, og der er ikke sendt nogen mail.</b></div>'})}

/* ---------- Veterancaféer ---------- */
function photo(el,src,cb){var im=new Image();im.onload=function(){el.style.backgroundImage='url("'+src+'")';el.classList.add('has');cb&&cb()};im.src=src}
function renderCafes(){
  var cs=(window.DV_DATA||{}).cafeer||[],box=$('#cafeList');
  box.innerHTML=cs.map(function(c){var tel=(c.kontakt||F.telefon||'').replace(/\s/g,''),q=encodeURIComponent(c.adresse),ukl=!!c.afklares;
    return '<article class="cafe"><div class="cph" data-src="'+esc(c.foto)+'" role="img" aria-label="'+esc(c.navn)+'"><span>'+esc(c.navn.replace('Veterancafé ',''))+'</span></div><div class="cb"><h3>'+esc(c.navn)+'</h3><dl><dt>Tid</dt><dd>'+esc(ukl?'Bekræftes – ring '+(F.telefon||''):c.tid)+'</dd><dt>Adresse</dt><dd>'+esc(ukl?c.by:c.adresse)+'</dd><dt>Kontakt</dt><dd><a href="tel:'+tel+'">'+esc(c.kontakt)+'</a></dd></dl><p>'+esc(c.desc)+'</p>'+(ukl?'':'<a class="btn" href="https://www.google.com/maps/search/?api=1&query='+q+'" target="_blank" rel="noopener">Find vej</a>')+'</div></article>'}).join('');
  $$('.cph',box).forEach(function(el){photo(el,el.dataset.src)});
}
function renderBoard(){var b=(window.DV_DATA||{}).bestyrelse||[];$('#boardList').innerHTML=b.map(function(m){return '<div class="person">'+(m.foto?'<div class="av" data-src="'+esc(m.foto)+'"></div>':'')+'<h3 style="margin:0">'+esc(m.navn||m.rolle)+'</h3><p class="hint" style="margin:4px 0 0">'+(m.navn?esc(m.rolle)+' · ':'')+esc(m.region||(m.navn?'':'Navn offentliggøres efter generalforsamlingen'))+'</p></div>'}).join('');$$('#boardList .av').forEach(function(el){if(el.dataset.src)photo(el,el.dataset.src,function(){el.innerHTML=''})})}
/* ---------- Frivillig ---------- */
function renderTasks(){
  var t=upcoming(TASKS),box=$('#taskList');
  box.innerHTML=t.length?t.map(function(x){var d=dm(x.dato),s=status(x),left=free(x),full=s==='fuldt'||left===0,gone=s==='aflyst';
    return '<article class="card"><p>'+(x.testdata?'<span class="badge test">Testdata</span> ':'')+'<span class="badge'+(full||gone?' full':'')+'">'+(gone?'Aflyst':full?'Dækket':left===null?'Frivillige søges':left+' frivillige mangler')+'</span></p><h3>'+esc(x.titel)+'</h3><div class="meta"><span>'+esc(d.long)+'</span><span>'+'kl. '+esc(x.start)+'</span><span>'+esc(x.sted)+'</span></div><p>'+esc(x.beskrivelse)+'</p>'+(x.ansvarlig_navn?'<p class="hint">Ansvarlig: '+esc(x.ansvarlig_navn)+'</p>':'')+'<a class="btn'+(full||gone?' alt':'')+'" href="#/arrangement/'+encodeURIComponent(x.id)+'">'+(full||gone?'Se detaljer':'Meld dig')+'</a></article>'}).join(''):'<div class="empty">Der er ingen konkrete opgaver lige nu. Kontakt os, hvis du gerne vil hjælpe.</div>';
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
  var p=$('#pop'),e=upcoming(EV).filter(function(x){return x.popup&&status(x)!=='aflyst'})[0],seen=false;
  if(!e)return;try{seen=sessionStorage.getItem('dv_pop')==='1'}catch(x){}
  if(seen)return;
  var d=dm(e.dato),open=e.tilmelding&&status(e)==='aktiv';
  $('#popH').textContent=e.titel;$('#popT').textContent=d.long+', kl. '+e.start+' · '+e.sted+'. '+(e.beskrivelse||'');
  var a=$('#popA');a.textContent=open?'Tilmeld':'Læs mere';a.href='#/arrangement/'+encodeURIComponent(e.id);a.onclick=closePop;
  var pi=$('#popImg');if(e.billede)photo(pi,e.billede,function(){pi.hidden=false});
  $('#popX').onclick=closePop;p.onclick=function(ev){if(ev.target===p)closePop()};
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
  if(C.DEMO)$('#demoBand').hidden=false;else $$('a.adm').forEach(function(a){a.hidden=true});
  $('#fTel').textContent=F.telefon||'';$('#fTel').href='tel:'+(F.telefon||'').replace(/\s/g,'');
  var lg=$('#logoImg'),im=new Image();im.onload=function(){lg.src=C.LOGO;lg.hidden=false;$('#logoMark').hidden=true};im.src=C.LOGO;
  wireMenu();wireHero();wireAdmin();
  $$('[data-pdf]').forEach(function(p){fetch(p.dataset.pdf,{method:'HEAD'}).then(function(r){if(r.ok)p.hidden=false}).catch(function(){})});
  load().then(function(){renderBar();route();wirePop()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
