from __future__ import annotations

SCB_COMPANY_STATUS = {
    "0": "Har aldrig varit verksam",
    "1": "Är verksam enligt företagsregistrets kriterier",
    "9": "Ej verksam, enligt företagsregistrets kriterier",
}

SCB_LEGAL_UNIT_STATUS = {
    "1": (
        "Ingår i populationen och är registrerad i Skatteverkets "
        "organisationsnummerregister"
    ),
    "2": "Ingår i populationen och är registrerad på annat sätt",
    "9": "Ingår inte längre i populationen",
}

SCB_ADVERTISING_STATUS = {
    "1": "Företag har inte frånsagt sig mottagande av reklam",
    "2": "Företag har frånsagt sig mottagande av reklam",
}

SCB_LEGAL_FORM = {
    "10": "Fysiska personer",
    "21": "Enkla bolag",
    "22": "Partrederier",
    "23": "Värdepappersfonder",
    "31": "Handelsbolag, kommanditbolag",
    "32": "Gruvbolag",
    "41": "Bankaktiebolag",
    "42": "Försäkringsaktiebolag",
    "43": "Europabolag",
    "49": "Övriga aktiebolag",
    "51": "Ekonomiska föreningar",
    "53": "Bostadsrättsföreningar",
    "54": "Kooperativa hyresrättsföreningar",
    "55": "Europakooperativ, grupperingar",
    "61": "Ideella föreningar",
    "62": "Samfälligheter",
    "63": "Registrerade trossamfund",
    "71": "Familjestiftelser",
    "72": "Övriga stiftelser och fonder",
    "81": "Statliga enheter",
    "82": "Kommuner",
    "83": "Kommunalförbund",
    "84": "Regioner",
    "85": "Allmänna försäkringskassor",
    "87": "Offentliga korporationer och anstalter",
    "88": "Hypoteksföreningar",
    "89": "Regionala statliga myndigheter",
    "91": "Oskiftade dödsbon",
    "92": "Ömsesidiga försäkringsbolag",
    "93": "Sparbanker",
    "94": "Understödsföreningar, försäkringsföreningar",
    "95": "Arbetslöshetskassor",
    "96": "Utländska juridiska personer",
    "98": "Övriga svenska juridiska personer bildade enligt särskild lagstiftning",
    "99": "Juridisk form ej utredd",
}

BOLAGSVERKET_IDENTITY_TYPE = {
    "ORGNR-IDORG": "Organisationsnummer",
    "PERSON-IDORG": "Identitetsbeteckning person",
}

BOLAGSVERKET_COUNTRY = {
    "SE-LAND": "Sverige",
}

BOLAGSVERKET_ORGANIZATION_FORM = {
    "AB-ORGFO": "Aktiebolag",
    "BAB-ORGFO": "Bankaktiebolag",
    "BF-ORGFO": "Bostadsförening",
    "BFL-ORGFO": "Utländsk banks filial",
    "BRF-ORGFO": "Bostadsrättsförening",
    "E-ORGFO": "Enskild näringsverksamhet",
    "EB-ORGFO": "Enkla bolag",
    "EEIG-ORGFO": "Europeisk ekonomisk intressegruppering",
    "EGTS-ORGFO": "Europeisk gruppering för territoriellt samarbete",
    "EK-ORGFO": "Ekonomisk förening",
    "FAB-ORGFO": "Försäkringsaktiebolag",
    "FF-ORGFO": "Försäkringsförmedlare",
    "FL-ORGFO": "Filial",
    "FOF-ORGFO": "Försäkringsförening",
    "HB-ORGFO": "Handelsbolag",
    "I-ORGFO": "Ideell förening som bedriver näringsverksamhet",
    "KB-ORGFO": "Kommanditbolag",
    "KHF-ORGFO": "Kooperativ hyresrättsförening",
    "MB-ORGFO": "Medlemsbank",
    "OFB-ORGFO": "Ömsesidigt försäkringsbolag",
    "OTPB-ORGFO": "Ömsesidigt tjänstepensionsbolag",
    "S-ORGFO": "Stiftelse som bedriver näringsverksamhet",
    "SB-ORGFO": "Sparbank",
    "SCE-ORGFO": "Europakooperativ",
    "SE-ORGFO": "Europabolag",
    "SF-ORGFO": "Sambruksförening",
    "TPAB-ORGFO": "Tjänstepensionsaktiebolag",
    "TPF-ORGFO": "Tjänstepensionsförening",
    "TSF-ORGFO": "Trossamfund som bedriver näringsverksamhet",
}

BOLAGSVERKET_DEREGISTRATION_REASON = {
    "AKEJH-AVORG": "Aktiekapitalet inte höjts",
    "ARSEED-AVORG": "Årsredovisning saknas",
    "AVREG-AVORG": "Avregistrerad",
    "BABAKEJH-AVORG": "Ombildat till bankaktiebolag eller aktiekapitalet inte höjts",
    "DELAV-AVORG": "Delning",
    "DOM-AVORG": "Beslut av instans",
    "FUAV-AVORG": "Fusion",
    "GROMAV-AVORG": "Gränsöverskridande ombildning",
    "KKAV-AVORG": "Konkurs",
    "LIAV-AVORG": "Likvidation",
    "NYINN-AVORG": "Ny innehavare",
    "OMAV-AVORG": "Ombildning",
    "OMBAB-AVORG": "Ombildat till bankaktiebolag",
    "OVERK-AVORG": "Overksamhet",
    "UTLKKLI-AVORG": "Det utländska företagets likvidation eller konkurs",
    "VDSAK-AVORG": "Verkställande direktör saknas",
    "VERKUPP-AVORG": "Verksamheten har upphört",
}

BOLAGSVERKET_RESTRUCTURING_PROCEDURE = {
    "AC-AVOMFO": "Ackordsförhandling",
    "DEOL-AVOMFO": "Överlåtande vid delning",
    "DEOT-AVOMFO": "Övertagande vid delning",
    "FR-AVOMFO": "Företagsrekonstruktion",
    "FUOL-AVOMFO": "Överlåtande i fusion",
    "FUOT-AVOMFO": "Övertagande i fusion",
    "GROM-AVOMFO": "Gränsöverskridande ombildning",
    "KK-AVOMFO": "Konkurs",
    "LI-AVOMFO": "Likvidation",
    "OM-AVOMFO": "Ombildning",
    "RES-AVOMFO": "Resolution",
}

BOLAGSVERKET_ORGANIZATION_NAME_TYPE = {
    "FORETAGSNAMN-ORGNAM": "Företagsnamn",
    "NAMN-ORGNAM": "Namn",
    "FORNAMN_FRSPRAK-ORGNAM": "Företagsnamn på främmande språk",
    "SARS_FORNAMN-ORGNAM": "Särskilt företagsnamn",
}
