export const portalSteps = [
  { key: "pick_course", label: "Pick Course" },
  { key: "personal_information", label: "Personal Information" },
  { key: "education", label: "Education" },
  { key: "referees", label: "Referees" },
  { key: "credential_uploads", label: "Credential Uploads" },
  { key: "payment", label: "Payment" },
  { key: "entrance_exam", label: "Entrance Exam" },
  { key: "ministerial_interest", label: "Ministerial Interest" },
  { key: "marital_status", label: "Marital Status" },
  { key: "pledge", label: "Pledge" },
  { key: "christian_experience", label: "Christian Experience" },
  { key: "finance", label: "Finance" },
  { key: "medical_clearance", label: "Medical Clearance" },
] as const;

export type PortalStepKey = (typeof portalSteps)[number]["key"];
