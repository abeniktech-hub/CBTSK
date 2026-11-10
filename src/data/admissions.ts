import { fees, formatFee } from "./fees";

export type Requirement = { n: number; text: string };
export type AdmissionProgram = {
  id: "ma" | "ba" | "diploma";
  label: string;
  intro?: string;
  leadIn: string;
  requirements: Requirement[];
};

// TODO: The MA list skips item 8 in the source; preserve its original numbering.
// TODO: The source writes the currency as both "CFA" and "cfa"; preserve each displayed form.
// TODO: "WVI" is not expanded in the source.
export const admissionPrograms: AdmissionProgram[] = [
  {
    id: "ma",
    label: "Master of Arts",
    intro:
      "This is a three years program for holders of bachelors in non-theological fields seeking to further their studies in any of the options offered at CBTS. Such will need a years' worth of work to enable them gain the foundation for their studies raising their program to three years. Holders of bachelors in theological fields will have a direct two year program of study in their respective areas of specialization.",
    leadIn: "The following are required for admission into the MA program:",
    requirements: [
      { n: 1, text: "A completed application form (obtained from the Academic Office or from the website)" },
      { n: 2, text: "Bachelor's degree from a recognized institution" },
      { n: 3, text: "Sound Christian maturity and a sense of calling to serve the wider Church, in the form of a written Christian testimony" },
      { n: 4, text: "Medical examination (forms from the Academic Office)" },
      { n: 5, text: "Two colleagues' recommendations (forms from the Academic Office or CBTSK website)" },
      { n: 6, text: "A Church leader's recommendation (forms from the Academic Office or CBTS website)" },
      { n: 7, text: "Professional recommendation (forms from the Academic Office or online)" },
      { n: 9, text: "Official transcripts or certificates from institutions previously attended." },
      {
        n: 10,
        text: `A non-refundable application fee of ${formatFee(fees.masterOfArts.internalStudents.amount, fees.masterOfArts.internalStudents.currency)} (internal students) and ${formatFee(fees.masterOfArts.extensionCenterStudents.amount, fees.masterOfArts.extensionCenterStudents.currency)} (Extension Center Students)`,
      },
      { n: 11, text: "Two colored passport-sized photos" },
      { n: 12, text: "Marriage certificate (if married)" },
      { n: 13, text: "Copy of ID card" },
      { n: 14, text: "Written testimony of call into the ministry" },
      { n: 15, text: "Curriculum Vitae" },
    ],
  },
  {
    id: "ba",
    label: "Bachelor of Arts (B.A.)",
    leadIn: "The following requirements must be met to be considered for the B.A. program.",
    requirements: [
      { n: 1, text: 'Four GCE "O" level papers or equivalent' },
      { n: 2, text: 'Two "A" level papers or equivalent' },
      { n: 3, text: "Written examination administered by CBTS and interview" },
      { n: 4, text: "Copy of ID Card" },
      { n: 5, text: "Copy of Marriage Certificate (if married)" },
      { n: 6, text: "Medical examination (forms from the Academic Office)" },
      { n: 7, text: "Two colored passport-sized photos" },
      { n: 8, text: "Recommendations Forms from Pastor, Church Association and Field" },
      {
        n: 9,
        text: `A non-refundable application fee of ${formatFee(fees.bachelorOfArts.amount, fees.bachelorOfArts.currency)}`,
      },
    ],
  },
  {
    id: "diploma",
    label: "Diploma Program",
    leadIn: "",
    requirements: [
      { n: 1, text: 'Four GCE "O" level papers (or equivalent) or' },
      { n: 2, text: "A Certificate of Theology with a GPA of 75% and higher or Grade II Teacher's Certificate" },
      { n: 3, text: "An entrance examination and interview from CBTS" },
      { n: 4, text: "2 passport-sized photos" },
      { n: 5, text: "Copy of birth certificate" },
      { n: 6, text: "Copy of marriage certificate (if married)" },
      { n: 7, text: "A definite call to further training in ministry" },
      { n: 8, text: "Medical examination" },
      { n: 9, text: "Recommendations from Pastor, Church, Association, and Field" },
      {
        n: 10,
        text: `A non-refundable application fee of ${formatFee(fees.diploma.amount, fees.diploma.currency)}`,
      },
    ],
  },
];

export const applicationProcedure = [
  "The applicant must show evidence that he or she meets the academic standard required for admission into the program.",
  "The applicant must fulfill the character requirements as specified for the program in this catalogue.",
  "An applicant must complete and return all application forms along with the Recommendation Forms duly completed before the stated deadlines. All of these forms are available in the Academic Dean's office or in this catalogue (see the appropriate section of the Academic Programs section)",
];

export const registrationProcedures = [
  {
    label: "Undergraduate programs",
    body: "For all undergraduate programs (WVI, C. Th. & Dip. Th.) the General Registration Form (Form A) is filled according to the instructions provided in it. After all verifications of documents and payments, and the necessary signatures affixed, the Form A is then presented in the office of the Deputy Provost i/c Academics for the authentication of the student registration. Then the office issues a document authorizing the student to sit in class as well as share full rights and privileges as a student of CBTS for all returning students while the first year students will await matriculation.",
  },
  {
    label: "Graduate and post-graduate programs",
    body: "For all graduate and post graduate programs, each student registers with two forms (the General Registration Form – Form A and the Course Registration Form – Form B). Each student, using the Form B registers the courses assigned for the semester according to his or her concentration with the Concentration Advisor and the Academic office. Based on the credit hours registered, tuition is then calculated and filled in Form A for the rest of the registration process to follow as with the undergraduate programs.",
  },
];

export const registrationCopiesNote =
  "Upon completion of the registration process, three extra copies of the Form B will be made by the student and submitted at the Academic Secretariat for stamping. Each student keeps a copy while the Concentration Advisor, the Academic office, and the Bursary each keep a copy.";

export const addDropText =
  "Within the first week of classes, if a student must ADD or DROP a course, this will be done using the Add & Drop Form which must be attached to your Form B. The process followed will be the same as for the Form B.";

export const lateRegistrationTexts = [
  "Failure to register within the two days of registration results to a penalty which further doubles if one enters the second week before registering.",
  "Failure to register by the end of week two will be considered as withdrawal and the student will only be admitted by the following academic year. Such a student is advised to register as a part time student the following semester.",
];

export const distanceLearningTexts = [
  "Students of the DLCs can download, fill, scan and send their registration forms and or mail the hard copies to the Registrar, CBTS. These forms are obtainable from the CBTS Website. The students are expected to do a yearly registration as long as they are active students of the center.",
  "The DLC students can pay fees into the Student Account at any CBC Bursary and forward the receipt to the CBTS Bursary.",
];

export const matriculationStatements = [
  "This is the occasion in which all First year (New students) are officially accepted and integrated into the CBTS family and given full rights and privileges as students.",
  "At matriculation, every student makes a pledge to live by the standards of God's word and the rules and regulations of CBTS.",
  "Before matriculation, all students concerned must have fulfilled all registration formalities and presented all required documents otherwise, the set student forfeits his/her admission.",
];
