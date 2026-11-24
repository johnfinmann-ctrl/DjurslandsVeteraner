# Testmiljø og drift – Djurslands Veteraner V3.3 (Brevo)
Separat TEST-Sheet og Brevo-testkonto. Brug kun testdata – ingen rigtige personer. Live-siden og Supabase røres ikke.
**STOP-regel:** Beder Brevo eller Google om betalingskort eller abonnement undervejs, så stop og meld tilbage.

## DEL 1 – Opsætning (ca. 25 min)
**Brevo (foreningens egen konto, uafhængig af Marineforeningen)**
1. Opret gratis Brevo-konto (brevo.com) med foreningens e-mailadresse. Kontrollér, at ingen betalingsplan vælges.
2. **Senders, domains & IPs → Senders → Add a sender:** tilføj afsenderadressen og bekræft den via den mail, Brevo sender. For pålidelig levering kan Brevo anbefale godkendelse af et domæne (SPF/DKIM); det afhænger af afsenderadressen (ikke afprøvet her).
3. **SMTP & API → API keys → Generate a new API key.** Kopiér nøglen (vises kun én gang). Den må aldrig sendes til mig, mailes eller lægges i GitHub.

**Google Sheet + Apps Script**
4. sheets.google.com → Tomt regneark "DV test". **Udvidelser → Apps Script**, slet standardkoden, indsæt hele `Code.gs`, Gem.
5. Projektindstillinger (tandhjul) → "Vis manifestfilen appsscript.json" → erstat indholdet med filen `appsscript.json`, Gem.
6. Samme side → **Scriptegenskaber → Tilføj scriptegenskab:** navn `BREVO_API_KEY`, værdi = nøglen. Gem.
7. Vælg funktionen **opsaetning** → Kør → godkend. Faner oprettes (Arrangementer, Tilmeldinger, Admins, Log, Indstillinger) og to TEST-arrangementer (`test1`, `test2`, 5 pladser).
8. Fanen **Indstillinger:** skriv den bekræftede Brevo-afsender i `afsender_email`.
9. Fanen **Admins:** tilføj en anden af dine egne adresser som `ansvarlig`. Sæt den som `ansvarlig_email` på `test2`.
10. **Udrul → Ny udrulning → Webapp**, Udfør som: Mig, Adgang: Alle. Kopiér URL'en (`…/exec`). Efter hver kodeændring: Udrul → Administrer udrulninger → Ny version.

## DEL 2 – Tests i det rigtige Google/Brevo-miljø
Funktioner køres i editoren (vælg → Kør → Eksekveringslog). `test-klient.html` åbnes fra localhost eller GitHub Pages.

**A – Brevo-mail:** (A1) kør `testBrevo`: mail i indbakken. Fejlkoder i loggen: `ikke_opsat` = nøgle/afsender mangler, `HTTP 401` = forkert nøgle, `HTTP 400` = afsender ikke bekræftet. (A2) Send test-tilmelding til `test1` med din egen adresse som deltager: du skal modtage både bekræftelsen og beskeden til ansvarlig; `mail_deltager`/`mail_ansvarlig` = sendt. (A3) Ret midlertidigt nøglen til noget forkert, send tilmelding: svar `ok`, rækken gemt, status FEJL, `mail_fejl` = HTTP 401, Log viser `mail_fejl`. Ret nøglen, kør `gensendFejledeMails`: status bliver sendt, ingen dobbeltmails.
**B – Samtidighed:** slet testrækker i Tilmeldinger, kør `testKonkurrence` (10 samtidige, 5 pladser; sender 10 mails til dig selv). Forventet: "Gemt: 5 · Afvist fuldt: 5 · BESTÅET" og præcis 5 rækker. Gentag 3 gange.
**C – Login via Brevo:** (C1) kode kan bruges én gang. (C2) kode udløber efter 10 min – vent 11 min. (C3) 5 forkerte forsøg låser; Log viser `login_laast`. (C4) ansvarlig ser kun egne arrangementer; fremmed event giver `ikke_adgang`. (C5) hovedadmin ser alle. (C6) ugyldig session afvises. (C7) slet admin-rækken: adgang bortfalder straks. (C8) ukendt adresse får samme svar og ingen mail. (C9) fjern nøglen: login-mail sendes ikke, svaret afslører intet, Log viser `login_mail_fejl`.
**D – GitHub Pages ↔ Apps Script:** punkt 1–3 i `test-klient.html` skal vise "svar kunne læses". Fejl = tilmelding virker ikke fra GitHub Pages og skal løses først. Tjek også at `?action=events` i inkognito ikke viser e-mail eller tilmeldte, og at Sheet-URL'en kræver login.
**E – Persondata:** sæt datoen på `test1` >30 dage tilbage, kør `slettGamlePersondata`: navn, e-mail, telefon, bemærkning tomme, status `slettet`. Kør `installerAutoRydning` én gang for daglig automatik.

## Hvad er testet hvor
| Emne | Lokalt (simuleret, 73 tests bestået) | Rigtigt Google/Brevo |
|---|---|---|
| Validering, kapacitet, rettigheder, CSV, log, spam-grænser | bestået | – |
| Brevo-kald (endpoint, nøgle i header, fejlhåndtering, gensend) | bestået mod mock | **ikke testet** |
| Engangskode, udløb, forsøgsgrænse, session, fjernet admin | bestået (simuleret ur) | **ikke testet** |
| 10 samtidige / 5 pladser | kun sekventiel logik | **ikke testet** |
| CORS/omdirigering, levering til indbakke | – | **ikke testet** |
| Persondata-sletning | bestået | **ikke testet** |
Sikkerheden er først godkendt, når Del 2 er bestået.

## Daglig drift (webmaster, ingen kode)
- **Nyt/ændret arrangement:** ny række eller ret række i Arrangementer (id uden mellemrum, dato `2027-01-15`, status `aktiv`/`fuldt booket`/`aflyst`). Aflys = skift status.
- **Ansvarlig og modtager-mail:** ret `ansvarlig_navn`, `ansvarlig_email`, `modtager_email`. Tilføj adressen i Admins som `ansvarlig`, hvis vedkommende skal se listen.
- **Deltagerliste:** filtrér Tilmeldinger på `event_id`. Eksport: Filer → Download → CSV.
- **Slet tilmelding:** sæt `status` til `fjernet` (pladsen frigives).
- **Fjern adgang:** slet rækken i Admins.
- **Mail fejlede:** kolonnen `mail_fejl` viser årsag. Ret årsagen (typisk nøgle eller afsender) og kør `gensendFejledeMails`.
- **Ændre afsender:** Indstillinger → `afsender_email` (skal være bekræftet i Brevo).
- **Vedligehold:** Brevo gratis plan har en daglig mailgrænse (jeg har tidligere set 300/dag; tjek aktuel grænse). Hver tilmelding bruger 2 mails, hver login 1. Fjern testrækker før drift.

## Overdragelse
Foreningen ejer: Google-konto + Sheet + Apps Script (Del → Overfør ejerskab af Sheet'et; scriptet følger med), og Brevo-konto. Efter overdragelse: foreningens konto udruller webappen, opretter ny Brevo-nøgle i Script Properties og bekræfter afsender; webapp-URL opdateres på siden; den gamle nøgle slettes i Brevo; udviklerens adgang fjernes fra Sheet, Script og Brevo.
