# Rettede fejl i V4.5 (fundet af uafhængig kvalitetskontrol)

| # | Fejl | Rettelse |
|---|------|----------|
| 1 | Tilmelding kunne aldrig gennemføres, medmindre arrangementet krævede telefon (backend krævede altid telefon, formularen sendte ingen) | Telefon er valgfri; påkrævet kun når `kraever_telefon` = ja. Ny test. |
| 2 | Testarrangementer fra opsætningen kunne vises på den rigtige side | Skjules i backend (medmindre `vis_testdata` = ja) og i frontend uden demo-tilstand |
| 3 | Admin-link/-side og eksempelpersoner kunne ses i produktionsversionen; afmeld viste "Eksempelside" uden backend | Admin skjult og lukket uden demo; afmeld viser neutral besked, til backend er åbnet |
| 4 | Status "Fuldt booket"/store bogstaver/tom blev misforstået | Normaliseres i backend og frontend; dokumentation rettet |
| 5 | Service worker gemte 404-billeder for evigt | Kun vellykkede svar caches |
| 6 | Service worker brugte browserens HTTP-cache (GitHub Pages 10 min) og forsinkede opdateringer | Netværk-først med `cache: no-cache` |
| 7 | Formelinjektion i Google Sheet via navn/bemærkning/telefon | Værdier der starter med = + - @ får foranstillet `'` |
| 8 | Tomme sandfarvede portrætcirkler på Bestyrelsen | Vises kun hvis der er foto |
| 9 | Uopfanget fejl ved ugyldigt link (`%`) | Sikker afkodning |
| 10 | Intern note på Juridisk-siden | Fjernet |
| 11 | Dokumentation: "73 tests"; ubrugt POPUP-blok i config.js | Rettet / fjernet |
| 12 | Mindre: klokkeslæt kunne blive "1899-12-30"; manglende `script.scriptapp`-tilladelse; `site_url` ikke seedet; tilmelding til skjulte/aflyste/tilmelding=nej/passerede arrangementer; tom dato kunne anonymisere tilmeldinger; stille fejl hvis kalenderen ikke kunne hentes | Alle rettet |
