/* TESTDATA til designdemoen. Vises kun når DV_CONFIG.DEMO = true og er altid mærket "Testdata".
   Datoerne beregnes ud fra dags dato, så demoen altid har kommende eksempler. Ingen af dem er rigtige arrangementer. */
(function(){
  function iso(offset){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  window.DV_DEMO = {
    events:[
      {id:'demo-1',titel:'Veterancafé Kolind',type:'cafe',dato:iso(6),start:'14:00',slut:'17:00',sted:'Kolind Stationsvej, 8560 Kolind',beskrivelse:'Eksempel på et arrangement uden tilmeldingskrav. Her vises blot de praktiske oplysninger.',ansvarlig_navn:'Testansvarlig',pladser:0,tilmeldte:0,status:'aktiv',tilmelding:false,testdata:true},
      {id:'demo-2',titel:'Veteransejlads',type:'sejlads',dato:iso(13),start:'10:00',slut:'14:00',sted:'Ebeltoft Havn',beskrivelse:'Eksempel på et arrangement med tilmelding og begrænset antal pladser.',ansvarlig_navn:'Testansvarlig',pladser:12,tilmeldte:7,status:'aktiv',tilmelding:true,kraever_telefon:true,popup:true,billede:'img/popup.jpg',testdata:true},
      {id:'demo-3',titel:'Udflugt til Mols Bjerge',type:'udflugt',dato:iso(27),start:'10:00',slut:'15:00',sted:'Mols Bjerge',beskrivelse:'Eksempel på et arrangement, der er fuldt booket.',ansvarlig_navn:'Testansvarlig',pladser:10,tilmeldte:10,status:'fuldt',tilmelding:true,testdata:true},
      {id:'demo-4',titel:'Foredrag og kaffe',type:'moede',dato:iso(41),start:'19:00',slut:'21:00',sted:'Grenaa',beskrivelse:'Eksempel på et arrangement med bemærkningsfelt.',ansvarlig_navn:'Testansvarlig',pladser:30,tilmeldte:4,status:'aktiv',tilmelding:true,kraever_bemaerkning:true,testdata:true},
      {id:'demo-5',titel:'Aflyst eksempel',type:'arrangement',dato:iso(20),start:'18:00',slut:'20:00',sted:'Ebeltoft',beskrivelse:'Eksempel på et aflyst arrangement. Vises ikke i bjælken.',ansvarlig_navn:'Testansvarlig',pladser:20,tilmeldte:3,status:'aflyst',tilmelding:true,testdata:true},
      {id:'demo-6',titel:'Udløbet eksempel',type:'cafe',dato:iso(-9),start:'14:00',slut:'17:00',sted:'Kolind',beskrivelse:'Eksempel på et udløbet arrangement. Vises kun i historikken.',ansvarlig_navn:'Testansvarlig',pladser:0,tilmeldte:0,status:'aktiv',tilmelding:false,testdata:true},
      {id:'demo-7',titel:'Hjælp til kaffe og opstilling',type:'frivillig',dato:iso(6),start:'12:30',slut:'14:00',sted:'Kolind Stationsvej, 8560 Kolind',beskrivelse:'Eksempel på en frivilligopgave: opstilling, kaffe og oprydning ved en veterancafé.',ansvarlig_navn:'Testansvarlig',pladser:3,tilmeldte:1,status:'aktiv',tilmelding:true,testdata:true},
      {id:'demo-8',titel:'Hjælp ved sejladsdag',type:'frivillig',dato:iso(13),start:'09:00',slut:'10:00',sted:'Ebeltoft Havn',beskrivelse:'Eksempel på en frivilligopgave: modtagelse af gæster og praktisk hjælp på kajen.',ansvarlig_navn:'Testansvarlig',pladser:4,tilmeldte:4,status:'fuldt',tilmelding:true,testdata:true}
    ]
  };
})();
