import { z } from "zod";

const required = z.string().trim().min(1, "This field is required.");
const optional = z.string().trim().optional().default("");

export const stepSchemas = {
  pick_course: z.object({
    campus_id: required,
    programme_level: required,
    programme_id: required,
    department: required,
    year_of_entry: z.coerce.number().int().min(2020).max(2100),
  }),
  personal_information: z.object({
    first_name: required,
    last_name: required,
    date_of_birth: required,
    gender: required,
    nationality: required,
    id_card_number: required,
    address: required,
    phone: required,
    emergency_contact: required,
  }),
  education: z.object({
    entries: z.array(z.object({
      institution: required,
      qualification: required,
      year: z.coerce.number().int().min(1900).max(2100),
      grade: required,
    })).min(1),
  }),
  referees: z.object({
    referees: z.array(z.object({
      kind: required,
      name: required,
      email: z.string().email(),
      phone: required,
    })).min(1),
  }),
  credential_uploads: z.object({ acknowledged: z.boolean().optional() }),
  payment: z.object({ acknowledged: z.boolean().optional() }),
  entrance_exam: z.object({ acknowledged: z.boolean().optional() }),
  ministerial_interest: z.object({
    areas: z.array(z.string()).min(1),
    notes: optional,
  }),
  marital_status: z.object({
    status: required,
    spouse_name: optional,
  }),
  pledge: z.object({
    agreed: z.literal(true, { errorMap: () => ({ message: "Agreement is required." }) }),
    signature: required,
  }),
  christian_experience: z.object({
    testimony: required,
    call_to_ministry: required,
    church: required,
    pastor: required,
    years: z.coerce.number().int().min(0),
    baptism: required,
  }),
  finance: z.object({
    source: required,
    sponsor_name: optional,
    sponsor_contact: optional,
  }),
  medical_clearance: z.object({ acknowledged: z.boolean().optional() }),
} as const;

export type StepSchemaKey = keyof typeof stepSchemas;
