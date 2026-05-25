export type FilterOption = { value: string; label: string };

export const SECTION_OPTIONS: FilterOption[] = [
  { value: "A", label: "Jordbruk, skogsbruk och fiske" },
  { value: "B", label: "Utvinning av mineral" },
  { value: "C", label: "Tillverkning" },
  { value: "D", label: "Försörjning av el, gas, värme och kyla" },
  { value: "E", label: "Vattenförsörjning; avloppsrening, avfallshantering och sanering" },
  { value: "F", label: "Byggverksamhet" },
  { value: "G", label: "Handel" },
  { value: "H", label: "Transport och magasinering" },
  { value: "I", label: "Hotell- och restaurangverksamhet" },
  { value: "J", label: "Förlagsverksamhet, Radio- och TV-sändning samt produktion och distribution av medieinnehåll" },
  { value: "K", label: "Telekommunikation, dataprogrammering, datakonsultverksamhet, datainfrastruktur och annan informationsverksamhet" },
  { value: "L", label: "Finansiell verksamhet och försäkringsverksamhet" },
  { value: "M", label: "Fastighetsverksamhet" },
  { value: "N", label: "Verksamhet inom juridik, ekonomi, vetenskap och teknik" },
  { value: "O", label: "Uthyrning, fastighetsservice, resetjänster och annan stödverksamhet" },
  { value: "P", label: "Offentlig förvaltning och försvar; obligatorisk socialförsäkring" },
  { value: "Q", label: "Utbildning" },
  { value: "R", label: "Vård och omsorg; social verksamhet" },
  { value: "S", label: "Kultur, idrott och fritid" },
  { value: "T", label: "Annan serviceverksamhet" },
  { value: "U", label: "Förvärvsarbete i hushåll; hushållens produktion av diverse varor och tjänster för eget bruk" },
  { value: "V", label: "Verksamhet vid internationella organisationer, utländska ambassader o.d." },
];

export const INDUSTRY_DETAIL_OPTIONS: FilterOption[] = [
  {
    "value": "00000",
    "label": "Okänd"
  },
  {
    "value": "01110",
    "label": "Odling av spannmål (utom ris), baljväxter och oljeväxter"
  },
  {
    "value": "01120",
    "label": "Odling av ris"
  },
  {
    "value": "01131",
    "label": "Potatisodling"
  },
  {
    "value": "01132",
    "label": "Sockerbetsodling"
  },
  {
    "value": "01133",
    "label": "Odling av grönsaker (köksväxter) på friland"
  },
  {
    "value": "01134",
    "label": "Odling av grönsaker (köksväxter) i växthus"
  },
  {
    "value": "01135",
    "label": "Svampodling m.m."
  },
  {
    "value": "01140",
    "label": "Odling av sockerrör"
  },
  {
    "value": "01150",
    "label": "Odling av tobak"
  },
  {
    "value": "01160",
    "label": "Odling av fiberväxter"
  },
  {
    "value": "01191",
    "label": "Odling av prydnadsväxter i växthus"
  },
  {
    "value": "01199",
    "label": "Odling av övriga ett- och tvååriga växter"
  },
  {
    "value": "01210",
    "label": "Odling av druvor"
  },
  {
    "value": "01220",
    "label": "Odling av tropiska och subtropiska frukter"
  },
  {
    "value": "01230",
    "label": "Odling av citrusfrukter"
  },
  {
    "value": "01240",
    "label": "Odling av kärnfrukter och stenfrukter"
  },
  {
    "value": "01250",
    "label": "Odling av andra frukter, bär samt nötter"
  },
  {
    "value": "01260",
    "label": "Odling av oljehaltiga frukter"
  },
  {
    "value": "01270",
    "label": "Odling av växter för dryckesframställning"
  },
  {
    "value": "01280",
    "label": "Odling av kryddväxter, drog- och medicinalväxter"
  },
  {
    "value": "01290",
    "label": "Odling av andra fleråriga växter"
  },
  {
    "value": "01301",
    "label": "Odling av plantskoleväxter i växthus"
  },
  {
    "value": "01302",
    "label": "Odling av plantskoleväxter m.m. på friland"
  },
  {
    "value": "01410",
    "label": "Mjölkproduktion och uppfödning av nötkreatur av mjölkras"
  },
  {
    "value": "01420",
    "label": "Uppfödning av andra nötkreatur och bufflar"
  },
  {
    "value": "01430",
    "label": "Uppfödning av hästar och andra hästdjur"
  },
  {
    "value": "01440",
    "label": "Uppfödning av kameler och kameldjur"
  },
  {
    "value": "01450",
    "label": "Uppfödning av får och getter"
  },
  {
    "value": "01461",
    "label": "Uppfödning av smågrisar"
  },
  {
    "value": "01462",
    "label": "Uppfödning av slaktsvin"
  },
  {
    "value": "01471",
    "label": "Äggproduktion (för försäljning)"
  },
  {
    "value": "01472",
    "label": "Uppfödning av fjäderfä, ej äggproduktion"
  },
  {
    "value": "01481",
    "label": "Renskötsel"
  },
  {
    "value": "01482",
    "label": "Uppfödning av sällskapsdjur"
  },
  {
    "value": "01489",
    "label": "Övrig uppfödning av andra djur"
  },
  {
    "value": "01500",
    "label": "Blandat jordbruk"
  },
  {
    "value": "01610",
    "label": "Stödverksamhet avseende växtodling"
  },
  {
    "value": "01620",
    "label": "Stödverksamhet avseende husdjursskötsel"
  },
  {
    "value": "01630",
    "label": "Bearbetning av skördade växter och utsäde"
  },
  {
    "value": "01700",
    "label": "Jakt och stödverksamhet i anslutning härtill"
  },
  {
    "value": "02101",
    "label": "Skogsförvaltning"
  },
  {
    "value": "02102",
    "label": "Skogsskötsel"
  },
  {
    "value": "02109",
    "label": "Övrig skoglig verksamhet"
  },
  {
    "value": "02200",
    "label": "Drivning"
  },
  {
    "value": "02300",
    "label": "Insamling av annat vilt växande skogsmaterial än trä"
  },
  {
    "value": "02400",
    "label": "Stödverksamhet avseende skogsbruk"
  },
  {
    "value": "03111",
    "label": "Trålfiske i saltvatten"
  },
  {
    "value": "03119",
    "label": "Övrigt saltvattensfiske"
  },
  {
    "value": "03120",
    "label": "Sötvattensfiske"
  },
  {
    "value": "03210",
    "label": "Vattenbruk i saltvatten"
  },
  {
    "value": "03220",
    "label": "Vattenbruk i sötvatten"
  },
  {
    "value": "03300",
    "label": "Stödverksamhet avseende fiske och vattenbruk"
  },
  {
    "value": "05100",
    "label": "Stenkolsutvinning"
  },
  {
    "value": "05200",
    "label": "Brunkolsutvinning"
  },
  {
    "value": "06100",
    "label": "Utvinning av råpetroleum"
  },
  {
    "value": "06200",
    "label": "Utvinning av naturgas"
  },
  {
    "value": "07100",
    "label": "Järnmalmsutvinning"
  },
  {
    "value": "07210",
    "label": "Utvinning av uran- och toriummalm"
  },
  {
    "value": "07290",
    "label": "Utvinning av annan malm"
  },
  {
    "value": "08110",
    "label": "Brytning av natursten, kalk- och gipssten, skiffer eller annan sten"
  },
  {
    "value": "08120",
    "label": "Utvinning av sand, grus och berg samt utvinning av lera och kaolin"
  },
  {
    "value": "08910",
    "label": "Utvinning av kemiska mineral"
  },
  {
    "value": "08920",
    "label": "Torvutvinning"
  },
  {
    "value": "08930",
    "label": "Saltutvinning"
  },
  {
    "value": "08990",
    "label": "Diverse övrig utvinning av mineral"
  },
  {
    "value": "09100",
    "label": "Stödverksamhet avseende råpetroleum- och naturgasutvinning"
  },
  {
    "value": "09900",
    "label": "Stödverksamhet avseende annan utvinning"
  },
  {
    "value": "10111",
    "label": "Kreatursslakt"
  },
  {
    "value": "10112",
    "label": "Styckning av kött"
  },
  {
    "value": "10120",
    "label": "Beredning och hållbarhetsbehandling av fjäderfäkött"
  },
  {
    "value": "10130",
    "label": "Charkuteri- och annan köttvarutillverkning"
  },
  {
    "value": "10200",
    "label": "Beredning och hållbarhetsbehandling av fisk samt skal- och blötdjur"
  },
  {
    "value": "10310",
    "label": "Beredning och hållbarhetsbehandling av potatis"
  },
  {
    "value": "10320",
    "label": "Juice- och safttillverkning"
  },
  {
    "value": "10390",
    "label": "Annan beredning och hållbarhetsbehandling av frukt, bär och grönsaker"
  },
  {
    "value": "10410",
    "label": "Framställning av vegetabiliska och animaliska oljor och fetter"
  },
  {
    "value": "10420",
    "label": "Matfettstillverkning"
  },
  {
    "value": "10511",
    "label": "Osttillverkning"
  },
  {
    "value": "10519",
    "label": "Annan mejerivarutillverkning"
  },
  {
    "value": "10520",
    "label": "Tillverkning av glassvaror"
  },
  {
    "value": "10611",
    "label": "Mjöltillverkning"
  },
  {
    "value": "10612",
    "label": "Tillverkning av frukostflingor, mixer och andra livsmedelsberedningar av kvarnprodukter"
  },
  {
    "value": "10620",
    "label": "Stärkelsetillverkning"
  },
  {
    "value": "10710",
    "label": "Tillverkning av mjukt matbröd och färska bakverk"
  },
  {
    "value": "10721",
    "label": "Knäckebrödstillverkning"
  },
  {
    "value": "10722",
    "label": "Tillverkning av kex och konserverade bakverk"
  },
  {
    "value": "10730",
    "label": "Tillverkning av mjölprodukter"
  },
  {
    "value": "10810",
    "label": "Sockertillverkning"
  },
  {
    "value": "10820",
    "label": "Tillverkning av kakao, choklad- och sockerkonfektyrer"
  },
  {
    "value": "10830",
    "label": "Framställning av te och kaffe"
  },
  {
    "value": "10840",
    "label": "Tillverkning av kryddor och andra smaksättare"
  },
  {
    "value": "10850",
    "label": "Tillverkning av lagad mat och färdigrätter"
  },
  {
    "value": "10860",
    "label": "Tillverkning av homogeniserade livsmedelsberedningar inklusive dietmat"
  },
  {
    "value": "10890",
    "label": "Framställning av diverse övriga livsmedel"
  },
  {
    "value": "10910",
    "label": "Framställning av beredda fodermedel"
  },
  {
    "value": "10920",
    "label": "Framställning av mat till sällskapsdjur"
  },
  {
    "value": "11010",
    "label": "Destillering, rening och tillblandning av spritdrycker"
  },
  {
    "value": "11020",
    "label": "Framställning av vin från druvor"
  },
  {
    "value": "11030",
    "label": "Framställning av cider och andra jästa drycker av frukt"
  },
  {
    "value": "11040",
    "label": "Framställning av andra icke-destillerade jästa drycker"
  },
  {
    "value": "11050",
    "label": "Framställning av öl"
  },
  {
    "value": "11060",
    "label": "Framställning av malt"
  },
  {
    "value": "11070",
    "label": "Framställning av läskedrycker, mineralvatten och annat vatten på flaska"
  },
  {
    "value": "12000",
    "label": "Tobaksvarutillverkning"
  },
  {
    "value": "13100",
    "label": "Garntillverkning"
  },
  {
    "value": "13200",
    "label": "Vävnadstillverkning"
  },
  {
    "value": "13300",
    "label": "Blekning, färgning och annan textilberedning"
  },
  {
    "value": "13910",
    "label": "Tillverkning av trikåväv"
  },
  {
    "value": "13920",
    "label": "Tillverkning av hushållstextilier och andra sydda inredningsartiklar"
  },
  {
    "value": "13930",
    "label": "Tillverkning av mattor"
  },
  {
    "value": "13940",
    "label": "Tågvirkes- och bindgarnstillverkning"
  },
  {
    "value": "13950",
    "label": "Tillverkning av bondad duk och varor av bondad duk"
  },
  {
    "value": "13960",
    "label": "Tillverkning av andra tekniska textilier och industritextilier"
  },
  {
    "value": "13990",
    "label": "Övrig textilietillverkning"
  },
  {
    "value": "14100",
    "label": "Tillverkning av trikåvaror"
  },
  {
    "value": "14210",
    "label": "Tillverkning av gång- och ytterkläder"
  },
  {
    "value": "14220",
    "label": "Tillverkning av underkläder, skjortor och blusar"
  },
  {
    "value": "14230",
    "label": "Tillverkning av arbets-, skydds- och överdragskläder"
  },
  {
    "value": "14240",
    "label": "Tillverkning av läder- och skinnkläder samt pälsvaror"
  },
  {
    "value": "14290",
    "label": "Tillverkning av diverse övriga beklädnadsvaror och tillbehör"
  },
  {
    "value": "15110",
    "label": "Garvning och annan beredning av läder-, skinn- och pälsvaror"
  },
  {
    "value": "15120",
    "label": "Tillverkning av reseffekter, handväskor, sadel- och seldon oavsett material"
  },
  {
    "value": "15200",
    "label": "Tillverkning av skodon"
  },
  {
    "value": "16111",
    "label": "Sågning av trä"
  },
  {
    "value": "16112",
    "label": "Hyvling av trä"
  },
  {
    "value": "16120",
    "label": "Bearbetning och slutbehandling av trä"
  },
  {
    "value": "16210",
    "label": "Tillverkning av fanér och träbaserade skivor"
  },
  {
    "value": "16220",
    "label": "Tillverkning av sammansatta parkettgolv"
  },
  {
    "value": "16231",
    "label": "Tillverkning av monteringsfärdiga trähus"
  },
  {
    "value": "16239",
    "label": "Tillverkning av övriga byggnads- och inredningssnickerier"
  },
  {
    "value": "16240",
    "label": "Träförpackningstillverkning"
  },
  {
    "value": "16250",
    "label": "Tillverkning av dörrar och fönster av trä"
  },
  {
    "value": "16260",
    "label": "Tillverkning av fasta bränslen av vegetabilisk biomassa"
  },
  {
    "value": "16270",
    "label": "Slutbehandling av varor av trä"
  },
  {
    "value": "16281",
    "label": "Övrig trävarutillverkning"
  },
  {
    "value": "16282",
    "label": "Tillverkning av varor av kork, halm, rotting o.d."
  },
  {
    "value": "17110",
    "label": "Massatillverkning"
  },
  {
    "value": "17121",
    "label": "Tillverkning av tidnings- och journalpapper samt tryckpapper"
  },
  {
    "value": "17122",
    "label": "Tillverkning av kraftpapper och kraftpapp"
  },
  {
    "value": "17129",
    "label": "Övrig tillverkning av papper och papp"
  },
  {
    "value": "17211",
    "label": "Tillverkning av wellpapp och wellpappförpackningar"
  },
  {
    "value": "17219",
    "label": "Övrig tillverkning av pappers- och pappförpackningar"
  },
  {
    "value": "17220",
    "label": "Tillverkning av hushålls- och hygienartiklar av papper"
  },
  {
    "value": "17230",
    "label": "Tillverkning av skrivpapper, kuvert o.d."
  },
  {
    "value": "17240",
    "label": "Tapettillverkning"
  },
  {
    "value": "17250",
    "label": "Tillverkning av andra pappers- och pappvaror"
  },
  {
    "value": "18110",
    "label": "Tryckning av dagstidningar"
  },
  {
    "value": "18121",
    "label": "Tryckning av tidskrifter"
  },
  {
    "value": "18122",
    "label": "Tryckning av böcker och övriga trycksaker"
  },
  {
    "value": "18130",
    "label": "Grafiska tjänster före tryckning (prepress/premedia)"
  },
  {
    "value": "18140",
    "label": "Bokbindning och annan verksamhet avseende tryckning"
  },
  {
    "value": "18200",
    "label": "Reproduktion av inspelningar"
  },
  {
    "value": "19100",
    "label": "Tillverkning av stenkolsprodukter"
  },
  {
    "value": "19200",
    "label": "Tillverkning av raffinerade petroleumprodukter och fossila bränsleprodukter"
  },
  {
    "value": "20110",
    "label": "Industrigasframställning"
  },
  {
    "value": "20120",
    "label": "Tillverkning av färgämnen"
  },
  {
    "value": "20130",
    "label": "Tillverkning av andra oorganiska baskemikalier"
  },
  {
    "value": "20140",
    "label": "Tillverkning av andra organiska baskemikalier"
  },
  {
    "value": "20150",
    "label": "Tillverkning av gödselmedel och kväveprodukter"
  },
  {
    "value": "20160",
    "label": "Basplastframställning"
  },
  {
    "value": "20170",
    "label": "Tillverkning av syntetiskt basgummi"
  },
  {
    "value": "20200",
    "label": "Tillverkning av bekämpningsmedel, desinfektionsmedel och andra lantbrukskemiska produkter"
  },
  {
    "value": "20300",
    "label": "Tillverkning av färg, lack, tryckfärg m.m."
  },
  {
    "value": "20410",
    "label": "Tillverkning av tvål, såpa, tvättmedel och polermedel"
  },
  {
    "value": "20420",
    "label": "Tillverkning av parfym och toalettartiklar"
  },
  {
    "value": "20510",
    "label": "Tillverkning av flytande biobränslen"
  },
  {
    "value": "20591",
    "label": "Sprängämnestillverkning"
  },
  {
    "value": "20592",
    "label": "Tillverkning av lim"
  },
  {
    "value": "20593",
    "label": "Tillverkning av eteriska oljor"
  },
  {
    "value": "20599",
    "label": "Tillverkning av övriga kemiska produkter"
  },
  {
    "value": "20600",
    "label": "Konstfibertillverkning"
  },
  {
    "value": "21100",
    "label": "Tillverkning av farmaceutiska basprodukter"
  },
  {
    "value": "21200",
    "label": "Tillverkning av läkemedel"
  },
  {
    "value": "22110",
    "label": "Tillverkning och regummering av däck, tillverkning av slangar"
  },
  {
    "value": "22120",
    "label": "Annan gummivarutillverkning"
  },
  {
    "value": "22210",
    "label": "Tillverkning av plasthalvfabrikat"
  },
  {
    "value": "22220",
    "label": "Plastförpackningstillverkning"
  },
  {
    "value": "22230",
    "label": "Tillverkning av dörrar och fönster av plast"
  },
  {
    "value": "22240",
    "label": "Byggplastvarutillverkning"
  },
  {
    "value": "22250",
    "label": "Bearbetning och slutbehandling av plastvaror"
  },
  {
    "value": "22260",
    "label": "Annan plastvarutillverkning"
  },
  {
    "value": "23110",
    "label": "Tillverkning av planglas"
  },
  {
    "value": "23120",
    "label": "Bearbetning av planglas"
  },
  {
    "value": "23130",
    "label": "Tillverkning av buteljer, glasförpackningar och husgeråd av glas"
  },
  {
    "value": "23140",
    "label": "Tillverkning av glasfiber"
  },
  {
    "value": "23150",
    "label": "Tillverkning av andra glasvaror inklusive tekniska glasvaror"
  },
  {
    "value": "23200",
    "label": "Tillverkning av eldfasta produkter"
  },
  {
    "value": "23310",
    "label": "Tillverkning av keramiska golv- och väggplattor"
  },
  {
    "value": "23320",
    "label": "Tillverkning av murtegel, takpannor och andra byggvaror av tegel"
  },
  {
    "value": "23410",
    "label": "Tillverkning av keramiska hushålls- och prydnadsartiklar"
  },
  {
    "value": "23420",
    "label": "Tillverkning av keramiska sanitetsartiklar"
  },
  {
    "value": "23430",
    "label": "Tillverkning av keramiska isolatorer o.d."
  },
  {
    "value": "23440",
    "label": "Tillverkning av andra tekniska keramiska produkter"
  },
  {
    "value": "23450",
    "label": "Tillverkning av andra keramiska produkter"
  },
  {
    "value": "23510",
    "label": "Tillverkning av cement"
  },
  {
    "value": "23520",
    "label": "Tillverkning av kalk och gips"
  },
  {
    "value": "23610",
    "label": "Tillverkning av betongvaror för byggändamål"
  },
  {
    "value": "23620",
    "label": "Tillverkning av gipsvaror för byggändamål"
  },
  {
    "value": "23630",
    "label": "Tillverkning av fabriksblandad betong"
  },
  {
    "value": "23640",
    "label": "Tillverkning av murbruk"
  },
  {
    "value": "23650",
    "label": "Tillverkning av fibercementvaror"
  },
  {
    "value": "23660",
    "label": "Tillverkning av andra varor av betong, cement och gips"
  },
  {
    "value": "23701",
    "label": "Huggning, formning och slutlig bearbetning av sten för byggnadsändamål"
  },
  {
    "value": "23709",
    "label": "Huggning, formning och slutlig bearbetning av sten för prydnadsändamål"
  },
  {
    "value": "23910",
    "label": "Tillverkning av slipmedel"
  },
  {
    "value": "23991",
    "label": "Tillverkning av varor av sten- och mineralull"
  },
  {
    "value": "23999",
    "label": "Diverse övrig tillverkning av icke-metalliska mineraliska produkter"
  },
  {
    "value": "24100",
    "label": "Framställning av järn och stål samt ferrolegeringar"
  },
  {
    "value": "24200",
    "label": "Tillverkning av rör, ledningar, ihåliga profiler och tillbehör av stål"
  },
  {
    "value": "24310",
    "label": "Tillverkning av kalldragen stålstång"
  },
  {
    "value": "24320",
    "label": "Tillverkning av kallvalsade stålband"
  },
  {
    "value": "24330",
    "label": "Tillverkning av andra kallformade produkter av stål"
  },
  {
    "value": "24340",
    "label": "Tillverkning av kalldragen ståltråd"
  },
  {
    "value": "24410",
    "label": "Framställning av ädla metaller"
  },
  {
    "value": "24420",
    "label": "Framställning av aluminium"
  },
  {
    "value": "24430",
    "label": "Framställning av bly, zink och tenn"
  },
  {
    "value": "24440",
    "label": "Framställning av koppar"
  },
  {
    "value": "24450",
    "label": "Framställning av andra metaller"
  },
  {
    "value": "24460",
    "label": "Tillverkning av kärnbränsle"
  },
  {
    "value": "24510",
    "label": "Gjutning av järn"
  },
  {
    "value": "24520",
    "label": "Gjutning av stål"
  },
  {
    "value": "24530",
    "label": "Gjutning av lättmetall"
  },
  {
    "value": "24540",
    "label": "Gjutning av andra metaller"
  },
  {
    "value": "25110",
    "label": "Tillverkning av metallstommar och delar därav"
  },
  {
    "value": "25120",
    "label": "Tillverkning av dörrar och fönster av metall"
  },
  {
    "value": "25210",
    "label": "Tillverkning av radiatorer, ånggeneratorer och pannor för centraluppvärmning"
  },
  {
    "value": "25220",
    "label": "Tillverkning av andra cisterner, tankar, kar och andra behållare av metall"
  },
  {
    "value": "25300",
    "label": "Tillverkning av vapen och ammunition"
  },
  {
    "value": "25400",
    "label": "Smidning och formning av metall och pulvermetallurgi"
  },
  {
    "value": "25510",
    "label": "Beläggning och överdragning av metall"
  },
  {
    "value": "25520",
    "label": "Värmebehandling av metall"
  },
  {
    "value": "25530",
    "label": "Metallegoarbeten"
  },
  {
    "value": "25610",
    "label": "Tillverkning av bestick"
  },
  {
    "value": "25620",
    "label": "Tillverkning av lås och gångjärn"
  },
  {
    "value": "25630",
    "label": "Tillverkning av verktyg och redskap"
  },
  {
    "value": "25910",
    "label": "Tillverkning av stålfat o.d. behållare"
  },
  {
    "value": "25920",
    "label": "Tillverkning av lättmetallförpackningar"
  },
  {
    "value": "25930",
    "label": "Tillverkning av metalltrådvaror, kedjor och fjädrar"
  },
  {
    "value": "25940",
    "label": "Tillverkning av nitar och skruvar"
  },
  {
    "value": "25991",
    "label": "Tillverkning av diskbänkar, sanitetsgods m.m. av metall för byggändamål"
  },
  {
    "value": "25999",
    "label": "Annan övrig metallvarutillverkning"
  },
  {
    "value": "26110",
    "label": "Tillverkning av elektroniska komponenter"
  },
  {
    "value": "26120",
    "label": "Tillverkning av kretskort"
  },
  {
    "value": "26200",
    "label": "Tillverkning av datorer och kringutrustning"
  },
  {
    "value": "26300",
    "label": "Tillverkning av kommunikationsutrustning"
  },
  {
    "value": "26400",
    "label": "Tillverkning av hemelektronik"
  },
  {
    "value": "26510",
    "label": "Tillverkning av instrument och apparater för mätning, provning och navigering"
  },
  {
    "value": "26520",
    "label": "Urtillverkning"
  },
  {
    "value": "26600",
    "label": "Tillverkning av strålningsutrustning samt elektromedicinsk och elektroterapeutisk utrustning"
  },
  {
    "value": "26700",
    "label": "Tillverkning av optiska instrument, magnetiska och optiska medier samt fotoutrustning"
  },
  {
    "value": "27110",
    "label": "Tillverkning av elmotorer, generatorer och transformatorer"
  },
  {
    "value": "27120",
    "label": "Tillverkning av eldistributions- och elkontrollapparater"
  },
  {
    "value": "27200",
    "label": "Batteri- och ackumulatortillverkning"
  },
  {
    "value": "27310",
    "label": "Tillverkning av optiska fiberkablar"
  },
  {
    "value": "27320",
    "label": "Tillverkning av andra elektroniska och elektriska ledningar och kablar"
  },
  {
    "value": "27330",
    "label": "Tillverkning av kabeltillbehör"
  },
  {
    "value": "27400",
    "label": "Tillverkning av belysningsarmatur"
  },
  {
    "value": "27510",
    "label": "Tillverkning av elektriska hushållsmaskiner och hushållsapparater"
  },
  {
    "value": "27520",
    "label": "Tillverkning av icke-elektriska hushållsmaskiner och hushållsapparater"
  },
  {
    "value": "27900",
    "label": "Tillverkning av annan elapparatur"
  },
  {
    "value": "28110",
    "label": "Tillverkning av motorer och turbiner utom för luftfartyg och fordon"
  },
  {
    "value": "28120",
    "label": "Tillverkning av fluidteknisk utrustning"
  },
  {
    "value": "28130",
    "label": "Tillverkning av andra pumpar och kompressorer"
  },
  {
    "value": "28140",
    "label": "Tillverkning av andra kranar och ventiler"
  },
  {
    "value": "28150",
    "label": "Tillverkning av lager, kugghjul och andra delar för kraftöverföring"
  },
  {
    "value": "28210",
    "label": "Tillverkning av ugnar och monterad värmeutrustning för bostadsuppvärmning"
  },
  {
    "value": "28220",
    "label": "Tillverkning av lyft- och godshanteringsanordningar"
  },
  {
    "value": "28230",
    "label": "Tillverkning av kontorsmaskiner och kontorsutrustning, utom datorer och kringutrustning"
  },
  {
    "value": "28240",
    "label": "Tillverkning av motordrivna handverktyg"
  },
  {
    "value": "28250",
    "label": "Tillverkning av luftkonditionering, utom för hushåll"
  },
  {
    "value": "28290",
    "label": "Tillverkning av diverse övriga maskiner för allmänt ändamål"
  },
  {
    "value": "28300",
    "label": "Tillverkning av jord- och skogsbruksmaskiner"
  },
  {
    "value": "28410",
    "label": "Tillverkning av maskiner för metallbearbetning och verktygsmaskiner för bearbetning av metall"
  },
  {
    "value": "28420",
    "label": "Tillverkning av andra verktygsmaskiner"
  },
  {
    "value": "28910",
    "label": "Tillverkning av maskiner för metallurgi"
  },
  {
    "value": "28920",
    "label": "Tillverkning av gruv-, bergbrytnings- och byggmaskiner"
  },
  {
    "value": "28930",
    "label": "Tillverkning av maskiner för framställning av livsmedel, drycker och tobaksvaror"
  },
  {
    "value": "28940",
    "label": "Tillverkning av maskiner för produktion av textil-, beklädnads- och lädervaror"
  },
  {
    "value": "28950",
    "label": "Tillverkning av maskiner för produktion av massa, papper och papp"
  },
  {
    "value": "28960",
    "label": "Tillverkning av maskiner för gummi och plast"
  },
  {
    "value": "28970",
    "label": "Tillverkning av maskiner för additiv tillverkning"
  },
  {
    "value": "28990",
    "label": "Tillverkning av diverse övriga specialmaskiner"
  },
  {
    "value": "29101",
    "label": "Tillverkning av personbilar och andra lätta motorfordon"
  },
  {
    "value": "29102",
    "label": "Tillverkning av lastbilar och andra tunga motorfordon"
  },
  {
    "value": "29200",
    "label": "Tillverkning av karosserier för motorfordon; tillverkning av släpfordon och påhängsvagnar"
  },
  {
    "value": "29310",
    "label": "Tillverkning av elektrisk och elektronisk utrustning för motorfordon"
  },
  {
    "value": "29320",
    "label": "Tillverkning av andra delar och tillbehör till motorfordon"
  },
  {
    "value": "30110",
    "label": "Byggande av civila fartyg och flytande materiel"
  },
  {
    "value": "30120",
    "label": "Byggande av fritidsbåtar"
  },
  {
    "value": "30130",
    "label": "Byggande av militära skepp och fartyg"
  },
  {
    "value": "30200",
    "label": "Tillverkning av rälsfordon"
  },
  {
    "value": "30310",
    "label": "Tillverkning av civila luftfartyg, rymdfarkoster o.d."
  },
  {
    "value": "30320",
    "label": "Tillverkning av militära luftfartyg, rymdfarkoster o.d."
  },
  {
    "value": "30400",
    "label": "Tillverkning av militära stridsfordon"
  },
  {
    "value": "30910",
    "label": "Tillverkning av motorcyklar"
  },
  {
    "value": "30920",
    "label": "Tillverkning av cyklar, rullstolar o.d."
  },
  {
    "value": "30990",
    "label": "Diverse övrig transportmedelstillverkning"
  },
  {
    "value": "31001",
    "label": "Tillverkning av kontors- och butiksmöbler"
  },
  {
    "value": "31002",
    "label": "Tillverkning av kontors- och butiksinredningar"
  },
  {
    "value": "31003",
    "label": "Tillverkning av köksmöbler"
  },
  {
    "value": "31004",
    "label": "Tillverkning av köksinredningar"
  },
  {
    "value": "31009",
    "label": "Tillverkning av andra möbler och madrasser"
  },
  {
    "value": "32110",
    "label": "Prägling av mynt"
  },
  {
    "value": "32120",
    "label": "Tillverkning av smycken, guld- och silversmedsvaror"
  },
  {
    "value": "32130",
    "label": "Tillverkning av bijouterier o.d."
  },
  {
    "value": "32200",
    "label": "Tillverkning av musikinstrument"
  },
  {
    "value": "32300",
    "label": "Tillverkning av sportartiklar"
  },
  {
    "value": "32400",
    "label": "Tillverkning av spel och leksaker"
  },
  {
    "value": "32501",
    "label": "Tillverkning av medicinska och dentala instrument och tillbehör"
  },
  {
    "value": "32502",
    "label": "Tillverkning av tandproteser"
  },
  {
    "value": "32910",
    "label": "Tillverkning av borstbinderiarbeten"
  },
  {
    "value": "32990",
    "label": "Diverse övrig tillverkning"
  },
  {
    "value": "33110",
    "label": "Reparation och underhåll av metallvaror"
  },
  {
    "value": "33120",
    "label": "Reparation och underhåll av maskiner"
  },
  {
    "value": "33130",
    "label": "Reparation och underhåll av elektronisk och optisk utrustning"
  },
  {
    "value": "33140",
    "label": "Reparation och underhåll av elapparatur"
  },
  {
    "value": "33150",
    "label": "Reparation och underhåll av civila fartyg och båtar"
  },
  {
    "value": "33160",
    "label": "Reparation och underhåll av civila luftfartyg och rymdfarkoster"
  },
  {
    "value": "33170",
    "label": "Reparation och underhåll av andra civila transportmedel"
  },
  {
    "value": "33180",
    "label": "Reparation och underhåll av militära stridsfordon, skepp, båtar, luftfartyg och rymdfarkoster"
  },
  {
    "value": "33190",
    "label": "Reparation och underhåll av annan utrustning"
  },
  {
    "value": "33200",
    "label": "Installation av industrimaskiner och -utrustning"
  },
  {
    "value": "35110",
    "label": "Generering av elektricitet från icke-förnybara energikällor"
  },
  {
    "value": "35120",
    "label": "Generering av elektricitet från förnybara energikällor"
  },
  {
    "value": "35130",
    "label": "Överföring av elektricitet"
  },
  {
    "value": "35140",
    "label": "Distribution av elektricitet"
  },
  {
    "value": "35150",
    "label": "Handel med elektricitet"
  },
  {
    "value": "35160",
    "label": "Lagring av elektricitet"
  },
  {
    "value": "35210",
    "label": "Framställning av gas"
  },
  {
    "value": "35220",
    "label": "Distribution av gasformiga bränslen via rörnät"
  },
  {
    "value": "35230",
    "label": "Handel med gas via rörnät"
  },
  {
    "value": "35240",
    "label": "Lagring av gas som en del i nätförsörjningstjänster"
  },
  {
    "value": "35300",
    "label": "Försörjning av värme och kyla"
  },
  {
    "value": "35400",
    "label": "Mäklare och agenter för el och naturgas"
  },
  {
    "value": "36000",
    "label": "Vattenförsörjning"
  },
  {
    "value": "37000",
    "label": "Avloppsrening"
  },
  {
    "value": "38110",
    "label": "Insamling av icke-farligt avfall"
  },
  {
    "value": "38120",
    "label": "Insamling av farligt avfall"
  },
  {
    "value": "38211",
    "label": "Demontering av uttjänta fordon"
  },
  {
    "value": "38212",
    "label": "Demontering av elektrisk och elektronisk utrustning"
  },
  {
    "value": "38213",
    "label": "Demontering av övrig kasserad utrustning"
  },
  {
    "value": "38214",
    "label": "Återvinning av källsorterat material"
  },
  {
    "value": "38215",
    "label": "Återvinning av farligt avfall"
  },
  {
    "value": "38220",
    "label": "Energiåtervinning"
  },
  {
    "value": "38230",
    "label": "Annan återvinning av avfall"
  },
  {
    "value": "38310",
    "label": "Förbränning utan energiåtervinning"
  },
  {
    "value": "38321",
    "label": "Deponering eller slutförvaring av icke-farligt avfall"
  },
  {
    "value": "38322",
    "label": "Deponering eller slutförvaring av farligt avfall"
  },
  {
    "value": "38330",
    "label": "Annat bortskaffande av avfall"
  },
  {
    "value": "39000",
    "label": "Sanering, efterbehandling av jord och vatten samt annan verksamhet för föroreningsbekämpning"
  },
  {
    "value": "41000",
    "label": "Byggande av bostadshus och andra byggnader"
  },
  {
    "value": "42110",
    "label": "Anläggning av vägar och motorvägar"
  },
  {
    "value": "42120",
    "label": "Anläggning av järnvägar och tunnelbanor"
  },
  {
    "value": "42130",
    "label": "Anläggning av broar och tunnlar"
  },
  {
    "value": "42210",
    "label": "Allmännyttiga anläggningsarbeten för värme, vatten och avlopp"
  },
  {
    "value": "42221",
    "label": "Anläggningsarbeten för el"
  },
  {
    "value": "42222",
    "label": "Anläggningsarbeten för telekommunikation"
  },
  {
    "value": "42910",
    "label": "Vattenbyggnad"
  },
  {
    "value": "42990",
    "label": "Diverse övriga anläggningsarbeten"
  },
  {
    "value": "43110",
    "label": "Rivning av hus och byggnader"
  },
  {
    "value": "43120",
    "label": "Mark- och grundarbeten"
  },
  {
    "value": "43130",
    "label": "Markundersökning"
  },
  {
    "value": "43210",
    "label": "Elinstallationer"
  },
  {
    "value": "43221",
    "label": "Värme- och sanitetsarbeten"
  },
  {
    "value": "43222",
    "label": "Ventilationsarbeten"
  },
  {
    "value": "43223",
    "label": "Kyl- och frysinstallationsarbeten"
  },
  {
    "value": "43229",
    "label": "Övriga VVS-arbeten"
  },
  {
    "value": "43230",
    "label": "Installation av isolering"
  },
  {
    "value": "43240",
    "label": "Andra bygginstallationer"
  },
  {
    "value": "43310",
    "label": "Puts-, fasad- och stuckatörsarbeten"
  },
  {
    "value": "43320",
    "label": "Byggnadssnickeriarbeten"
  },
  {
    "value": "43330",
    "label": "Golv- och väggbeläggningsarbeten"
  },
  {
    "value": "43341",
    "label": "Måleriarbeten"
  },
  {
    "value": "43342",
    "label": "Glasmästeriarbeten"
  },
  {
    "value": "43350",
    "label": "Annan slutbehandling av byggnader"
  },
  {
    "value": "43411",
    "label": "Takarbeten av plåt"
  },
  {
    "value": "43412",
    "label": "Takarbeten av andra material än plåt"
  },
  {
    "value": "43420",
    "label": "Annan specialiserad bygg- och anläggningsverksamhet i samband med byggande av hus"
  },
  {
    "value": "43500",
    "label": "Specialiserad bygg- och anläggningsverksamhet i samband med anläggningsarbeten"
  },
  {
    "value": "43600",
    "label": "Förmedling avseende specialiserad bygg- och anläggningsverksamhet"
  },
  {
    "value": "43910",
    "label": "Murarbeten"
  },
  {
    "value": "43991",
    "label": "Uthyrning av bygg- och anläggningsmaskiner med förare"
  },
  {
    "value": "43999",
    "label": "Annan övrig specialiserad bygg- och anläggningsverksamhet"
  },
  {
    "value": "46110",
    "label": "Provisionshandel med jordbruksråvaror, levande djur, textilråvaror och textilhalvfabrikat"
  },
  {
    "value": "46120",
    "label": "Provisionshandel med bränsle, malm, metaller och industrikemikalier"
  },
  {
    "value": "46130",
    "label": "Provisionshandel med virke och byggmaterial"
  },
  {
    "value": "46141",
    "label": "Provisionshandel med maskiner, industriell utrustning, fartyg och luftfartyg utom kontorsutrustning och datorer"
  },
  {
    "value": "46142",
    "label": "Provisionshandel med kontorsutrustning och datorer"
  },
  {
    "value": "46150",
    "label": "Provisionshandel med möbler, hushålls- och järnhandelsvaror"
  },
  {
    "value": "46160",
    "label": "Provisionshandel med textilier, kläder, pälsvaror, skodon och lädervaror"
  },
  {
    "value": "46170",
    "label": "Provisionshandel med livsmedel, drycker och tobak"
  },
  {
    "value": "46181",
    "label": "Provisionshandel med motorfordon, och reservdelar och tillbehör till motorfordon"
  },
  {
    "value": "46189",
    "label": "Provisionshandel med annat specialsortiment utom motorfordon"
  },
  {
    "value": "46190",
    "label": "Icke-specialiserad provisionshandel"
  },
  {
    "value": "46210",
    "label": "Partihandel med spannmål, råtobak, utsäde och djurfoder"
  },
  {
    "value": "46220",
    "label": "Partihandel med blommor och växter"
  },
  {
    "value": "46230",
    "label": "Partihandel med levande djur"
  },
  {
    "value": "46240",
    "label": "Partihandel med hudar, skinn och läder"
  },
  {
    "value": "46310",
    "label": "Partihandel med frukt och grönsaker"
  },
  {
    "value": "46321",
    "label": "Partihandel med kött och köttvaror"
  },
  {
    "value": "46322",
    "label": "Partihandel med fisk- och fiskprodukter"
  },
  {
    "value": "46330",
    "label": "Partihandel med mejeriprodukter, ägg, matolja och matfett"
  },
  {
    "value": "46340",
    "label": "Partihandel med drycker"
  },
  {
    "value": "46350",
    "label": "Partihandel med tobak"
  },
  {
    "value": "46360",
    "label": "Partihandel med socker, choklad- och sockerkonfektyrer"
  },
  {
    "value": "46370",
    "label": "Partihandel med kaffe, te, kakao och kryddor"
  },
  {
    "value": "46380",
    "label": "Partihandel med andra livsmedel"
  },
  {
    "value": "46390",
    "label": "Icke-specialiserad partihandel med livsmedel, drycker och tobak"
  },
  {
    "value": "46410",
    "label": "Partihandel med textilier"
  },
  {
    "value": "46420",
    "label": "Partihandel med kläder och skodon"
  },
  {
    "value": "46431",
    "label": "Partihandel med elektriska hushållsmaskiner och -apparater"
  },
  {
    "value": "46432",
    "label": "Partihandel med ljud- och bildanläggningar samt videoutrustning"
  },
  {
    "value": "46433",
    "label": "Partihandel med elartiklar"
  },
  {
    "value": "46434",
    "label": "Partihandel med fotografiska och optiska produkter"
  },
  {
    "value": "46440",
    "label": "Partihandel med glas och porslin samt rengöringsmedel"
  },
  {
    "value": "46450",
    "label": "Partihandel med parfym och kosmetika"
  },
  {
    "value": "46460",
    "label": "Partihandel med medicinsk utrustning och apoteksvaror"
  },
  {
    "value": "46471",
    "label": "Partihandel med möbler, mattor och belysningsartiklar"
  },
  {
    "value": "46472",
    "label": "Partihandel med kontorsmöbler"
  },
  {
    "value": "46480",
    "label": "Partihandel med ur och guldsmedsvaror"
  },
  {
    "value": "46491",
    "label": "Partihandel med sport- och fritidsartiklar"
  },
  {
    "value": "46492",
    "label": "Partihandel med kontorsförbrukningsvaror"
  },
  {
    "value": "46499",
    "label": "Partihandel med övriga hushållsvaror"
  },
  {
    "value": "46501",
    "label": "Partihandel med datorer och kringutrustning samt programvara; samt annan kontorsutrustning"
  },
  {
    "value": "46502",
    "label": "Partihandel med elektronikkomponenter"
  },
  {
    "value": "46503",
    "label": "Partihandel med telekommunikationsutrustning"
  },
  {
    "value": "46610",
    "label": "Partihandel med jordbruksmaskiner och jordbruksutrustning"
  },
  {
    "value": "46620",
    "label": "Partihandel med verktygsmaskiner"
  },
  {
    "value": "46630",
    "label": "Partihandel med gruv-, bygg- och anläggningsmaskiner"
  },
  {
    "value": "46641",
    "label": "Partihandel med mät- och precisionsinstrument"
  },
  {
    "value": "46642",
    "label": "Partihandel med datoriserad materialhanteringsutrustning"
  },
  {
    "value": "46649",
    "label": "Partihandel med diverse andra maskiner och diverse annan utrustning"
  },
  {
    "value": "46711",
    "label": "Partihandel med personbilar och lätta motorfordon"
  },
  {
    "value": "46712",
    "label": "Partihandel med lastbilar, bussar och specialfordon"
  },
  {
    "value": "46713",
    "label": "Partihandel med husvagnar, husbilar, släpfordon och påhängsvagnar"
  },
  {
    "value": "46720",
    "label": "Partihandel med reservdelar och tillbehör till motorfordon"
  },
  {
    "value": "46730",
    "label": "Partihandel med motorcyklar, reservdelar och tillbehör till motorcyklar"
  },
  {
    "value": "46810",
    "label": "Partihandel med bränslen"
  },
  {
    "value": "46820",
    "label": "Partihandel med metaller och metallmalmer"
  },
  {
    "value": "46831",
    "label": "Partihandel med virke och andra byggmaterial"
  },
  {
    "value": "46832",
    "label": "Partihandel med sanitetsgods"
  },
  {
    "value": "46841",
    "label": "Partihandel med järnhandelsvaror"
  },
  {
    "value": "46842",
    "label": "Partihandel med VVS-varor"
  },
  {
    "value": "46850",
    "label": "Partihandel med kemiska produkter"
  },
  {
    "value": "46860",
    "label": "Partihandel med andra insatsvaror"
  },
  {
    "value": "46871",
    "label": "Partihandel med uttjänta fordon"
  },
  {
    "value": "46872",
    "label": "Partihandel med metallavfall och metallskrot"
  },
  {
    "value": "46873",
    "label": "Partihandel med avfall och skrot av icke-metall"
  },
  {
    "value": "46890",
    "label": "Diverse övrig specialiserad partihandel"
  },
  {
    "value": "46900",
    "label": "Icke-specialiserad partihandel"
  },
  {
    "value": "47111",
    "label": "Varuhus- och stormarknadshandel, mest livsmedel, drycker och tobak"
  },
  {
    "value": "47112",
    "label": "Livsmedelshandel med brett sortiment, ej varuhus eller stormarknad"
  },
  {
    "value": "47113",
    "label": "Detaljhandel via internet eller postorder med brett sortiment, mest livsmedel, drycker och tobak"
  },
  {
    "value": "47121",
    "label": "Annan varuhus- eller stormarknadshandel"
  },
  {
    "value": "47122",
    "label": "Övrig detaljhandel med brett sortiment"
  },
  {
    "value": "47123",
    "label": "Detaljhandel via internet eller postorder med brett sortiment"
  },
  {
    "value": "47210",
    "label": "Detaljhandel med frukt och grönsaker"
  },
  {
    "value": "47220",
    "label": "Detaljhandel med kött och charkuterier"
  },
  {
    "value": "47230",
    "label": "Detaljhandel med fisk, skal- och blötdjur"
  },
  {
    "value": "47241",
    "label": "Detaljhandel med bröd och konditorivaror"
  },
  {
    "value": "47242",
    "label": "Detaljhandel med konfektyrer"
  },
  {
    "value": "47250",
    "label": "Detaljhandel med drycker"
  },
  {
    "value": "47260",
    "label": "Detaljhandel med tobaksvaror"
  },
  {
    "value": "47271",
    "label": "Detaljhandel med hälsokost"
  },
  {
    "value": "47272",
    "label": "Detaljhandel med andra livsmedel utom hälsokost"
  },
  {
    "value": "47300",
    "label": "Detaljhandel med drivmedel"
  },
  {
    "value": "47401",
    "label": "Detaljhandel med datorer, programvara, data- och tv-spel"
  },
  {
    "value": "47402",
    "label": "Detaljhandel med telekommunikationsutrustning"
  },
  {
    "value": "47403",
    "label": "Detaljhandel med ljud- och bildanläggningar samt videoutrustning"
  },
  {
    "value": "47404",
    "label": "Detaljhandel via internet eller postorder med informations- och kommunikationsutrustning"
  },
  {
    "value": "47510",
    "label": "Detaljhandel med textilier"
  },
  {
    "value": "47521",
    "label": "Detaljhandel med virke och byggvaror"
  },
  {
    "value": "47522",
    "label": "Detaljhandel med järn- och VVS-varor"
  },
  {
    "value": "47523",
    "label": "Detaljhandel med färger, fernissor och lacker"
  },
  {
    "value": "47531",
    "label": "Detaljhandel med mattor och annan vägg- och golvbeklädnad"
  },
  {
    "value": "47532",
    "label": "Detaljhandel med inredningstextilier"
  },
  {
    "value": "47533",
    "label": "Detaljhandel via internet eller postorder med mattor och inredningstextilier"
  },
  {
    "value": "47541",
    "label": "Detaljhandel med elektriska hushållsmaskiner och hushållsapparater, utom via internet eller postorder"
  },
  {
    "value": "47542",
    "label": "Detaljhandel via internet eller postorder med elektriska hushållsmaskiner och hushållsapparater"
  },
  {
    "value": "47551",
    "label": "Detaljhandel med möbler"
  },
  {
    "value": "47552",
    "label": "Detaljhandel med belysningsartiklar, bordsartiklar och hushållsartiklar utom möbler"
  },
  {
    "value": "47553",
    "label": "Detaljhandel via internet eller postorder med möbler, belysningsartiklar, bordsartiklar och hushållsartiklar"
  },
  {
    "value": "47611",
    "label": "Detaljhandel med böcker, utom via internet eller postorder"
  },
  {
    "value": "47612",
    "label": "Detaljhandel via internet eller postorder med böcker"
  },
  {
    "value": "47621",
    "label": "Detaljhandel med tidningar"
  },
  {
    "value": "47622",
    "label": "Detaljhandel med kontorsförbrukningsvaror"
  },
  {
    "value": "47631",
    "label": "Detaljhandel med sport- och fritidsartiklar utom cyklar och båtar"
  },
  {
    "value": "47632",
    "label": "Detaljhandel med cyklar"
  },
  {
    "value": "47633",
    "label": "Detaljhandel med båtar"
  },
  {
    "value": "47634",
    "label": "Detaljhandel via internet eller postorder med sport- och fritidsartiklar"
  },
  {
    "value": "47641",
    "label": "Detaljhandel med spel och leksaker, utom via internet eller postorder"
  },
  {
    "value": "47642",
    "label": "Detaljhandel via internet eller postorder med spel och leksaker"
  },
  {
    "value": "47691",
    "label": "Detaljhandel med musikinstrument och noter"
  },
  {
    "value": "47692",
    "label": "Detaljhandel med konst samt galleriverksamhet"
  },
  {
    "value": "47693",
    "label": "Detaljhandel med media för musik och bild"
  },
  {
    "value": "47694",
    "label": "Detaljhandel via internet eller postorder med övriga kultur- och fritidsartiklar"
  },
  {
    "value": "47699",
    "label": "Detaljhandel med andra övriga kultur- och fritidsartiklar"
  },
  {
    "value": "47711",
    "label": "Detaljhandel med kläder, utom via internet eller postorder"
  },
  {
    "value": "47712",
    "label": "Detaljhandel via internet eller postorder med kläder"
  },
  {
    "value": "47721",
    "label": "Detaljhandel med skodon"
  },
  {
    "value": "47722",
    "label": "Detaljhandel med väskor, reseffekter och lädervaror"
  },
  {
    "value": "47723",
    "label": "Detaljhandel via internet eller postorder med skodon och lädervaror"
  },
  {
    "value": "47731",
    "label": "Detaljhandel med apoteksvaror, utom via internet eller postorder"
  },
  {
    "value": "47732",
    "label": "Detaljhandel via internet eller postorder med apoteksvaror"
  },
  {
    "value": "47741",
    "label": "Detaljhandel med medicinska och ortopediska artiklar, utom glasögon och andra optiska artiklar"
  },
  {
    "value": "47742",
    "label": "Detaljhandel med glasögon och andra optiska artiklar utom fotoutrustning"
  },
  {
    "value": "47751",
    "label": "Detaljhandel med kosmetika och hygienartiklar, utom via internet eller postorder"
  },
  {
    "value": "47752",
    "label": "Detaljhandel via internet eller postorder med kosmetika och hygienartiklar"
  },
  {
    "value": "47761",
    "label": "Detaljhandel med blommor och andra växter, frön och gödselmedel"
  },
  {
    "value": "47762",
    "label": "Detaljhandel med små sällskapsdjur"
  },
  {
    "value": "47771",
    "label": "Detaljhandel med ur, guldsmedsvaror och smycken, utom via internet eller postorder"
  },
  {
    "value": "47772",
    "label": "Detaljhandel via internet eller postorder med ur, guldsmedsvaror och smycken"
  },
  {
    "value": "47781",
    "label": "Detaljhandel med andra optiska artiklar utom fotoutrustning"
  },
  {
    "value": "47782",
    "label": "Detaljhandel med fotoutrustning"
  },
  {
    "value": "47789",
    "label": "Övrig specialiserad detaljhandel"
  },
  {
    "value": "47791",
    "label": "Detaljhandel med antikviteter och begagnade böcker"
  },
  {
    "value": "47792",
    "label": "Detaljhandel med övriga begagnade varor"
  },
  {
    "value": "47811",
    "label": "Detaljhandel med personbilar och lätta motorfordon"
  },
  {
    "value": "47812",
    "label": "Detaljhandel med lastbilar, bussar och specialfordon"
  },
  {
    "value": "47813",
    "label": "Detaljhandel med husvagnar, husbilar, släpfordon och påhängsvagnar"
  },
  {
    "value": "47820",
    "label": "Detaljhandel med reservdelar och tillbehör till motorfordon"
  },
  {
    "value": "47830",
    "label": "Detaljhandel med motorcyklar, reservdelar och tillbehör till motorcyklar"
  },
  {
    "value": "47910",
    "label": "Förmedling avseende icke-specialiserad detaljhandel"
  },
  {
    "value": "47920",
    "label": "Förmedling avseende specialiserad detaljhandel"
  },
  {
    "value": "49110",
    "label": "Tung järnvägstransport, passagerartrafik"
  },
  {
    "value": "49120",
    "label": "Annan järnvägstransport, passagerartrafik"
  },
  {
    "value": "49200",
    "label": "Järnvägstransport, godstrafik"
  },
  {
    "value": "49310",
    "label": "Reguljär vägtransport, passagerartrafik"
  },
  {
    "value": "49320",
    "label": "Icke-reguljär vägtransport, passagerartrafik"
  },
  {
    "value": "49330",
    "label": "Passagerartrafik på beställning, fordon med förare"
  },
  {
    "value": "49340",
    "label": "Kabinbanor och skidliftar, passagerartrafik"
  },
  {
    "value": "49390",
    "label": "Diverse övrig landtransport av passagerare"
  },
  {
    "value": "49410",
    "label": "Vägtransport, godstrafik"
  },
  {
    "value": "49420",
    "label": "Flyttjänster"
  },
  {
    "value": "49500",
    "label": "Transport i rörsystem"
  },
  {
    "value": "50101",
    "label": "Reguljär sjötrafik över hav och kust av passagerare"
  },
  {
    "value": "50102",
    "label": "Icke reguljär sjötrafik över hav och kust av passagerare"
  },
  {
    "value": "50201",
    "label": "Reguljär sjötrafik över hav och kust av gods"
  },
  {
    "value": "50202",
    "label": "Icke reguljär sjötrafik över hav och kust av gods"
  },
  {
    "value": "50301",
    "label": "Reguljär sjötrafik på inre vattenvägar av passagerare"
  },
  {
    "value": "50302",
    "label": "Icke reguljär sjötrafik på inre vattenvägar av passagerare"
  },
  {
    "value": "50401",
    "label": "Reguljär sjötrafik på inre vattenvägar av gods"
  },
  {
    "value": "50402",
    "label": "Icke reguljär sjötrafik på inre vattenvägar av gods"
  },
  {
    "value": "51101",
    "label": "Reguljär lufttransport av passagerare"
  },
  {
    "value": "51102",
    "label": "Icke reguljär lufttransport av passagerare"
  },
  {
    "value": "51211",
    "label": "Reguljär lufttransport av gods"
  },
  {
    "value": "51212",
    "label": "Icke reguljär lufttransport av gods"
  },
  {
    "value": "51220",
    "label": "Rymdfart"
  },
  {
    "value": "52100",
    "label": "Magasinering och varulagring"
  },
  {
    "value": "52211",
    "label": "Bärgning avseende landtransport"
  },
  {
    "value": "52219",
    "label": "Övrig stödverksamhet avseende landtransport"
  },
  {
    "value": "52220",
    "label": "Stödverksamhet avseende sjötransport"
  },
  {
    "value": "52230",
    "label": "Stödverksamhet avseende lufttransport"
  },
  {
    "value": "52241",
    "label": "Hamngodshantering"
  },
  {
    "value": "52249",
    "label": "Övrig godshantering"
  },
  {
    "value": "52250",
    "label": "Logistikverksamhet"
  },
  {
    "value": "52260",
    "label": "Annan stödverksamhet avseende transport"
  },
  {
    "value": "52310",
    "label": "Förmedling avseende godstransport"
  },
  {
    "value": "52320",
    "label": "Förmedling avseende passagerartransport"
  },
  {
    "value": "53100",
    "label": "Postbefordran via nationella posten"
  },
  {
    "value": "53201",
    "label": "Annan postbefordran och tidningsdistribution"
  },
  {
    "value": "53202",
    "label": "Bud- och kurirverksamhet"
  },
  {
    "value": "53300",
    "label": "Förmedling avseende postbefordran samt kurirverksamhet"
  },
  {
    "value": "55101",
    "label": "Hotellverksamhet med restaurangrörelse"
  },
  {
    "value": "55102",
    "label": "Drift av konferensanläggningar med boende"
  },
  {
    "value": "55103",
    "label": "Hotellverksamhet utan restaurangrörelse"
  },
  {
    "value": "55201",
    "label": "Vandrarhemsverksamhet"
  },
  {
    "value": "55202",
    "label": "Stug- och rumsuthyrning"
  },
  {
    "value": "55300",
    "label": "Campingplatsverksamhet"
  },
  {
    "value": "55400",
    "label": "Förmedling avseende hotell- och logiverksamhet"
  },
  {
    "value": "55900",
    "label": "Annan logiverksamhet"
  },
  {
    "value": "56110",
    "label": "Restaurangverksamhet"
  },
  {
    "value": "56120",
    "label": "Mobil restaurangverksamhet"
  },
  {
    "value": "56210",
    "label": "Cateringverksamhet vid enskilda evenemang"
  },
  {
    "value": "56221",
    "label": "Drift av personalmatsalar"
  },
  {
    "value": "56222",
    "label": "Centralköksverksamhet för sjukhus, skolor, omsorgs- och andra institutioner"
  },
  {
    "value": "56229",
    "label": "Övrig centralköks- och cateringverksamhet"
  },
  {
    "value": "56300",
    "label": "Barverksamhet"
  },
  {
    "value": "56400",
    "label": "Förmedling avseende restaurang-, catering- och barverksamhet"
  },
  {
    "value": "58110",
    "label": "Utgivning av böcker"
  },
  {
    "value": "58121",
    "label": "Dagstidningsutgivning"
  },
  {
    "value": "58122",
    "label": "Annonstidningsutgivning"
  },
  {
    "value": "58130",
    "label": "Utgivning av tidskrifter"
  },
  {
    "value": "58190",
    "label": "Annan förlagsverksamhet, utom utgivning av programvara"
  },
  {
    "value": "58210",
    "label": "Utgivning av datorspel"
  },
  {
    "value": "58290",
    "label": "Utgivning av annan programvara"
  },
  {
    "value": "59110",
    "label": "Produktion av film, video och tv-program"
  },
  {
    "value": "59120",
    "label": "Efterproduktion av film, video och tv-program"
  },
  {
    "value": "59130",
    "label": "Film- och videodistribution"
  },
  {
    "value": "59140",
    "label": "Filmvisning"
  },
  {
    "value": "59200",
    "label": "Ljudinspelning och musikutgivning"
  },
  {
    "value": "60100",
    "label": "Radiosändning och distribution av ljudinspelningar"
  },
  {
    "value": "60200",
    "label": "Planering och sändning av tv-program samt distribution av video"
  },
  {
    "value": "60310",
    "label": "Nyhetsförmedling"
  },
  {
    "value": "60390",
    "label": "Annan distribution av medieinnehåll"
  },
  {
    "value": "61100",
    "label": "Trådbunden och trådlös telekommunikation samt telekommunikation via satellit"
  },
  {
    "value": "61200",
    "label": "Återförsäljning och förmedling avseende telekommunikation"
  },
  {
    "value": "61900",
    "label": "Annan telekommunikation"
  },
  {
    "value": "62100",
    "label": "Dataprogrammering"
  },
  {
    "value": "62201",
    "label": "Datakonsultverksamhet"
  },
  {
    "value": "62202",
    "label": "Datordrifttjänster"
  },
  {
    "value": "62900",
    "label": "Annan it- och dataverksamhet"
  },
  {
    "value": "63100",
    "label": "Datainfrastruktur, databehandling, hosting o.d."
  },
  {
    "value": "63910",
    "label": "Webbportaler"
  },
  {
    "value": "63920",
    "label": "Övrig informationsverksamhet"
  },
  {
    "value": "64110",
    "label": "Centralbanksverksamhet"
  },
  {
    "value": "64190",
    "label": "Annan monetär finansförmedling"
  },
  {
    "value": "64211",
    "label": "Holdingverksamhet i finansiella koncerner"
  },
  {
    "value": "64212",
    "label": "Holdingverksamhet i icke-finansiella koncerner"
  },
  {
    "value": "64220",
    "label": "Conduitverksamhet"
  },
  {
    "value": "64310",
    "label": "Penningmarknadsfonder och andra fonder än penningmarknadsfonder"
  },
  {
    "value": "64320",
    "label": "Stiftelser, dödsbon och brevlådeföretag"
  },
  {
    "value": "64910",
    "label": "Finansiell leasing"
  },
  {
    "value": "64920",
    "label": "Annan kreditgivning"
  },
  {
    "value": "64991",
    "label": "Investmentverksamhet"
  },
  {
    "value": "64992",
    "label": "Riskkapitalbolagsverksamhet"
  },
  {
    "value": "64993",
    "label": "Handel med och förvaltning av värdepapper, för egen räkning"
  },
  {
    "value": "64994",
    "label": "Förvaltning av och handel med värdepapper, för en begränsad och sluten krets av ägare"
  },
  {
    "value": "64999",
    "label": "Diverse övrig finansförmedling"
  },
  {
    "value": "65111",
    "label": "Fondanknuten livförsäkring"
  },
  {
    "value": "65119",
    "label": "Övrig livförsäkring"
  },
  {
    "value": "65120",
    "label": "Skadeförsäkring"
  },
  {
    "value": "65200",
    "label": "Återförsäkring"
  },
  {
    "value": "65300",
    "label": "Pensionsfondsverksamhet"
  },
  {
    "value": "66110",
    "label": "Administration avseende finansiella marknader"
  },
  {
    "value": "66120",
    "label": "Verksamhet utförd av värdepappers- och varumäklare"
  },
  {
    "value": "66190",
    "label": "Annan stödverksamhet avseende finansiella tjänster utom försäkrings- och pensionsfondsverksamhet"
  },
  {
    "value": "66210",
    "label": "Risk- och skadebedömning"
  },
  {
    "value": "66220",
    "label": "Verksamhet utförd av försäkringsombud och försäkringsmäklare"
  },
  {
    "value": "66290",
    "label": "Övrig stödverksamhet avseende försäkrings- och pensionsfondsverksamhet"
  },
  {
    "value": "66301",
    "label": "Förvaltning av investeringsfonder"
  },
  {
    "value": "66309",
    "label": "Annan fondförvaltning"
  },
  {
    "value": "68110",
    "label": "Handel med egna fastigheter"
  },
  {
    "value": "68120",
    "label": "Utformning av byggprojekt"
  },
  {
    "value": "68201",
    "label": "Uthyrning och förvaltning av egna eller arrenderade bostäder"
  },
  {
    "value": "68202",
    "label": "Uthyrning och förvaltning av egna eller arrenderade industrilokaler"
  },
  {
    "value": "68203",
    "label": "Uthyrning och förvaltning av egna eller arrenderade, andra lokaler"
  },
  {
    "value": "68204",
    "label": "Förvaltning i bostadsrättsföreningar"
  },
  {
    "value": "68209",
    "label": "Övrig förvaltning av egna eller arrenderade fastigheter"
  },
  {
    "value": "68310",
    "label": "Förmedling avseende fastighetsverksamhet"
  },
  {
    "value": "68320",
    "label": "Annan fastighetsförmedling och fastighetsförvaltning på uppdrag"
  },
  {
    "value": "69101",
    "label": "Advokatbyråverksamhet"
  },
  {
    "value": "69102",
    "label": "Juridiska byråers verksamhet m.m."
  },
  {
    "value": "69201",
    "label": "Redovisning och bokföring; skatterådgivning"
  },
  {
    "value": "69202",
    "label": "Revision"
  },
  {
    "value": "70100",
    "label": "Verksamheter som utövas av huvudkontor"
  },
  {
    "value": "70200",
    "label": "Konsultverksamhet avseende företags organisation"
  },
  {
    "value": "71110",
    "label": "Arkitektverksamhet"
  },
  {
    "value": "71121",
    "label": "Teknisk konsultverksamhet inom bygg- och anläggningsteknik"
  },
  {
    "value": "71122",
    "label": "Teknisk konsultverksamhet inom industriteknik"
  },
  {
    "value": "71123",
    "label": "Teknisk konsultverksamhet inom elteknik"
  },
  {
    "value": "71124",
    "label": "Teknisk konsultverksamhet inom energi-, miljö- och VVS-teknik"
  },
  {
    "value": "71129",
    "label": "Övrig teknisk konsultverksamhet"
  },
  {
    "value": "71200",
    "label": "Teknisk provning och analys"
  },
  {
    "value": "72101",
    "label": "Bioteknisk forskning och utveckling"
  },
  {
    "value": "72109",
    "label": "Annan naturvetenskaplig och teknisk forskning och utveckling"
  },
  {
    "value": "72200",
    "label": "Samhällsvetenskaplig och humanistisk forskning och utveckling"
  },
  {
    "value": "73111",
    "label": "Reklambyråverksamhet"
  },
  {
    "value": "73112",
    "label": "Direktreklamverksamhet"
  },
  {
    "value": "73119",
    "label": "Övrig reklamverksamhet"
  },
  {
    "value": "73120",
    "label": "Mediebyråverksamhet och annonsförsäljning"
  },
  {
    "value": "73200",
    "label": "Marknads- och opinionsundersökning"
  },
  {
    "value": "73300",
    "label": "PR och kommunikation"
  },
  {
    "value": "74110",
    "label": "Industridesign och modedesign"
  },
  {
    "value": "74120",
    "label": "Grafisk design och visuell kommunikation"
  },
  {
    "value": "74130",
    "label": "Inredningsdesign"
  },
  {
    "value": "74140",
    "label": "Annan specialiserad designverksamhet"
  },
  {
    "value": "74200",
    "label": "Fotoverksamhet"
  },
  {
    "value": "74300",
    "label": "Översättning och tolkning"
  },
  {
    "value": "74910",
    "label": "Patentförmedling samt marknadsföring av patent"
  },
  {
    "value": "74990",
    "label": "All övrig verksamhet inom juridik, ekonomi, vetenskap och teknik"
  },
  {
    "value": "75000",
    "label": "Veterinärverksamhet"
  },
  {
    "value": "77110",
    "label": "Uthyrning och leasing av personbilar och lätta motorfordon"
  },
  {
    "value": "77120",
    "label": "Uthyrning och leasing av lastbilar och andra tunga motorfordon"
  },
  {
    "value": "77210",
    "label": "Uthyrning och leasing av fritids- och sportutrustning"
  },
  {
    "value": "77220",
    "label": "Uthyrning och leasing av andra hushållsartiklar och varor för personligt bruk"
  },
  {
    "value": "77310",
    "label": "Uthyrning och leasing av jordbruksmaskiner och jordbruksredskap"
  },
  {
    "value": "77320",
    "label": "Uthyrning och leasing av bygg- och anläggningsmaskiner"
  },
  {
    "value": "77330",
    "label": "Uthyrning och leasing av kontorsmaskiner, kontorsutrustning och datorer"
  },
  {
    "value": "77340",
    "label": "Uthyrning och leasing av fartyg och båtar"
  },
  {
    "value": "77350",
    "label": "Uthyrning och leasing av flygplan"
  },
  {
    "value": "77390",
    "label": "Uthyrning och leasing av diverse övrig utrustning samt diverse övriga maskiner och materiella tillgångar"
  },
  {
    "value": "77400",
    "label": "Leasing av immateriell egendom och liknande produkter, med undantag för upphovsrättsskyddade verk"
  },
  {
    "value": "77510",
    "label": "Förmedling avseende uthyrning och leasing av personbilar, husbilar och släpfordon"
  },
  {
    "value": "77520",
    "label": "Förmedling avseende uthyrning och leasing av andra materiella tillgångar och icke-finansiella immateriella tillgångar"
  },
  {
    "value": "78100",
    "label": "Arbetsförmedling och rekrytering"
  },
  {
    "value": "78201",
    "label": "Personaluthyrning"
  },
  {
    "value": "78202",
    "label": "Övrigt tillhandahållande av personalfunktioner"
  },
  {
    "value": "79110",
    "label": "Resebyråverksamhet"
  },
  {
    "value": "79120",
    "label": "Researrangemang"
  },
  {
    "value": "79900",
    "label": "Turist- och bokningsverksamhet"
  },
  {
    "value": "80010",
    "label": "Bevakningsverksamhet och privat säkerhetsverksamhet"
  },
  {
    "value": "80090",
    "label": "Övrig säkerhetsverksamhet"
  },
  {
    "value": "81100",
    "label": "Fastighetsrelaterad stödverksamhet"
  },
  {
    "value": "81210",
    "label": "Lokalvård"
  },
  {
    "value": "81221",
    "label": "Rengöring av byggnader"
  },
  {
    "value": "81222",
    "label": "Skorstensfejarverksamhet"
  },
  {
    "value": "81230",
    "label": "Annan rengöring"
  },
  {
    "value": "81300",
    "label": "Skötsel och underhåll av grönytor"
  },
  {
    "value": "82100",
    "label": "Kontorstjänster"
  },
  {
    "value": "82200",
    "label": "Callcenterverksamhet"
  },
  {
    "value": "82300",
    "label": "Arrangemang av kongresser och mässor"
  },
  {
    "value": "82400",
    "label": "Förmedling avseende övrig stödverksamhet till företag"
  },
  {
    "value": "82910",
    "label": "Inkassoföretags och kreditupplysningsföretags verksamhet"
  },
  {
    "value": "82920",
    "label": "Förpackningsverksamhet"
  },
  {
    "value": "82990",
    "label": "Diverse övrig stödverksamhet till företag"
  },
  {
    "value": "84110",
    "label": "Övergripande offentlig förvaltning"
  },
  {
    "value": "84121",
    "label": "Offentlig förvaltning av grundskole- och gymnasieskoleutbildning"
  },
  {
    "value": "84122",
    "label": "Offentlig förvaltning av universitets- och högskoleutbildning samt forskning"
  },
  {
    "value": "84123",
    "label": "Offentlig förvaltning av hälso- och sjukvård"
  },
  {
    "value": "84124",
    "label": "Offentlig förvaltning av omsorg och socialtjänst"
  },
  {
    "value": "84125",
    "label": "Offentlig förvaltning av program för kultur, miljö, boende m.m."
  },
  {
    "value": "84130",
    "label": "Offentlig förvaltning av näringslivsprogram"
  },
  {
    "value": "84210",
    "label": "Utrikesförvaltning"
  },
  {
    "value": "84221",
    "label": "Militärt försvar; gemensam verksamhet för totalförsvaret"
  },
  {
    "value": "84222",
    "label": "Civilt försvar och frivilligförsvar"
  },
  {
    "value": "84231",
    "label": "Åklagar- och domstolsverksamhet"
  },
  {
    "value": "84232",
    "label": "Kriminalvård"
  },
  {
    "value": "84240",
    "label": "Polisverksamhet"
  },
  {
    "value": "84250",
    "label": "Brand- och räddningsverksamhet"
  },
  {
    "value": "84300",
    "label": "Obligatorisk socialförsäkring"
  },
  {
    "value": "85100",
    "label": "Förskoleutbildning"
  },
  {
    "value": "85201",
    "label": "Grundskoleutbildning och förskoleklass"
  },
  {
    "value": "85202",
    "label": "Utbildning inom anpassad grundskola"
  },
  {
    "value": "85311",
    "label": "Studieförberedande gymnasial utbildning utom kommunal vuxenutbildning"
  },
  {
    "value": "85312",
    "label": "Kommunal vuxenutbildning o.d."
  },
  {
    "value": "85321",
    "label": "Gymnasial yrkesutbildning"
  },
  {
    "value": "85322",
    "label": "Utbildning inom anpassad gymnasieskola"
  },
  {
    "value": "85323",
    "label": "Annan gymnasial utbildning"
  },
  {
    "value": "85324",
    "label": "Yrkesförarutbildning m.m."
  },
  {
    "value": "85330",
    "label": "Eftergymnasial utbildning vid annat än universitet eller högskola"
  },
  {
    "value": "85400",
    "label": "Universitets- eller högskoleutbildning"
  },
  {
    "value": "85510",
    "label": "Sport- och fritidsutbildning"
  },
  {
    "value": "85521",
    "label": "Kommunala kulturskolans utbildning"
  },
  {
    "value": "85522",
    "label": "Övrig musik-, dans- och kulturell utbildning"
  },
  {
    "value": "85530",
    "label": "Trafikskoleverksamhet"
  },
  {
    "value": "85591",
    "label": "Arbetsmarknadsutbildning"
  },
  {
    "value": "85592",
    "label": "Folkhögskoleutbildning"
  },
  {
    "value": "85593",
    "label": "Studieförbundens och frivilligorganisationernas utbildning"
  },
  {
    "value": "85594",
    "label": "Personalutbildning"
  },
  {
    "value": "85599",
    "label": "Annan övrig utbildning"
  },
  {
    "value": "85610",
    "label": "Förmedling avseende kurser och övrig undervisning"
  },
  {
    "value": "85690",
    "label": "Övrig stödverksamhet för utbildningsväsendet"
  },
  {
    "value": "86101",
    "label": "Sluten primärvård"
  },
  {
    "value": "86102",
    "label": "Specialiserad sluten somatisk hälso- och sjukvård på sjukhus"
  },
  {
    "value": "86103",
    "label": "Specialiserad sluten psykiatrisk hälso- och sjukvård på sjukhus"
  },
  {
    "value": "86211",
    "label": "Primärvårdsmottagningar med läkare m.m."
  },
  {
    "value": "86212",
    "label": "Annan allmän öppen hälso- och sjukvård, ej primärvård"
  },
  {
    "value": "86221",
    "label": "Specialistläkarverksamhet inom öppenvård, på sjukhus"
  },
  {
    "value": "86222",
    "label": "Specialistläkarverksamhet inom öppenvård, ej på sjukhus"
  },
  {
    "value": "86230",
    "label": "Tandläkarverksamhet"
  },
  {
    "value": "86910",
    "label": "Medicinsk laboratorieverksamhet och bilddiagnostik"
  },
  {
    "value": "86920",
    "label": "Ambulanstransporter och ambulanssjukvård"
  },
  {
    "value": "86930",
    "label": "Psykologi- och psykoterapiverksamhet, utom läkare"
  },
  {
    "value": "86940",
    "label": "Sjuksköterske- och barnmorskeverksamhet"
  },
  {
    "value": "86950",
    "label": "Fysioterapeutisk verksamhet"
  },
  {
    "value": "86960",
    "label": "Traditionell, komplementär och alternativ medicin"
  },
  {
    "value": "86970",
    "label": "Förmedling avseende sjukvård, tandvård och annan hälso- och sjukvård"
  },
  {
    "value": "86991",
    "label": "Tandhygienistverksamhet"
  },
  {
    "value": "86999",
    "label": "Annan övrig hälso- och sjukvård"
  },
  {
    "value": "87100",
    "label": "Boende med sjuksköterskevård"
  },
  {
    "value": "87201",
    "label": "Boende med särskild service för personer med psykisk funktionsnedsättning"
  },
  {
    "value": "87202",
    "label": "Boende med särskild service för barn och ungdomar med missbruksproblem"
  },
  {
    "value": "87203",
    "label": "Boende med särskild service för vuxna med missbruksproblem"
  },
  {
    "value": "87301",
    "label": "Vård och omsorg i särskilda boendeformer för äldre personer"
  },
  {
    "value": "87302",
    "label": "Vård och omsorg i särskilda boendeformer för personer med fysisk funktionsnedsättning"
  },
  {
    "value": "87910",
    "label": "Förmedling avseende vård och omsorg med boende"
  },
  {
    "value": "87991",
    "label": "Heldygnsvård med boende för barn och ungdomar med sociala problem"
  },
  {
    "value": "87992",
    "label": "Omsorg och sociala insatser i övriga boendeformer för vuxna"
  },
  {
    "value": "88101",
    "label": "Öppna sociala insatser för äldre personer"
  },
  {
    "value": "88102",
    "label": "Öppna sociala insatser för personer med funktionsnedsättning"
  },
  {
    "value": "88910",
    "label": "Dagbarnvård"
  },
  {
    "value": "88991",
    "label": "Öppna sociala insatser för barn och ungdomar med sociala problem"
  },
  {
    "value": "88992",
    "label": "Öppna sociala insatser för vuxna med missbruksproblem"
  },
  {
    "value": "88993",
    "label": "Övriga öppna sociala insatser för vuxna"
  },
  {
    "value": "88994",
    "label": "Humanitära insatser"
  },
  {
    "value": "88995",
    "label": "Drift av flyktingförläggning"
  },
  {
    "value": "90110",
    "label": "Litterärt skapande och musikkomposition"
  },
  {
    "value": "90120",
    "label": "Bildkonst"
  },
  {
    "value": "90130",
    "label": "Annat konstnärligt skapande"
  },
  {
    "value": "90200",
    "label": "Scenkonst"
  },
  {
    "value": "90310",
    "label": "Drift av teatrar, konserthus o.d."
  },
  {
    "value": "90390",
    "label": "Annan stödverksamhet avseende konstnärligt skapande och scenkonst"
  },
  {
    "value": "91110",
    "label": "Biblioteksverksamhet"
  },
  {
    "value": "91120",
    "label": "Arkivverksamhet"
  },
  {
    "value": "91210",
    "label": "Museiverksamhet och museisamlingar"
  },
  {
    "value": "91220",
    "label": "Vård av historiska minnesmärken och monument"
  },
  {
    "value": "91300",
    "label": "Bevarande, restaurering och annan stödverksamhet avseende kulturarv"
  },
  {
    "value": "91410",
    "label": "Drift av botaniska trädgårdar och djurparker"
  },
  {
    "value": "91420",
    "label": "Drift av naturreservat"
  },
  {
    "value": "92000",
    "label": "Spel- och vadhållningsverksamhet"
  },
  {
    "value": "93111",
    "label": "Drift av skidsportanläggningar"
  },
  {
    "value": "93112",
    "label": "Drift av golfbanor"
  },
  {
    "value": "93113",
    "label": "Drift av motorbanor"
  },
  {
    "value": "93114",
    "label": "Drift av trav- och galoppbanor"
  },
  {
    "value": "93119",
    "label": "Drift av sporthallar, idrottsplatser och andra sportanläggningar"
  },
  {
    "value": "93120",
    "label": "Sportklubbars och idrottsföreningars verksamhet"
  },
  {
    "value": "93130",
    "label": "Drift av gymanläggningar"
  },
  {
    "value": "93191",
    "label": "Tävling med hästar"
  },
  {
    "value": "93199",
    "label": "Annan sportverksamhet"
  },
  {
    "value": "93210",
    "label": "Nöjes- och temaparksverksamhet"
  },
  {
    "value": "93290",
    "label": "Övrig fritids- och nöjesverksamhet"
  },
  {
    "value": "94111",
    "label": "Intressebevakning inom branschorganisationer"
  },
  {
    "value": "94112",
    "label": "Intressebevakning inom arbetsgivarorganisationer"
  },
  {
    "value": "94120",
    "label": "Intressebevakning inom yrkesorganisationer"
  },
  {
    "value": "94200",
    "label": "Intressebevakning inom arbetstagarorganisationer"
  },
  {
    "value": "94910",
    "label": "Verksamhet i religiösa samfund"
  },
  {
    "value": "94920",
    "label": "Verksamhet i politiska organisationer"
  },
  {
    "value": "94990",
    "label": "Verksamhet i diverse övriga intresseorganisationer"
  },
  {
    "value": "95101",
    "label": "Reparation av datorer och kringutrustning"
  },
  {
    "value": "95102",
    "label": "Reparation av kommunikationsutrustning"
  },
  {
    "value": "95210",
    "label": "Reparation och underhåll av hemelektronik"
  },
  {
    "value": "95220",
    "label": "Reparation och underhåll av hushållsapparater samt av utrustning för hem och trädgård"
  },
  {
    "value": "95230",
    "label": "Reparation och underhåll av skodon och lädervaror"
  },
  {
    "value": "95240",
    "label": "Reparation och underhåll av möbler och heminredning"
  },
  {
    "value": "95250",
    "label": "Reparation och underhåll av ur och guldsmedsvaror"
  },
  {
    "value": "95290",
    "label": "Reparation och underhåll av övriga hushållsartiklar och varor för personligt bruk"
  },
  {
    "value": "95311",
    "label": "Allmän service och reparation av motorfordon utom motorcyklar"
  },
  {
    "value": "95312",
    "label": "Plåt-, lack- och glasreparationer på motorfordon utom motorcyklar"
  },
  {
    "value": "95313",
    "label": "Däckservice"
  },
  {
    "value": "95320",
    "label": "Reparation och underhåll av motorcyklar"
  },
  {
    "value": "95400",
    "label": "Förmedling avseende reparation och underhåll av datorer, hushållsartiklar och varor för personligt bruk samt motorfordon och motorcyklar"
  },
  {
    "value": "96101",
    "label": "Industri- och institutionstvätt"
  },
  {
    "value": "96102",
    "label": "Konsumenttvätt"
  },
  {
    "value": "96210",
    "label": "Frisörer och barberare"
  },
  {
    "value": "96220",
    "label": "Skönhetsvård och andra skönhetsbehandlingar"
  },
  {
    "value": "96230",
    "label": "Dagspa, bastu och ångbastu"
  },
  {
    "value": "96300",
    "label": "Begravningsverksamhet"
  },
  {
    "value": "96400",
    "label": "Förmedling avseende konsumenttjänster"
  },
  {
    "value": "96910",
    "label": "Tillhandahållande av konsumenttjänster i hemmet"
  },
  {
    "value": "96990",
    "label": "Diverse övriga konsumenttjänster"
  },
  {
    "value": "97000",
    "label": "Förvärvsarbete i hushåll"
  },
  {
    "value": "98100",
    "label": "Hushållens produktion av diverse varor för eget bruk"
  },
  {
    "value": "98200",
    "label": "Hushållens produktion av diverse tjänster för eget bruk"
  },
  {
    "value": "99000",
    "label": "Verksamhet vid internationella organisationer, utländska ambassader o.d."
  }
];

export const INDUSTRY_GROUP_TO_DETAILS: Record<string, string[]> = {
  "10": [
    "10111",
    "10112",
    "10120",
    "10130",
    "10200",
    "10310",
    "10320",
    "10390",
    "10410",
    "10420",
    "10511",
    "10519",
    "10520",
    "10611",
    "10612",
    "10620",
    "10710",
    "10721",
    "10722",
    "10730",
    "10810",
    "10820",
    "10830",
    "10840",
    "10850",
    "10860",
    "10890",
    "10910",
    "10920"
  ],
  "11": [
    "11010",
    "11020",
    "11030",
    "11040",
    "11050",
    "11060",
    "11070"
  ],
  "12": [
    "12000"
  ],
  "13": [
    "13100",
    "13200",
    "13300",
    "13910",
    "13920",
    "13930",
    "13940",
    "13950",
    "13960",
    "13990"
  ],
  "14": [
    "14100",
    "14210",
    "14220",
    "14230",
    "14240",
    "14290"
  ],
  "15": [
    "15110",
    "15120",
    "15200"
  ],
  "16": [
    "16111",
    "16112",
    "16120",
    "16210",
    "16220",
    "16231",
    "16239",
    "16240",
    "16250",
    "16260",
    "16270",
    "16281",
    "16282"
  ],
  "17": [
    "17110",
    "17121",
    "17122",
    "17129",
    "17211",
    "17219",
    "17220",
    "17230",
    "17240",
    "17250"
  ],
  "18": [
    "18110",
    "18121",
    "18122",
    "18130",
    "18140",
    "18200"
  ],
  "19": [
    "19100",
    "19200"
  ],
  "20": [
    "20110",
    "20120",
    "20130",
    "20140",
    "20150",
    "20160",
    "20170",
    "20200",
    "20300",
    "20410",
    "20420",
    "20510",
    "20591",
    "20592",
    "20593",
    "20599",
    "20600"
  ],
  "21": [
    "21100",
    "21200"
  ],
  "22": [
    "22110",
    "22120",
    "22210",
    "22220",
    "22230",
    "22240",
    "22250",
    "22260"
  ],
  "23": [
    "23110",
    "23120",
    "23130",
    "23140",
    "23150",
    "23200",
    "23310",
    "23320",
    "23410",
    "23420",
    "23430",
    "23440",
    "23450",
    "23510",
    "23520",
    "23610",
    "23620",
    "23630",
    "23640",
    "23650",
    "23660",
    "23701",
    "23709",
    "23910",
    "23991",
    "23999"
  ],
  "24": [
    "24100",
    "24200",
    "24310",
    "24320",
    "24330",
    "24340",
    "24410",
    "24420",
    "24430",
    "24440",
    "24450",
    "24460",
    "24510",
    "24520",
    "24530",
    "24540"
  ],
  "25": [
    "25110",
    "25120",
    "25210",
    "25220",
    "25300",
    "25400",
    "25510",
    "25520",
    "25530",
    "25610",
    "25620",
    "25630",
    "25910",
    "25920",
    "25930",
    "25940",
    "25991",
    "25999"
  ],
  "26": [
    "26110",
    "26120",
    "26200",
    "26300",
    "26400",
    "26510",
    "26520",
    "26600",
    "26700"
  ],
  "27": [
    "27110",
    "27120",
    "27200",
    "27310",
    "27320",
    "27330",
    "27400",
    "27510",
    "27520",
    "27900"
  ],
  "28": [
    "28110",
    "28120",
    "28130",
    "28140",
    "28150",
    "28210",
    "28220",
    "28230",
    "28240",
    "28250",
    "28290",
    "28300",
    "28410",
    "28420",
    "28910",
    "28920",
    "28930",
    "28940",
    "28950",
    "28960",
    "28970",
    "28990"
  ],
  "29": [
    "29101",
    "29102",
    "29200",
    "29310",
    "29320"
  ],
  "30": [
    "30110",
    "30120",
    "30130",
    "30200",
    "30310",
    "30320",
    "30400",
    "30910",
    "30920",
    "30990"
  ],
  "31": [
    "31001",
    "31002",
    "31003",
    "31004",
    "31009"
  ],
  "32": [
    "32110",
    "32120",
    "32130",
    "32200",
    "32300",
    "32400",
    "32501",
    "32502",
    "32910",
    "32990"
  ],
  "33": [
    "33110",
    "33120",
    "33130",
    "33140",
    "33150",
    "33160",
    "33170",
    "33180",
    "33190",
    "33200"
  ],
  "35": [
    "35110",
    "35120",
    "35130",
    "35140",
    "35150",
    "35160",
    "35210",
    "35220",
    "35230",
    "35240",
    "35300",
    "35400"
  ],
  "36": [
    "36000"
  ],
  "37": [
    "37000"
  ],
  "38": [
    "38110",
    "38120",
    "38211",
    "38212",
    "38213",
    "38214",
    "38215",
    "38220",
    "38230",
    "38310",
    "38321",
    "38322",
    "38330"
  ],
  "39": [
    "39000"
  ],
  "41": [
    "41000"
  ],
  "42": [
    "42110",
    "42120",
    "42130",
    "42210",
    "42221",
    "42222",
    "42910",
    "42990"
  ],
  "43": [
    "43110",
    "43120",
    "43130",
    "43210",
    "43221",
    "43222",
    "43223",
    "43229",
    "43230",
    "43240",
    "43310",
    "43320",
    "43330",
    "43341",
    "43342",
    "43350",
    "43411",
    "43412",
    "43420",
    "43500",
    "43600",
    "43910",
    "43991",
    "43999"
  ],
  "46": [
    "46110",
    "46120",
    "46130",
    "46141",
    "46142",
    "46150",
    "46160",
    "46170",
    "46181",
    "46189",
    "46190",
    "46210",
    "46220",
    "46230",
    "46240",
    "46310",
    "46321",
    "46322",
    "46330",
    "46340",
    "46350",
    "46360",
    "46370",
    "46380",
    "46390",
    "46410",
    "46420",
    "46431",
    "46432",
    "46433",
    "46434",
    "46440",
    "46450",
    "46460",
    "46471",
    "46472",
    "46480",
    "46491",
    "46492",
    "46499",
    "46501",
    "46502",
    "46503",
    "46610",
    "46620",
    "46630",
    "46641",
    "46642",
    "46649",
    "46711",
    "46712",
    "46713",
    "46720",
    "46730",
    "46810",
    "46820",
    "46831",
    "46832",
    "46841",
    "46842",
    "46850",
    "46860",
    "46871",
    "46872",
    "46873",
    "46890",
    "46900"
  ],
  "47": [
    "47111",
    "47112",
    "47113",
    "47121",
    "47122",
    "47123",
    "47210",
    "47220",
    "47230",
    "47241",
    "47242",
    "47250",
    "47260",
    "47271",
    "47272",
    "47300",
    "47401",
    "47402",
    "47403",
    "47404",
    "47510",
    "47521",
    "47522",
    "47523",
    "47531",
    "47532",
    "47533",
    "47541",
    "47542",
    "47551",
    "47552",
    "47553",
    "47611",
    "47612",
    "47621",
    "47622",
    "47631",
    "47632",
    "47633",
    "47634",
    "47641",
    "47642",
    "47691",
    "47692",
    "47693",
    "47694",
    "47699",
    "47711",
    "47712",
    "47721",
    "47722",
    "47723",
    "47731",
    "47732",
    "47741",
    "47742",
    "47751",
    "47752",
    "47761",
    "47762",
    "47771",
    "47772",
    "47781",
    "47782",
    "47789",
    "47791",
    "47792",
    "47811",
    "47812",
    "47813",
    "47820",
    "47830",
    "47910",
    "47920"
  ],
  "49": [
    "49110",
    "49120",
    "49200",
    "49310",
    "49320",
    "49330",
    "49340",
    "49390",
    "49410",
    "49420",
    "49500"
  ],
  "50": [
    "50101",
    "50102",
    "50201",
    "50202",
    "50301",
    "50302",
    "50401",
    "50402"
  ],
  "51": [
    "51101",
    "51102",
    "51211",
    "51212",
    "51220"
  ],
  "52": [
    "52100",
    "52211",
    "52219",
    "52220",
    "52230",
    "52241",
    "52249",
    "52250",
    "52260",
    "52310",
    "52320"
  ],
  "53": [
    "53100",
    "53201",
    "53202",
    "53300"
  ],
  "55": [
    "55101",
    "55102",
    "55103",
    "55201",
    "55202",
    "55300",
    "55400",
    "55900"
  ],
  "56": [
    "56110",
    "56120",
    "56210",
    "56221",
    "56222",
    "56229",
    "56300",
    "56400"
  ],
  "58": [
    "58110",
    "58121",
    "58122",
    "58130",
    "58190",
    "58210",
    "58290"
  ],
  "59": [
    "59110",
    "59120",
    "59130",
    "59140",
    "59200"
  ],
  "60": [
    "60100",
    "60200",
    "60310",
    "60390"
  ],
  "61": [
    "61100",
    "61200",
    "61900"
  ],
  "62": [
    "62100",
    "62201",
    "62202",
    "62900"
  ],
  "63": [
    "63100",
    "63910",
    "63920"
  ],
  "64": [
    "64110",
    "64190",
    "64211",
    "64212",
    "64220",
    "64310",
    "64320",
    "64910",
    "64920",
    "64991",
    "64992",
    "64993",
    "64994",
    "64999"
  ],
  "65": [
    "65111",
    "65119",
    "65120",
    "65200",
    "65300"
  ],
  "66": [
    "66110",
    "66120",
    "66190",
    "66210",
    "66220",
    "66290",
    "66301",
    "66309"
  ],
  "68": [
    "68110",
    "68120",
    "68201",
    "68202",
    "68203",
    "68204",
    "68209",
    "68310",
    "68320"
  ],
  "69": [
    "69101",
    "69102",
    "69201",
    "69202"
  ],
  "70": [
    "70100",
    "70200"
  ],
  "71": [
    "71110",
    "71121",
    "71122",
    "71123",
    "71124",
    "71129",
    "71200"
  ],
  "72": [
    "72101",
    "72109",
    "72200"
  ],
  "73": [
    "73111",
    "73112",
    "73119",
    "73120",
    "73200",
    "73300"
  ],
  "74": [
    "74110",
    "74120",
    "74130",
    "74140",
    "74200",
    "74300",
    "74910",
    "74990"
  ],
  "75": [
    "75000"
  ],
  "77": [
    "77110",
    "77120",
    "77210",
    "77220",
    "77310",
    "77320",
    "77330",
    "77340",
    "77350",
    "77390",
    "77400",
    "77510",
    "77520"
  ],
  "78": [
    "78100",
    "78201",
    "78202"
  ],
  "79": [
    "79110",
    "79120",
    "79900"
  ],
  "80": [
    "80010",
    "80090"
  ],
  "81": [
    "81100",
    "81210",
    "81221",
    "81222",
    "81230",
    "81300"
  ],
  "82": [
    "82100",
    "82200",
    "82300",
    "82400",
    "82910",
    "82920",
    "82990"
  ],
  "84": [
    "84110",
    "84121",
    "84122",
    "84123",
    "84124",
    "84125",
    "84130",
    "84210",
    "84221",
    "84222",
    "84231",
    "84232",
    "84240",
    "84250",
    "84300"
  ],
  "85": [
    "85100",
    "85201",
    "85202",
    "85311",
    "85312",
    "85321",
    "85322",
    "85323",
    "85324",
    "85330",
    "85400",
    "85510",
    "85521",
    "85522",
    "85530",
    "85591",
    "85592",
    "85593",
    "85594",
    "85599",
    "85610",
    "85690"
  ],
  "86": [
    "86101",
    "86102",
    "86103",
    "86211",
    "86212",
    "86221",
    "86222",
    "86230",
    "86910",
    "86920",
    "86930",
    "86940",
    "86950",
    "86960",
    "86970",
    "86991",
    "86999"
  ],
  "87": [
    "87100",
    "87201",
    "87202",
    "87203",
    "87301",
    "87302",
    "87910",
    "87991",
    "87992"
  ],
  "88": [
    "88101",
    "88102",
    "88910",
    "88991",
    "88992",
    "88993",
    "88994",
    "88995"
  ],
  "90": [
    "90110",
    "90120",
    "90130",
    "90200",
    "90310",
    "90390"
  ],
  "91": [
    "91110",
    "91120",
    "91210",
    "91220",
    "91300",
    "91410",
    "91420"
  ],
  "92": [
    "92000"
  ],
  "93": [
    "93111",
    "93112",
    "93113",
    "93114",
    "93119",
    "93120",
    "93130",
    "93191",
    "93199",
    "93210",
    "93290"
  ],
  "94": [
    "94111",
    "94112",
    "94120",
    "94200",
    "94910",
    "94920",
    "94990"
  ],
  "95": [
    "95101",
    "95102",
    "95210",
    "95220",
    "95230",
    "95240",
    "95250",
    "95290",
    "95311",
    "95312",
    "95313",
    "95320",
    "95400"
  ],
  "96": [
    "96101",
    "96102",
    "96210",
    "96220",
    "96230",
    "96300",
    "96400",
    "96910",
    "96990"
  ],
  "97": [
    "97000"
  ],
  "98": [
    "98100",
    "98200"
  ],
  "99": [
    "99000"
  ],
  "00": [
    "00000"
  ],
  "01": [
    "01110",
    "01120",
    "01131",
    "01132",
    "01133",
    "01134",
    "01135",
    "01140",
    "01150",
    "01160",
    "01191",
    "01199",
    "01210",
    "01220",
    "01230",
    "01240",
    "01250",
    "01260",
    "01270",
    "01280",
    "01290",
    "01301",
    "01302",
    "01410",
    "01420",
    "01430",
    "01440",
    "01450",
    "01461",
    "01462",
    "01471",
    "01472",
    "01481",
    "01482",
    "01489",
    "01500",
    "01610",
    "01620",
    "01630",
    "01700"
  ],
  "02": [
    "02101",
    "02102",
    "02109",
    "02200",
    "02300",
    "02400"
  ],
  "03": [
    "03111",
    "03119",
    "03120",
    "03210",
    "03220",
    "03300"
  ],
  "05": [
    "05100",
    "05200"
  ],
  "06": [
    "06100",
    "06200"
  ],
  "07": [
    "07100",
    "07210",
    "07290"
  ],
  "08": [
    "08110",
    "08120",
    "08910",
    "08920",
    "08930",
    "08990"
  ],
  "09": [
    "09100",
    "09900"
  ]
};

export const TURNOVER_OPTIONS: FilterOption[] = [
  {
    "value": "0",
    "label": "< 1 tkr"
  },
  {
    "value": "1",
    "label": "1 - 499 tkr"
  },
  {
    "value": "2",
    "label": "500 - 999 tkr"
  },
  {
    "value": "3",
    "label": "1 000 - 4 999 tkr"
  },
  {
    "value": "4",
    "label": "5 000 - 9 999 tkr"
  },
  {
    "value": "5",
    "label": "10 000 - 19 999 tkr"
  },
  {
    "value": "6",
    "label": "20 000 - 49 999 tkr"
  },
  {
    "value": "7",
    "label": "50 000 - 99 999 tkr"
  },
  {
    "value": "8",
    "label": "100 000 - 499 999 tkr"
  },
  {
    "value": "9",
    "label": "500 000 - 999 999 tkr"
  },
  {
    "value": "10",
    "label": "1 000 000 - 4 999 999 tkr"
  },
  {
    "value": "11",
    "label": "5 000 000 - 9 999 999 tkr"
  },
  {
    "value": "12",
    "label": "> 9 999 999 tkr"
  }
];
