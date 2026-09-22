# Sökprestanda 2026-09-11

Mätningen kördes med `EXPLAIN (ANALYZE, BUFFERS)` mot 3 535 314 aktuella
företagsrader. Kör om med:

```powershell
.\.venv\Scripts\python.exe -m worker.tools.profile_company_search
```

| Fall | Exekvering | Lästa block | Plan/index |
| --- | ---: | ---: | --- |
| Kort prefix (`ant%`) | 115,7 ms | 3 005 | `company_current_name_prefix` |
| Alias-prefix (`viu%`) | 12,3 ms | 65 | `organization_name_prefix` |
| Postort (`Stockholm`) | 46,7 ms | 2 727 | Tidig `LIMIT`, inget index valt |
| Företagsålder 1–10 år | 2,7 ms | 53 | `company_current_registration_date` |
| Kombinerade filter | 926,5 ms | 32 961 | `company_geography` |

Åldersfiltret tog före åtgärd 3 628,4 ms och läste 150 664 block eftersom
`EXTRACT(YEAR FROM age(...))` gjorde villkoret icke-indexerbart. Det ersattes med
exakta datumgränser i tidszonen `Europe/Stockholm` och ett partiellt uttrycksindex.

Inget extra index lades till för postort eller kombinerade filter. De valda
frågorna är begränsade och inom nuvarande sexsekundersbudget; ett kompositindex
för en enskild filterkombination bör först motiveras av den nya användningsdatan.
