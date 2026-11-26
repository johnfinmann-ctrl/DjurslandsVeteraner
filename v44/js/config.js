/* ALLE INDSTILLINGER ET STED. Ingen nøgler eller adgangskoder i denne fil (den er offentlig). */
window.DV_CONFIG = {
  DEMO: true,            // true = viser tydeligt mærkede testdata og afviser at foregive tilmelding. Sættes til false ved drift.
  API_URL: '',           // Apps Script-webapp-URL (…/exec). Tom = ingen forbindelse; siden viser så aldrig en tilmeldingsbekræftelse.
  LOGO: 'img/logo.png',  // Foreningens logo (PNG/SVG). Mangler filen, vises et monogram.
  HERO: [                // Foreningens egne, godkendte fotografier (liggende, min. 1920x1080). Kun filer, der findes, vises i slideren.
    {src:'img/hero-1-flagdag.jpg',     alt:'Flagdag',                             pos:'50% 45%'},
    {src:'img/hero-2-faellesskab.jpg', alt:'Veteraner i fællesskab',              pos:'50% 45%'},
    {src:'img/hero-3-cafe.jpg',        alt:'Veterancafé',                         pos:'50% 50%'},
    {src:'img/hero-4-sejlads.jpg',     alt:'Sejlads og aktiviteter',              pos:'50% 55%'},
    {src:'img/hero-5-mindehoejtidelighed.jpg', alt:'Mindehøjtidelighed',          pos:'50% 40%'}
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
