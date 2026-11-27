# Opsætning af Google Sheets og Brevo – Djurslands Veteraner
Ingen betalingskort og intet abonnement. Alt ejes af foreningen (en fælles Google-konto og en Brevo-konto i foreningens navn).

## A. Google Sheets og Apps Script (ca. 20 minutter)
1. Log ind på foreningens Google-konto. Opret et nyt regneark, fx "DV Arrangementer".
2. Menu: Udvidelser → Apps Script. Slet standardkoden. Indsæt hele indholdet af `v33-teknik/Code.gs`. Åbn "Projektindstillinger" og slå "Vis manifestfilen appsscript.json" til. Erstat indholdet med `v33-teknik/appsscript.json`.
3. Vælg funktionen `opsaetning` og tryk Kør. Godkend adgang. Fanerne oprettes: Arrangementer, Tilmeldinger, Admins, Log, Indstillinger, Gentagelser, Deltagerliste.
4. Fanen **Admins**: skriv webmasterens og de ansvarliges e-mails. Rolle `hoved` (ser alt) eller `ansvarlig` (ser egne arrangementer).
5. Fanen **Indstillinger**: udfyld `afsender_email`, `afsender_navn`, `forening_navn` og `site_url` (hjemmesidens adresse, uden skråstreg til sidst).
6. Projektindstillinger → Scriptegenskaber: tilføj `BREVO_API_KEY` (se B).
7. Udgiv: Implementér → Ny implementering → Web-app. Kør som: **mig**. Adgang: **alle**. Kopiér web-app-adressen.
8. Adressen indsættes i `js/config.js` som `API_URL`, og `DEMO` sættes til `false`. (Gøres først efter testene, og først efter godkendelse.)
9. Kør `installerAutoRydning` én gang (sletter personoplysninger automatisk 30 dage efter arrangementet). Kør `installerAutoGentagelse` først, når faste caféer er godkendt.

## B. Brevo (ca. 15 minutter)
1. Opret en gratis konto på brevo.com i foreningens navn (ikke Marineforeningens).
2. Afsendere: tilføj og bekræft foreningens afsender-e-mail (Brevo sender en bekræftelsesmail). Overvej at godkende domænet for bedre levering. Det er ikke afprøvet.
3. SMTP og API → API-nøgler: opret en nøgle. Læg den KUN i Scriptegenskaben `BREVO_API_KEY`. Den må aldrig stå i GitHub, HTML eller JavaScript.
4. Tjek Brevos aktuelle gratis daglige mailgrænse på brevo.com før drift.

## C. Daglig drift for webmaster (alt sker i regnearket)
- **Nyt arrangement:** ny række i Arrangementer. Id skal være unikt. type: cafe, sejlads, udflugt, moede, arrangement eller frivillig. tilmelding: ja/nej. pladser: 0 = ubegrænset.
- **Frivilligopgave:** ny række med type `frivillig` (pladser = antal hjælpere).
- **Pop-up:** sæt popup = `ja` på det arrangement, der skal fremhæves. Billede: fx `img/popup.jpg`.
- **Skjul eller aflys:** skjul = `ja`, eller status = `aflyst`.
- **Deltagerliste:** fanen Deltagerliste, vælg arrangement i B1. Eller fanen Tilmeldinger.
- **Faste caféer:** fanen Gentagelser. Udfyld ugedag (1=mandag), uge_i_maaneden (1–4 eller sidste), start, slut og sted. Tøm `afklares`. Sæt godkendt = `ja`. Kør `genererGentagelser`.
- **Mail fejlede:** kør `gensendFejledeMails`.

## D. Test, før siden går live (kræver jer, ikke mig)
Følg del 2 i `v33-teknik/VEJLEDNING_TESTMILJOE.md`: A mail, B 10 samtidige tilmeldinger, C admin-login, D adgang fra GitHub Pages, E sletning af persondata, F afmelding. Indtil de er bestået, er sikkerhed og mailudsendelse kun testet lokalt med simulering.

---
## Tillæg V4.5
- **Testrækker:** opsætningen lægger to testarrangementer (`test1`, `test2`, kolonnen `testdata` = JA) ind. De vises **ikke** på hjemmesiden, medmindre rækken `vis_testdata` i Indstillinger står til `ja`. Slet dem, når testen er færdig.
- **Telefon** er valgfri ved tilmelding. Sæt `kraever_telefon` = ja på et arrangement, hvis telefonnummer skal være påkrævet.
- **Status** i Arrangementer: `aktiv`, `fuldt` eller `aflyst` (store/små bogstaver og mellemrum er ligegyldige; tom = aktiv).
- Tilmelding virker kun for arrangementer, hvor `tilmelding` ikke er `nej`, `skjul` ikke er `ja`, og datoen ikke er passeret.
- Første gang du kører `installerAutoGentagelse` eller `installerAutoRydning`, beder Google om tilladelse til at oprette en tidsstyret opgave. Det er forventet.
