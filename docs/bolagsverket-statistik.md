# Bolagsverkets aggregerade statistik

De fyra öppna statistikfilerna är aggregerade datamängder och hålls därför
separata från grunddata om enskilda företag. De ska inte läsas in i
`src_bolagsverket.company_registration`.

| Nyckel | Fil | Innehåll | Avgränsare |
| --- | --- | --- | --- |
| `companies` | `ftgstat_oppna.csv` | Företag och föreningar per tid, händelse, geografi och organisationsform | `,` |
| `representatives` | `foretradare_historik.csv` | Företrädare per roll, företagsform, geografi och demografi | `;` |
| `auditor_reservations` | `rev_forbehall.csv` | Revisorsförbehåll för nyregistrerade aktiebolag | `;` |
| `filing_delays` | `rakenskaps_forsening.csv` | Årsredovisningar och förseningsavgifter per län och räkenskapsperiod | `;` |

Bolagsverket anger licensen CC BY 2.5 SE. Statistik om företag och företrädare
uppdateras första vardagen varje månad. Källkatalog, URL:er och nuvarande
CSV-kontrakt finns samlade i
`worker/bolagsverket_statistics/catalog.py`.

## Hämta filer

Från projektroten:

```powershell
python -m worker.run_bolagsverket_statistics_download
```

En eller flera utvalda filer:

```powershell
python -m worker.run_bolagsverket_statistics_download --dataset companies --dataset filing_delays
```

Filerna strömmas till temporära filer, valideras mot sina obligatoriska
kolumner och flyttas atomiskt till `data/bolagsverket_statistics`. Ett manifest
med URL, hämtningstid, HTTP-validatorer, licens, filstorlek och SHA-256 sparas
bredvid varje fil. Vid nästa körning används ETag/Last-Modified när servern
erbjuder dem. HTML-felsidor och ofullständiga CSV-filer ersätter aldrig en
tidigare godkänd fil.

## Importera

Migrera databasen och hämta/importera alla fyra filer i ett kommando:

```powershell
python -m db.migrate
python -m worker.run_bolagsverket_statistics_import --download-official
```

Importera redan hämtade filer eller ett urval:

```powershell
python -m worker.run_bolagsverket_statistics_import
python -m worker.run_bolagsverket_statistics_import --dataset companies --dataset representatives
```

Samma fil och parserkontrakt återanvänder sin färdiga körning. En avbruten
körning återupptas från senaste committade källrad som standard. Använd
`--no-resume` endast när en separat observation uttryckligen behövs.

Om en ny helfil skulle ta bort fler än 5 procent av nuvarande nycklar (med en
minimitröskel på 10 rader) stoppas publiceringen. Kontrollera först att filen är
komplett och använd därefter `--allow-large-removal` om bortfallet är avsiktligt.

## Datakorn och naturliga nycklar

| Dataset | En rad avser | Stabil källnyckel |
| --- | --- | --- |
| `companies` | Månad, händelse, regionfamilj och källans län/kommun | `ar` + `manad` + `handelse` + `regfam` + `SATELAN` + `SATEKOMMUN` |
| `representatives` | År, företagsform, geografi och samtliga demografiska flaggor | De 12 dimensionsfälten före rollantalen |
| `auditor_reservations` | Registreringsår och nybildningstyp | `Registreringsar_NO` + `AktiebolagLagerbolagNYB` |
| `filing_delays` | Period-till-år, räkenskapsperiodgrupp och län | Källans tre dimensionsfält |

Nycklarna använder källans värden. Normaliserade SCB-koder ingår alltså inte i
identiteten. En förbättrad kodmappning blir därmed en ny version av samma rad,
inte ett falskt bortfall och nytillskott.

Tomma antalsfält i företagsstatistiken lagras som `NULL`; de betyder inte ett
observerat nollvärde. Företrädarfilens faktiska nollor behålls som nollor.
Andelar lagras numeriskt och får överstiga 1 eftersom källans andel inkomna
årsredovisningar ibland gör det. `LADDATUM` saknar tidszon och exponeras därför
som `timestamp without time zone`.

Historiska geografier tvingas inte in i dagens indelning. Exempelvis behåller
Heby-rader från tiden i Västmanlands län sina källnamn men lämnar kommunkoden
tom. Sådana fall loggas i `meta.data_quality_issue`. Namnbytet Malung till
Malung-Sälen mappas däremot till den stabila kommunkoden `2023`.

## Lager och historik

| Objekt | Ansvar |
| --- | --- |
| `meta.ingestion_run` | Filchecksumma, parserkontrakt, checkpoint, status och radantal per dataset |
| `raw.bolagsverket_*_statistics` | Fyra fysiska partitioner med exakt avkodad, oföränderlig källrad |
| `src_bolagsverket.statistics_import_stage` | Beständig staging för återupptagning; töms först efter lyckad publicering |
| `src_bolagsverket.statistics_history` | Gemensam SCD2-historik med källnyckel, normaliserad data och importlineage |
| `src_bolagsverket.statistics_current` | Endast öppna, aktuella versioner |
| `app.bolagsverket_*_statistics` | Fyra typade och utvecklarvänliga aktuella vyer |
| `app.dim_bolagsverket_*` | Kodnamn för händelser, företagsformer, roller och demografi |
| `mart.bolagsverket_*_monthly/yearly` | Materialiserade nationella tidsserier, aggregerade före unpivotering och uppdaterade i importtransaktionen |

Varje distinkt leverans arkiveras i raw. För en komplett ny snapshot sker sedan
en enda transaktion:

1. Oförändrade nycklar uppdaterar endast `last_ingestion_run_id`.
2. Ändrade nycklar stänger föregående version och skapar en ny.
3. Nya nycklar skapar sin första version.
4. Nycklar som saknas i den nya helfilen stängs men raderas aldrig.
5. Staging töms och importkörningen markeras färdig.

De här filerna är aggregerad statistik och kopplas därför inte till enskilda
företag i `core`. Original-CSV och manifest bör behållas även om avkodad rawdata
finns i PostgreSQL; raw växer med ungefär hela källmängden vid varje ny leverans.

Exempel på läsning:

```sql
SELECT *
FROM app.bolagsverket_company_statistics
WHERE period_start >= DATE '2026-01-01' AND county_code = '18';

SELECT *
FROM mart.bolagsverket_representative_statistics_yearly
WHERE year = 2026 AND representative_role_code = 'VD';
```

De tidigare `mart`-aliasen för revisorsförbehåll och förseningsavgifter togs
bort eftersom de var identiska med motsvarande typade `app`-vyer. De tidigare
radexpanderande vyerna för företag och företrädare ersattes med materialiserade
nationella summeringar. API:t använder bara `mart` när analyskornet faktiskt
ändras eller en dyr, stabil aggregering flyttas till importtillfället.

## Produktvy och API

Den avgränsade produktvyn finns på `/sverigedata/statistik`. Den visar de fyra
dataseten i separata flikar och använder ett fast antal senaste perioder så att
sidladdningen inte växer med källhistoriken. API-kontraktet är
`GET /sweden/bolagsverket-statistics`; resultatet cachas i
`app.overview_cache` och invalideras av importflödena.
