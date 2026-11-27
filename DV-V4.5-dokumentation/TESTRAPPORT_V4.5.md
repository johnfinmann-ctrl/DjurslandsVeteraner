# Testrapport V4.5

## A. Lokale/simulerede tests (kørt)
- Logiktest (validering, kapacitet, adgang, CSV): **19 af 19 bestået**
- Integrationstest mod simuleret Google/Brevo-miljø (tilmelding, kapacitet, afmelding med token, Brevo-fejl, admin, ratelimit, gentagelser, V4.5-rettelser): **79 af 79 bestået** (ialt 98)
- Syntakstjek af al JavaScript og Apps Script: ingen fejl
- Browsertest (Chromium): mobil, iPad, desktop: forside med 4 kommende arrangementer, stor kalenderknap, Kalender i menu, tilmelding uden falsk bekræftelse, afmelding, demo/produktion (testdata skjult, admin lukket, ingen uopfangede fejl), simuleret rigtig-tilstand med falsk backend
- Ingen emojis i leveringen

## B. Rigtige integrationstests (IKKE kørt – kræver din Google- og Brevo-konto)
A) tilmelding gemmes og to mails sendes via Brevo · B) fuldt arrangement · C) afmeldingslink · D) ansvarlig-besked · E) samtidighed (`testKonkurrence`) · F) automatisk gentagelse og oprydning. Se opsætningsvejledningen, afsnit D.
Samtidighed i Google (LockService) er kun testet simuleret.

## Uafhængig QC
Udført af en separat sub-agent mod den oprindelige ordre. Bekræftede fejl er rettet (se RETTEDE_FEJL_V4.5.md). Ikke genkørt som ny uafhængig runde efter rettelserne.
