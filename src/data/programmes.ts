import type { CampusId } from "./campuses";

export type ProgrammeLevel =
  | "Fundamental Pastoral Training"
  | "Diploma"
  | "Bachelor of Arts"
  | "Master of Arts";

export type Programme = {
  id: string;
  name: string;
  level: ProgrammeLevel;
  campuses?: CampusId[];
};

export const programmeLevels: ProgrammeLevel[] = [
  "Fundamental Pastoral Training",
  "Diploma",
  "Bachelor of Arts",
  "Master of Arts",
];

export const programmes: Programme[] = [
  { id: "ftpt", name: "Fundamental Pastoral Training (FTPT)", level: "Fundamental Pastoral Training" },
  { id: "diploma-theology", name: "Diploma in Theology", level: "Diploma" },
  { id: "ba-biblical-studies", name: "Biblical Studies", level: "Bachelor of Arts" },
  { id: "ba-intercultural-world-mission", name: "Intercultural Studies and World Mission", level: "Bachelor of Arts" },
  { id: "ba-pastoral-care-counseling", name: "Pastoral Care and Counseling", level: "Bachelor of Arts" },
  { id: "ma-intercultural-world-mission", name: "Intercultural Studies and World Mission", level: "Master of Arts" },
  { id: "ma-leadership-administration", name: "Leadership and Administration", level: "Master of Arts" },
  { id: "ma-biblical-languages", name: "Biblical Languages", level: "Master of Arts" },
  { id: "ma-pastoral-care-counseling", name: "Pastoral Care and Counseling", level: "Master of Arts" },
];
