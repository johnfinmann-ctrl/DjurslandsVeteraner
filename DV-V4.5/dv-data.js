/* Fælles stamdata. Arrangementer kommer fra Google Sheet (backend), ikke herfra. */
window.DV_DATA = {
  forening: {navn:"Djurslands Veteraner",adresse:"Ålsrodevej 1",postnrBy:"8500 Grenaa",telefon:"22 14 09 59",email:"info@djursveteraner.dk",cvr:"38588451",
    facebook:"https://www.facebook.com/DjurslandsVeteraner/",facebookG:"https://www.facebook.com/groups/djurslandsveteraner"},
  cafeer: [
    {id:"kolind",navn:"Veterancafé Kolind",foto:"img/cafe-kolind.jpg",adresse:"Stationsvej, 8560 Kolind",tid:"Se kalenderen for næste dato",kontakt:"22 14 09 59",
      desc:"Uformel kaffe og samvær i Kolind. Alle veteraner og pårørende er velkomne."},
    {id:"aalsrode",navn:"Veterancafé Ålsrode",foto:"img/cafe-aalsrode.jpg",adresse:"Ålsrodevej 1, 8500 Grenaa",tid:"Se kalenderen for næste dato",kontakt:"22 14 09 59",
      desc:"Et roligt sted med plads til snak og samvær."},
    {id:"ebeltoft",navn:"Veterancafé Ebeltoft",foto:"img/cafe-ebeltoft.jpg",adresse:"Marineforeningen Ebeltoft, Strandvejen 30, 8400 Ebeltoft",tid:"Første mandag i måneden (klokkeslæt afklares)",kontakt:"22 14 09 59",afklares:true,by:"Ebeltoft",
      desc:"Veterancafé i samarbejde med Marineforeningen Ebeltoft. Alle er velkomne."}
  ],
  bestyrelse: [
    {rolle:"Formand",navn:"",region:"Syddjurs",foto:""},{rolle:"Næstformand",navn:"",region:"Norddjurs",foto:""},
    {rolle:"Kasserer",navn:"",region:"",foto:""},{rolle:"Sekretær",navn:"",region:"",foto:""},
    {rolle:"Bestyrelsesmedlem",navn:"",region:"Norddjurs",foto:""},{rolle:"Bestyrelsesmedlem",navn:"",region:"Syddjurs",foto:""},
    {rolle:"1. suppleant",navn:"",region:"",foto:""},{rolle:"2. suppleant",navn:"",region:"",foto:""}
  ]
};
