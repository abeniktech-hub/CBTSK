import en from "../../i18n/en.json";
import fr from "../../i18n/fr.json";

export type Locale = "en" | "fr";
export type MessageKey = keyof typeof en;

const dictionaries = { en, fr };

export function translate(locale: Locale, key: MessageKey) {
  return dictionaries[locale][key];
}

const menuKeys: Record<string, MessageKey> = {
  About: "menuAbout",
  History: "menuHistory",
  "Affirmation of Faith": "menuAffirmation",
  Philosophy: "menuPhilosophy",
  "Core Values": "menuCoreValues",
  Leadership: "menuLeadership",
  Faculty: "menuFaculty",
  News: "menuNews",
  "Visit Our Campus": "menuVisitCampus",
  Academics: "menuAcademics",
  "Explore Degrees": "menuExploreDegrees",
  "2025 Graduation": "menuGraduation",
  "Sandwich Timetable": "menuSandwich",
  "Our Faculties": "menuOurFaculties",
  "Academic Calendar": "menuAcademicCalendar",
  "Accreditation and Affiliation": "menuAccreditation",
  Admissions: "menuAdmissions",
  Students: "menuStudents",
  Library: "menuLibrary",
  "Student Portal": "menuStudentPortal",
  "Women Training Centre": "menuWomenTraining",
  "Student Handbook": "menuStudentHandbook",
  "Download Help Video": "menuDownloadHelp",
  "Previous Registration": "menuPreviousRegistration",
  Newsletter: "menuNewsletter",
  "Distance Learning": "menuDistanceLearning",
  Give: "menuGive",
};

export function translateMenuLabel(locale: Locale, label: string) {
  const key = menuKeys[label];
  return key ? translate(locale, key) : label;
}

const programmeKeys: Record<string, MessageKey> = {
  ftpt: "programmeFtpt",
  "diploma-theology": "programmeDiploma",
  "ba-biblical-studies": "programmeBiblicalStudies",
  "ba-intercultural-world-mission": "programmeIntercultural",
  "ba-pastoral-care-counseling": "programmePastoralCare",
  "ma-intercultural-world-mission": "programmeIntercultural",
  "ma-leadership-administration": "programmeLeadership",
  "ma-biblical-languages": "programmeBiblicalLanguages",
  "ma-pastoral-care-counseling": "programmePastoralCare",
};

export function translateProgramme(locale: Locale, id: string, fallback: string) {
  const key = programmeKeys[id];
  return key ? translate(locale, key) : fallback;
}

export function formatLocaleDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "long",
  }).format(value);
}

export function formatLocaleNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB").format(value);
}

export function formatXaf(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(value);
}
