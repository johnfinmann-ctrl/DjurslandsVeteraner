# Djurslands Veteraner – V4.0 designdemo
Åbn `index.html` via en webserver (fx GitHub Pages eller `python3 -m http.server`). Dette er en DEMO til godkendelse af design – ikke til drift.

## Hvad er nyt
- Nyt design: militærgrøn, sand, creme og koksgrå. Ensartede linjeikoner. Ingen emojis, ingen AI-assistent, ingen eksterne skrifter eller scripts.
- Billedserie med langsom Ken Burns-effekt (respekterer reduceret bevægelse, kan sættes på pause), arrangementsbjælke nederst, pop-up (én gang pr. besøg, udløber automatisk).
- Forside i aftalt rækkefølge. Alle sider fra masterprompten, inkl. Du er ikke alene, Veterankoordinator, Giv en hånd med, Vejledning, Afmelding og en visuel administrationsdemo.
- Eksisterende tekster (vedtægter, forretningsorden, kommunikationsstrategi, hjælp, akutnumre, caféer, kontakt) er genbrugt uden ændring i indhold.

## Hvad er demo, og hvad er ikke
- Eksempelarrangementer og -opgaver er mærket **Testdata** og beregnes ud fra dags dato. Sæt `DEMO:false` i `js/config.js` for at skjule dem.
- Tilmelding, afmelding, login og beskeder er **ikke koblet på**. Siden viser tydeligt, at intet er sendt eller gemt, og aldrig en falsk bekræftelse.
- Eksempelbekræftelsen er vist som "Eksempel – ikke sendt".
- Pladser til foreningens egne fotos og logo er neutrale billedpladser. Se `img/LAES_MIG.txt`.
- Bestyrelsesnavne, samarbejdspartnere, PDF'er/referater, galleri og nyheder mangler fra foreningen. Intet er opfundet.
- De gamle eksempelaktiviteter i `dv-data.js` er uændrede, men er udløbet og vises ikke.

## Teknik (uændret model, fase 3 efter godkendelse)
GitHub Pages + Google Sheets + Apps Script + Brevo. `v33-teknik/` indeholder V3.3-arbejdet (Code.gs m.fl., 73 lokale tests). Google/Brevo-testene er stadig ikke gennemført.

## Mangler / åbne punkter
Billeder og logo · bestyrelse · samarbejdspartnere · referater og PDF'er · modtager-mailadresser · Brevo-konto · tekster om privatliv/cookies skal revideres før tilmelding tages i brug · Klubmodul er gennemgået: ingen bestyrelsesnavne, café-tider, kontooplysninger, sponsorer eller datoer er offentliggjort der.
