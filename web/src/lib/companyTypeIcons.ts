type CompanyTypeIconInput = {
  entity_type?: "organization" | "person" | "other" | null;
  organization_form_code?: string | null;
  legal_form_code?: string | null;
};

export type CompanyTypeIcon = {
  src: string;
  label: string;
};

const ICONS = {
  company: "/icons/menu/industry-svgrepo-com.svg",
  person: "/icons/menu/user-svgrepo-com.svg",
};

export const ORGANIZATION_FORM_ICON_BY_CODE: Record<string, CompanyTypeIcon> = {
  "AB-ORGFO": { src: ICONS.company, label: "Aktiebolag" },
  "BAB-ORGFO": { src: ICONS.company, label: "Bankaktiebolag" },
  "BF-ORGFO": { src: ICONS.company, label: "Bostadsförening" },
  "BFL-ORGFO": { src: ICONS.company, label: "Utländsk banks filial" },
  "BRF-ORGFO": { src: ICONS.company, label: "Bostadsrättsförening" },
  "E-ORGFO": { src: ICONS.person, label: "Enskild näringsverksamhet" },
  "EB-ORGFO": { src: ICONS.company, label: "Enkla bolag" },
  "EEIG-ORGFO": {
    src: ICONS.company,
    label: "Europeisk ekonomisk intressegruppering",
  },
  "EGTS-ORGFO": {
    src: ICONS.company,
    label: "Europeisk gruppering för territoriellt samarbete",
  },
  "EK-ORGFO": { src: ICONS.company, label: "Ekonomisk förening" },
  "FAB-ORGFO": { src: ICONS.company, label: "Försäkringsaktiebolag" },
  "FF-ORGFO": { src: ICONS.company, label: "Försäkringsförmedlare" },
  "FL-ORGFO": { src: ICONS.company, label: "Filial" },
  "FOF-ORGFO": { src: ICONS.company, label: "Försäkringsförening" },
  "HB-ORGFO": { src: ICONS.company, label: "Handelsbolag" },
  "I-ORGFO": {
    src: ICONS.company,
    label: "Ideell förening som bedriver näringsverksamhet",
  },
  "KB-ORGFO": { src: ICONS.company, label: "Kommanditbolag" },
  "KHF-ORGFO": { src: ICONS.company, label: "Kooperativ hyresrättsförening" },
  "MB-ORGFO": { src: ICONS.company, label: "Medlemsbank" },
  "OFB-ORGFO": { src: ICONS.company, label: "Ömsesidigt försäkringsbolag" },
  "OTPB-ORGFO": {
    src: ICONS.company,
    label: "Ömsesidigt tjänstepensionsbolag",
  },
  "S-ORGFO": {
    src: ICONS.company,
    label: "Stiftelse som bedriver näringsverksamhet",
  },
  "SB-ORGFO": { src: ICONS.company, label: "Sparbank" },
  "SCE-ORGFO": { src: ICONS.company, label: "Europakooperativ" },
  "SE-ORGFO": { src: ICONS.company, label: "Europabolag" },
  "SF-ORGFO": { src: ICONS.company, label: "Sambruksförening" },
  "TPAB-ORGFO": { src: ICONS.company, label: "Tjänstepensionsaktiebolag" },
  "TPF-ORGFO": { src: ICONS.company, label: "Tjänstepensionsförening" },
  "TSF-ORGFO": {
    src: ICONS.company,
    label: "Trossamfund som bedriver näringsverksamhet",
  },
};

export function companyTypeIcon(company: CompanyTypeIconInput): CompanyTypeIcon {
  if (company.entity_type === "person" || company.legal_form_code === "10") {
    return { src: ICONS.person, label: "Fysisk person" };
  }

  const organizationFormCode = company.organization_form_code?.trim();
  if (organizationFormCode) {
    return (
      ORGANIZATION_FORM_ICON_BY_CODE[organizationFormCode] ?? {
        src: ICONS.company,
        label: organizationFormCode,
      }
    );
  }

  return { src: ICONS.company, label: "Företag" };
}
