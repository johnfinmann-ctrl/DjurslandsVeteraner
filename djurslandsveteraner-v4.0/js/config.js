/* ALLE INDSTILLINGER ET STED. Ingen nøgler eller adgangskoder i denne fil (den er offentlig). */
window.DV_CONFIG = {
  DEMO: true,            // true = viser tydeligt mærkede testdata og afviser at foregive tilmelding. Sættes til false ved drift.
  API_URL: '',           // Apps Script-webapp-URL (…/exec). Tom = ingen forbindelse; siden viser så aldrig en tilmeldingsbekræftelse.
  LOGO: 'img/logo.png',  // Foreningens logo (PNG/SVG). Mangler filen, vises et midlertidigt monogram.
  HERO: [                // 4-5 egne fotografier, min. 1920x1080, liggende. Mangler en fil, vises en neutral billedplads.
    {src:'img/hero-1.jpg', alt:'Veteraner samlet til veterancafé', pos:'50% 40%'},
    {src:'img/hero-2.jpg', alt:'Sejlads fra Ebeltoft Havn',        pos:'50% 50%'},
    {src:'img/hero-3.jpg', alt:'Udflugt i Mols Bjerge',            pos:'50% 55%'},
    {src:'img/hero-4.jpg', alt:'Fællesskab ved foreningens arrangementer', pos:'50% 45%'},
    {src:'img/hero-5.jpg', alt:'Flag og mindehøjtidelighed',       pos:'50% 40%'}
  ],
  SLIDE_SEC: 8,
  POPUP: {               // Webmaster styrer pop-up her (senere via admin). Vises én gang pr. besøg og forsvinder efter slutdato.
    aktiv: true,
    billede: 'img/popup.jpg',
    overskrift: 'Veterancaféer på Djursland',
    tekst: 'Veterancafé i Kolind, Ålsrode og Ebeltoft. Alle veteraner og pårørende er velkomne.',
    knap: 'Se veterancaféerne',
    link: '#/veterancafeer',
    start: '2026-11-01',
    slut: '2027-12-31'
  }
};
