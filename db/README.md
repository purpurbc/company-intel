# Databas v2

En PostgreSQL-databas med tydliga lager. Den gamla breda `public.company` ar inte
langre skrivmal for importerna. `db/migrations/` ar den enda aktiva
migrationskedjan.

## Befintlig databas

Stoppa gamla workers och API-processer under bytet. Ta forst en fullstandig backup
med `pg_dump -Fc` av den databas som `DATABASE_URL` pekar pa. Behall aven ZIP-filerna.
Anvand en direktanslutning till PostgreSQL, inte en pooler i transaction mode:
importerna anvander sessionlas och temp-tabeller.

```powershell
python -m pip install -r worker/requirements.txt -r api/requirements.txt
python -m db.migrate --check
python -m db.migrate
```

`migrate` skapar och uppdaterar v2-modellen. Hela migrationskedjan kor i en
transaktion, med las och checksummor. Redigera inte redan applicerade migrationer.
Geografiska kodtabeller seedas fran repots SCB-kodtabeller, oberoende av vilka
foretag som hunnit importeras.

Den aktiva kedjan ar en kompakt baslinje med fem filer samt samlade
efterfoljande migrationer:

| Fil | Ansvar |
| --- | --- |
| `100_platform_baseline.sql` | Scheman, importmetadata, kodtabeller och immutable raw |
| `110_company_baseline.sql` | Core-identitet, SCD2, events, arbetsstallen och sokindex |
| `120_source_baseline.sql` | Versionshanterade SCB-/Bolagsverksobservationer |
| `130_product_baseline.sql` | Anvandare, segment, erbjudanden, kunder och cache |
| `140_read_models_baseline.sql` | Appens API-kontrakt och mart-vyer |
| `200_product_and_query_optimizations.sql` | Produktfunktioner, sokindex, planner-statistik och regionala lasningar |
| `290_extension_prerequisites.sql` | Flyttar tillagg innan standardschemat avvecklas |
| `300_schema_contract_cleanup.sql` | Normaliserade registreringsvyer, constraints och tydliga schemakontrakt |
| `310_bolagsverket_statistics.sql` | Versionshanterad aggregerad Bolagsverksstatistik, dimensioner och analysvyer |
| `320_operational_time_and_cache_contract.sql` | Tidsbegrepp och cachelivslängd |
| `330_never_active_company_sort.sql` | Sorteringsindex för företag som aldrig varit verksamma |
| `340_remove_customer_watch_offer_prototypes.sql` | Tar bort tidiga CRM- och bevakningsprototyper |
| `350_remove_saved_segment_notes.sql` | Avgränsar segment till definierade urval |
| `360_company_filtered_pagination.sql` | Filterindex och statistik för stabil sidbläddring |
| `370_remove_redundant_statistics_marts.sql` | Tar bort två oanvända genomgångsvyer utan eget analyskontrakt |
| `380_statistics_summary_marts.sql` | Förberäknar de nationella statistikserier som produktsidan faktiskt läser |

Den tidigare v2-kedjan till och med `188_company_name_search.sql` inneholl flera
engangsreparationer och vyer som senare skapades om. En databas som redan har
hela den kedjan adopterar automatiskt baslinjens checksummor utan att kora DDL
eller andra dataandringar igen. Gamla rader i `meta.schema_migration` behalls som
historik och ar ofarliga.

En databas som bara har delar av den gamla kedjan stoppas med ett tydligt fel.
Slutfor den med kodrevisionen som fortfarande innehaller de gamla migrationerna,
eller bygg om databasen fran tomt lage. Detta ar avsiktligt: de borttagna
datareparationerna far inte hoppas over tyst. Den tidigare serien `200`-`290`
adopteras pa samma satt om samtliga filer redan ar applicerade; en delvis
applicerad serie stoppas. Framtida schemaandringar ska alltid laggas efter det
senaste numret i den aktiva kedjan.

Starta API:t med den nya koden efter overforingen. Hamta sedan aktuell data:

```powershell
python -m worker.run_bulk_import --scb data/scb_bulkfil.zip --bolagsverket data/bolagsverket_bulkfil.zip --resume --progress-every 1000
python -m worker.run_scb_update
python -m worker.run_bolagsverket_statistics_import --download-official
```

En ny veckofil med samma filnamn identifieras via SHA-256 och far en ny korning.
`--resume` galler bara exakt samma fil, parsermodell och identitetsfilter.
Det gar inte att anvanda v1:s radnummer som v2-checkpoint: v2 behover bygga sina
kallversioner. Efter ombyggnaden aterupptas avbrutna v2-importer fran senast
committade batch. En komprimerad ZIP maste fortfarande lasas fram till den punkten,
men redan committade rader normaliseras eller skrivs inte igen.

## Lager

| Schema | Ansvar |
| --- | --- |
| `meta` | Kallor, importkorningar/checkpoints, kodtabeller, kvalitetsavvikelser och migrationslogg |
| `raw` | Oforanderliga, avkodade kallposter med fil/rad/checksumma och import-ID |
| `src_scb` | Separata SCB API- och bulkversioner, synliga via history/current-vyer |
| `src_bolagsverket` | Registreringsversioner samt namn och forfaranden knutna till ratt registrering |
| `core` | Intern foretagsidentitet, sammanfogad typad SCD2-historik, SNI, andringar och handelser |
| `app` | Lasvyer for API:t samt produktagd data for anvandare, segment och cache |
| `mart` | Analysvyer utan namn, adresser och personidentifierare |
| `extensions` | PostgreSQL-tillagg som `pg_trgm` och `pgcrypto` |

Standardschemat `public` anvands inte. Tillaggen flyttas till `extensions` och
`public` tas bort av migration `300`, sa ny SQL maste ange ratt lager eller ga via
API-anslutningens avgransade sokvag.

Normaliserade kallversioner anvander JSONB for myndigheternas varierande attribut.
Det ar ett medvetet avsteg fran att ha tre nastan identiska breda kalltabeller.
Identiteter, relationsnycklar, import-ID:n och giltighetsintervall ar typade och
validerade. Kallorna blir inte appens lagringskontrakt: `core.company_state_history`
har riktiga kolumner for namn, koder, datum, antal och numeriska andelar.

Bolagsverkets namn och forfaranden ar riktiga 1:N-tabeller med FK till den
registreringsversion de kom fran. Adressen foljer registreringsversionen i
`data._registration`; den behover ingen egen tidsaxel.

SNI ligger i `core.company_industry`, en rad per kod/rang inom en tillstands-version.
`core.company_industry_history` visar tillhorande foretag och giltighetsintervall.
En kod ar text, sa inledande nollor bevaras. SNI-version lagras explicit: bulk
anvander `2025` som standard, API `unknown` tills versionen anges med
`--sni-version`. Vi gissar inte att en gammal API-kod tillhor SNI 2025.

Arbetsstallen har separat identitet via CFAR och egen tillstandshistorik i `core`.
Det finns fortfarande ingen automatisk AE-import: befintlig worker importerar JE.
Gamla arbetsstallen migreras inte till en pahittad ny kallhistorik.

## Identitet och kallprioritet

`core.company.company_id` ar en intern bigint. Produktagda referenser anvander
den, inte ett forkortat personnummer. `core.company_identifier` skiljer pa
10-siffrigt ORGNR och fullstandigt 12-siffrigt PERSON. SCB:s prefix `16` for juridiska
personer normaliseras till samma organisation som Bolagsverkets ORGNR-IDORG.
Bolagsverkets faktiska fil innehaller aven korta, 10-siffriga PERSON-IDORG.
De bevaras som `PERSON_SHORT`, med en kvalitetsmarkering, utan att gissa arhundrade
eller sla ihop dem med en mojlig annan person. Anvand company_id for dessa poster;
en senare identitetskoppling kraver en bekraftad fullstandig kallidentitet.

Bolagsverkets `(identitetstyp, identitet, namnskyddslopnummer)` ar en separat
kallnyckel. Flera registreringar kan kopplas till samma foretag. Beskrivningar,
namn, registreringsdatum och avregistrering ar kvar per registrering.

- SCB API har foretrade for SCB:s falt. Explicit null fran API:t ar ocksa en
  observation och skrivs inte over av bulk.
- En variabel som saknas helt i en ny API-respons behaller senast kanda observation
  for just den variabeln. Hela den nya responsen sparas i raw.
- SCB bulk fyller basen dar det inte finns API-observationer.
- Tidigare migrerade v1-basuppgifter kan finnas kvar som historiska core/source-
  versioner, men anvands inte som aktiv kallprioritet vid nya importer.
- Bolagsverket lagger till registreringsinformation; dess status/datum blandas inte
  ihop med SCB:s verksamhetsstatus eller registreringsdatum.
- Nar SCB saknas kan en ensam Bolagsverksregistrering ge namn/adress som bas.
  Finns flera registreringar valjs inget godtyckligt huvudnamn eller huvudadress.
- API:ts primara SNI kan kompletteras med bulkens sekundara koder bara nar bade
  primarkoden och SNI-versionen ar lika.
- Bulkens reklamkod och API:ts reklam/telefonkod lagras separat.

SCB-partitionernas totalsumma jamfors med ett opartitionerat rakneanrop.
Otackta eller overlappande partitioner och avvikande antal svarsrader gor korningen
misslyckad. Delvis committade observationer och raw behalls, men korningen far inte
status `done`. Det ar fortfarande ett legacy-API utan atomisk nationell snapshot;
registerforandringar under hamtningen kan darfor ocksa orsaka antalsavvikelser.

Det finns inga `legal_name` eller `display_name` for foretag. `company_name` och
`registered_name` skiljer namnet pa personen/organisationen fran SCB:s Firma.
Bolagsverkets samtliga namn finns per registrering. `registered_name_count` ar det
antal SCB levererat, inte ett beraknat antal juridiska personer.

## Historik och API

SCD2 anvander observerad tid: `[valid_from, valid_to)`, dar `valid_to IS NULL`
betyder nuvarande version. En oforandrad rad far ingen ny source/core-version;
kallversionens senaste import-ID/rad uppdateras. Raw behaller varje ny leverans.
Alla rader i samma importkorning anvander korningens `started_at` som
`observed_at`; batchgransen far aldrig skapa olika observationstider.
Ett byte av vinnande kalla far en ny core-version aven om vardet ar detsamma.
Provenance pekar pa kallversionerna som etablerade tillstandet, inte pa varje
senare oforandrad leverans. Saknas ett foretag i en senare fil antas det inte
automatiskt vara avregistrerat; avregistrering kraver en uttrycklig kalluppgift.
`source_as_of_date` kan anges for en fil med kand referenstid, separat fran
importtiden. `effective_at` reserveras for ett datum som kallan anger for en
verksamhetshandelse. Dessa tider ersatter aldrig varandra och kallans datum
gissas inte fran nedladdnings- eller importtiden.

Gamla faltandringar behalls som faltandringar. De bevisar inte hur ALLA falt sag
ut vid en gammal tidpunkt, sa uppgraderingen skapar inte falska kompletta SCD2-rader
baklanges. Fullstandiga observerade tillstands-versioner borjar vid v2-importen.

`app.company` ar den enda app-vyn for foretagsdata och har de kanoniska namnen.
Detaljsvaret har dessutom `company_id`, `registrations`, `industries` och
`provenance`. Anvand `/companies/by-id/{company_id}` for otvetydiga lankar.
Det gamla numrerade uppslaget accepterar 10/12 siffror men ger 409 vid tvetydighet.
Webbens foretagslankar anvander `id:<company_id>` i den befintliga detaljrouten.

Analyslagret ar vyer, inte veckovisa kopior av miljoner rader. Fysiska facts,
datumdimensioner och materialiserade aggregat kan laggas till nar en faktisk
analysfraga motiverar kostnaden. Oanvanda enrichment/job-tabeller ar borttagna
fran den nya modellen.

Raw ar JSON, inte JSONB, eftersom PostgreSQL JSON kan bevara escaped NUL fran
kallan. NUL rensas endast i normaliserad text och loggas i
`meta.data_quality_issue`. Originalfilens bytes bevaras inte i tabellen: behall ZIP
for byte-exakt aterlasning. Ingen automatisk gallring av raw eller historik sker.
Raw vaxer per leverans och blir normalt det storsta lagret. Planera retention
eller separat filarkivering innan veckovisa helimporter kors over lang tid.

Bolagsverkets fyra aggregerade statistikfiler har egna raw-partitioner och en
gemensam SCD2-historik i `src_bolagsverket`. Typade aktuella vyer finns i `app`.
Endast vyer med ett eget analyskorn, som företagsform och företrädarroll, ligger
i `mart`; rena genomgångsalias är borttagna. Statistiken kopplas inte till
enskilda bolag.
Datakorn, naturliga nycklar, bortfallsskydd och driftkommandon dokumenteras i
`docs/bolagsverket-statistik.md`.

`app.overview_cache` ar harledd och kan byggas om. Varje rad har separat
`generated_at` och `expires_at`; utgangna svar serveras inte. Lyckade importer
invaliderar cachen och forvarmer Sveriges oversikt samt geografiska index.

## Verifiering

Integrationstesterna skapar och tar bort egna databaser pa en separat testinstans.
De anvander aldrig `DATABASE_URL`. Satt inte TEST_DATABASE_URL till produktion.

```powershell
python -m pip install pytest
$env:TEST_DATABASE_URL = 'postgresql://postgres@localhost:55439/postgres'
python -m pytest tests/test_ingestion.py -q
python -m tests.benchmark_import --records 20000
```

En fullstandig lasning/normalisering av de lokala bulkfilerna utan databasskrivning:

```powershell
python -m tests.validate_bulk_files
```

Mata hastighet pa den faktiska servern innan batchstorleken hojas. 20 000 ar
standard; importer fran olika kallor serialiserar endast databasens merge-batch
for att skydda identiteter och en enda oppen SCD2-version. Filhantering sker
strommande och oberoende av tabellernas storlek.
