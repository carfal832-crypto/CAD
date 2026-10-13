# Formverkstan

Ett enkelt CAD-program på svenska för att bygga modeller av kuber, cylindrar och bollar. Körs i webbläsaren med WebGL.

## Starta

Kräver Node.js 20.19+ eller 22.12+ (testat med Node 24).

```sh
npm ci
npm run dev
```

Öppna adressen som Vite visar i din lokala terminal. Molnmiljöns onboarding har ingen publik förhandsvisning. För att använda programmet på din egen dator behöver du köra projektet där eller publicera `dist/` på en webbserver.

```sh
npm test
npm run build
npm run test:e2e
```

Webbläsartester använder `/usr/bin/chromium`. Sätt `CHROMIUM_PATH` om Chromium finns på en annan plats.

## Bygg något – version 4

1. Dra ett block från vänster till den rutiga plattan. Du kan också klicka på en form; då placeras den på en ledig plats.
2. Dra formen på plattan. Storlekshandtagen visas direkt: dra den röda fyrkanten för bredd, den gröna för djup och den blå för höjd. Formen ändras medan du drar. Välj **Flytta** om du vill använda pilar för att flytta eller lyfta blocket. Välj **Rotera** och dra i en färgad ring, eller använd **+90°** för att tippa den. Välj **Storlek** och dra i ett fyrkantigt handtag för att ändra storleken.
3. För att stapla: välj den översta delen, klicka **Sätt ovanpå** och klicka sedan på basen. Verktyget centrerar delen och låter den överlappa basen med 0,5 mm. Escape avbryter.
4. Klicka **Förena** för att slå ihop valda former till en del som kan flyttas, roteras och ändras i storlek. **Ångra** återställer delarna. Separata former utan överlapp blir fortfarande separata skal i utskriftsfilen.
5. **Välj flera** eller Shift-klick väljer flera delar. **Centrera** flyttar deras mittpunkter till den först valda delen i sidled och djupled. Två valda delar kan också staplas med **Sätt ovanpå**, där den sist valda hamnar överst.
6. Siffror är valfria: **Exakta mått** visar storleken och **Exakt placering** visar koordinater. **Lägg på plattan** sätter underkanten på plattan, även för roterade former.
7. Projektet autosparas i webbläsaren. **Spara projekt** hämtar en redigerbar JSON-fil. Projekt från version 1 kan öppnas i version 2. Förenade former kräver version 2 för att öppnas igen.
8. **Förbered utskrift → Hämta STL-fil** exporterar modellen i millimeter. Färger ingår inte i STL.

## Utskrift med USB-minne

Det valda arbetsflödet är tills vidare USB-minne: exportera STL från Formverkstan, förbered modellen i skrivarens slicer, spara det färdiga utskriftsjobbet på USB-minnet och starta det från skrivaren. Det gäller inte USB-kabel mellan dator och skrivare. Utskrift på den fysiska skrivaren är ännu inte verifierad.

Direktutskrift via nätverk är **inte implementerad eller verifierad**. Skrivarens exakta modell, slicer, filformat, byggvolym och dokumenterade nätverksgränssnitt behöver bekräftas innan sådan integration kan byggas. Inga skrivarkommandon skickas från appen.

STL-filen är en modell, inte ett färdigt utskriftsjobb. Öppna den i en kompatibel slicer, välj korrekt skrivar- och materialprofil, kontrollera stöd och förhandsvisning och spara därefter utskriftsjobbet på USB-minnet med skrivarprogrammets exportfunktion. Använd det format programmet anger för just skrivaren; att bara byta filändelse på STL-filen räcker inte. Appens platta på 200 × 200 mm är en arbetsyta, inte en bekräftad Sindoh-byggvolym. Webbsidans molnserver har ingen automatisk åtkomst till ditt hemnätverk.

## Avgränsningar

- Högst 60 former, mått 1–200 mm. Förflyttning ±100 mm; former kan sticka utanför arbetsytan.
- Ingen håltagning, skissning, textgravyr eller STL-import. Projektimport gäller Formverkstans JSON-format.
- Ingen automatisk kontroll av stöd, minsta väggtjocklek eller skrivbarhet. Kontrollera alltid modellen i slicern.
- Många komplexa överlappningar kan ta en stund vid export.
- Projektdata lagras lokalt i webbläsaren; ladda ner projektfilen för en egen säkerhetskopia.

## Testa utan installation

Den fristående filen `dist/formverkstan.html` kan öppnas direkt i Chrome, Edge eller Firefox på din dator. Hela appen ingår i filen; ingen webbserver eller nätverksanslutning behövs. Om webbläsaren inte tillåter autosparande för lokala filer, använd **Spara projekt**.

Återskapa filen med `npm run build:standalone` efter `npm ci`. HTML-innehållet har testats i Chromium med nätverksanrop blockerade: att lägga till en form och hämta STL fungerar. Direkt öppning via file:// kunde inte verifieras eftersom molnwebbläsarens administratörspolicy blockerar lokala filadresser.
