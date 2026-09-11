/* ══════════════════════════════════════════════
   DJURSLANDS VETERANER — FÆLLES DATAKILDE v1
   Nordic Operations · 2026
   
   DENNE FIL ER DEN ENESTE KILDE TIL AKTIVITETER.
   Hjemmeside, kalender, app og tilmeldinger 
   trækker alle data herfra.
   
   Tilføj/ret aktiviteter KUN her.
══════════════════════════════════════════════ */

const DV_DATA = {

  /* ── FORENING ── */
  forening: {
    navn:       "Djurslands Veteraner",
    undertitel: "Forening for veteraner på Djursland",
    initialer:  "DV",
    adresse:    "Ålsrodevej 1",
    postnrBy:   "8500 Grenaa",
    region:     "Djursland · Danmark",
    telefon:    "22 14 09 59",
    email:      "info@djursveteraner.dk",
    cvr:        "38588451",
    facebook:   "https://www.facebook.com/DjurslandsVeteraner/",
    facebookG:  "https://www.facebook.com/groups/djurslandsveteraner",
    kontingent: "205",
    stiftet:    2016,
  },

  /* ── AKTIVITETER ──
     Alle datoer i ISO-format YYYY-MM-DD
     type: 'sejlads' | 'cafe' | 'udflugt' | 'moede' | 'arrangement'
     pladser: null = ubegrænset
     venteliste: aktiveres automatisk når pladser = tilmeldte
     status: 'aktiv' | 'aflyst' | 'fuldt'
  ── */
  aktiviteter: [
    {
      id: 1,
      titel: "Veterancafé Kolind",
      type: "cafe",
      dato: "2026-10-02",
      tid: "14:00",
      slut: "17:00",
      sted: "Kolind Stationsvej, 8560 Kolind",
      desc: "Uformel kaffe og godt selskab i Kolind. Alle veteraner og pårørende er velkomne — ingen tilmelding nødvendig, men vi sætter pris på at vide om du kommer.",
      pladser: null,
      tilmeldte: 8,
      status: "aktiv",
      gentagelse: "Månedlig"
    },
    {
      id: 2,
      titel: "Veteransejlads",
      type: "sejlads",
      dato: "2026-10-10",
      tid: "10:00",
      slut: "14:00",
      sted: "Ebeltoft Havn",
      desc: "En dejlig sejltur for veteraner og pårørende ud fra Ebeltoft Havn. Ingen sejlerfaring nødvendig — skipperen guider jer hele vejen. Medbringe madpakke og solcreme.",
      pladser: 12,
      tilmeldte: 6,
      status: "aktiv",
      gentagelse: null
    },
    {
      id: 3,
      titel: "Veteransejlads",
      type: "sejlads",
      dato: "2026-10-17",
      tid: "10:00",
      slut: "14:00",
      sted: "Ebeltoft Havn",
      desc: "Anden sejladstur i juli. Tilmeld dig hurtigt — kun få pladser tilbage.",
      pladser: 12,
      tilmeldte: 9,
      status: "aktiv",
      gentagelse: null
    },
    {
      id: 4,
      titel: "Sommerudflugt — Mols Bjerge",
      type: "udflugt",
      dato: "2026-10-24",
      tid: "10:00",
      slut: "15:00",
      sted: "Mols Bjerge Nationalpark",
      desc: "Rolig vandring på ca. 6 km i Mols Bjerge med guidet rute. Turen er tilpasset alle konditionsniveauer. Medbringe madpakke. Gratis for alle veteraner og pårørende.",
      pladser: 25,
      tilmeldte: 18,
      status: "aktiv",
      gentagelse: null
    },
    {
      id: 5,
      titel: "Veterancafé Ebeltoft",
      type: "cafe",
      dato: "2026-10-05",
      tid: "14:00",
      slut: "17:00",
      sted: "Marineforeningen, Strandvejen 30, 8400 Ebeltoft",
      desc: "Første mandag i måneden samles vi til uformel kaffe og godt selskab hos Marineforeningen i Ebeltoft. Alle veteraner og pårørende er velkomne.",
      pladser: null,
      tilmeldte: 5,
      status: "aktiv",
      gentagelse: "Første mandag/måned"
    },
    {
      id: 6,
      titel: "Generalforsamling 2026",
      type: "moede",
      dato: "2026-11-19",
      tid: "19:00",
      slut: "21:30",
      sted: "Grenaa — lokale følger",
      desc: "Årets generalforsamling. Alle veteranmedlemmer har stemmeret og opfordres til at deltage. Dagsorden udsendes senest 2 uger før. Se vedtægternes §5 for dagsorden.",
      pladser: null,
      tilmeldte: 12,
      status: "aktiv",
      gentagelse: null
    },
    {
      id: 7,
      titel: "Veterancafé Kolind",
      type: "cafe",
      dato: "2026-11-06",
      tid: "14:00",
      slut: "17:00",
      sted: "Kolind Stationsvej, 8560 Kolind",
      desc: "Månedlig veterancafé i Kolind. Uformel kaffe og godt selskab.",
      pladser: null,
      tilmeldte: 0,
      status: "aktiv",
      gentagelse: "Månedlig"
    }
  ],

  /* ── TILMELDINGER (gemmes i localStorage) ──
     Struktur per tilmelding:
     { akId, navn, tlf, email, antal, rolle, besked, dato_tilmeldt }
  ── */

  /* ── CAFÉER ── */
  cafeer: [
    {
      id: "kolind",
      navn: "Veterancafé Kolind",
      sted: "Kolind Stationsvej, 8560 Kolind",
      maps: "Kolind Stationsvej, 8560 Kolind",
      tlf: "22 14 09 59",
      info: "Månedlig café — se aktivitetskalenderen for næste dato",
      desc: "Uformel kaffe og samvær i Kolind. Alle veteraner og pårørende velkomne."
    },
    {
      id: "aalsrode",
      navn: "Ålsrode",
      sted: "Ålsrodevej 1, 8500 Grenaa",
      maps: "Ålsrodevej 1, 8500 Grenaa",
      tlf: "22 14 09 59",
      info: "Se aktivitetskalenderen for næste dato",
      desc: "Mød os ved Ålsrode — et roligt sted med plads til snak og samvær."
    },
    {
      id: "ebeltoft",
      navn: "Marineforeningen Ebeltoft",
      sted: "Strandvejen 30, 8400 Ebeltoft",
      maps: "Strandvejen 30, 8400 Ebeltoft",
      tlf: "22 14 09 59",
      info: "Første mandag i måneden · Kl. 14:00–17:00",
      desc: "Veterancafé i samarbejde med Marineforeningen i Ebeltoft. Alle er velkomne."
    }
  ],

  /* ── BESTYRELSE ── */
  bestyrelse: [
    {navn:"Formand",        rolle:"Formand",         region:"Syddjurs",  ini:"F"},
    {navn:"Næstformand",    rolle:"Næstformand",      region:"Norddjurs", ini:"N"},
    {navn:"Kasserer",       rolle:"Kasserer",         region:"",          ini:"K"},
    {navn:"Sekretær",       rolle:"Sekretær",         region:"",          ini:"S"},
    {navn:"Bestyrelsesmedlem", rolle:"Norddjurs",     region:"Norddjurs", ini:"B"},
    {navn:"Bestyrelsesmedlem", rolle:"Syddjurs",      region:"Syddjurs",  ini:"B"},
    {navn:"1. suppleant",   rolle:"Suppleant",        region:"",          ini:"S"},
    {navn:"2. suppleant",   rolle:"Suppleant",        region:"",          ini:"S"},
  ]
};

/* ── TILMELDINGS-LAGER ──
   Al tilmeldingslogik samlet ét sted.
   Bruges af hjemmeside OG app.
── */
const DV_STORE = {
  _key: 'dv3_tilm_v2',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch(e) { return []; }
  },

  save(obj) {
    const list = this.getAll();
    // Undgå dubletter
    const exists = list.find(t => t.akId === obj.akId && t.tlf === obj.tlf);
    if (exists) return false;
    list.push({ ...obj, dato_tilmeldt: new Date().toISOString() });
    localStorage.setItem(this._key, JSON.stringify(list));
    // Opdater lokal tæller
    const ak = DV_DATA.aktiviteter.find(a => a.id === obj.akId);
    if (ak && ak.pladser) ak.tilmeldte++;
    return true;
  },

  isTilmeldt(akId) {
    return this.getAll().some(t => t.akId === akId);
  },

  getMine() {
    const tilm = this.getAll();
    return DV_DATA.aktiviteter.filter(a => tilm.some(t => t.akId === a.id));
  },

  cancel(akId) {
    const list = this.getAll().filter(t => t.akId !== akId);
    localStorage.setItem(this._key, JSON.stringify(list));
    const ak = DV_DATA.aktiviteter.find(a => a.id === akId);
    if (ak && ak.pladser && ak.tilmeldte > 0) ak.tilmeldte--;
  }
};

/* ── DATO-HJÆLPER ──
   Filtrer udløbne aktiviteter automatisk.
── */
const DV_UTIL = {
  MND:   ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  MND_F: ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'],

  kommende(filter) {
    const now = new Date();
    now.setHours(0,0,0,0);
    return DV_DATA.aktiviteter
      .filter(a => {
        if (a.status !== 'aktiv') return false;
        const d = new Date(a.dato);
        d.setHours(0,0,0,0);
        return d >= now && (!filter || filter === 'all' || a.type === filter);
      })
      .sort((a,b) => a.dato.localeCompare(b.dato));
  },

  ledige(ak) {
    if (!ak.pladser) return null;
    return Math.max(0, ak.pladser - ak.tilmeldte);
  },

  pladserHtml(ak) {
    const l = this.ledige(ak);
    if (l === null) return '';
    if (l <= 0) return '<span class="pladser-chip p-roed">🔴 Fuldt booket</span>';
    if (l <= 3) return `<span class="pladser-chip p-gul">🟡 ${l} plads${l===1?'':'er'} tilbage</span>`;
    return `<span class="pladser-chip p-groen">🟢 ${l} ledige pladser</span>`;
  },

  datoStr(iso) {
    const d = new Date(iso);
    return `${d.getDate()}. ${this.MND_F[d.getMonth()]} ${d.getFullYear()}`;
  }
};
