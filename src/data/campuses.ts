export type CampusId = "ndu" | "kumba" | "bafoussam";
export type CampusLanguage = "English" | "French";

export type Campus = {
  id: CampusId;
  name: string;
  role: string;
  languageOfInstruction: CampusLanguage;
  address: string;
  phone: string;
  email: string;
  mapsUrl: string;
  externalSiteUrl?: string;
};

export const campuses: Campus[] = [
  {
    id: "ndu",
    name: "Ndu",
    role: "Main Campus",
    languageOfInstruction: "English",
    address: "TODO: confirm official Ndu Campus address",
    phone: "TODO: confirm official Ndu Campus phone",
    email: "TODO: confirm official Ndu Campus email",
    mapsUrl: "TODO: add verified Ndu Campus Google Maps URL",
    externalSiteUrl: "https://cbtsn.net/",
  },
  {
    id: "kumba",
    name: "Kumba",
    role: "TODO: confirm Kumba Campus role",
    languageOfInstruction: "English",
    address: "TODO: confirm official Kumba Campus address",
    phone: "TODO: confirm official Kumba Campus phone",
    email: "TODO: confirm official Kumba Campus email",
    mapsUrl: "TODO: add verified Kumba Campus Google Maps URL",
  },
  {
    id: "bafoussam",
    name: "Bafoussam",
    role: "TODO: confirm Bafoussam Campus role",
    languageOfInstruction: "French",
    address: "TODO: confirm official Bafoussam Campus address",
    phone: "TODO: confirm official Bafoussam Campus phone",
    email: "TODO: confirm official Bafoussam Campus email",
    mapsUrl: "TODO: add verified Bafoussam Campus Google Maps URL",
  },
];
