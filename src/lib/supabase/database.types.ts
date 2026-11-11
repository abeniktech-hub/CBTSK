export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relation = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>, Relationships extends Relation[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

type QuoteRow = {
  id: string;
  text: string;
  author: string | null;
  source: string;
  translation: string | null;
  category: string;
  lang: string;
  rights_note: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  user_id: string;
  campus_id: string | null;
  programme_id: string | null;
  matricule: string;
  matricule_status: "PROVISIONAL" | "CONFIRMED";
  matricule_confirmed_at: string | null;
  matricule_confirmed_by: string | null;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ADMITTED" | "WAITLISTED" | "REJECTED";
  exam_score: number | null;
  exam_status: "NOT_SCHEDULED" | "SCHEDULED" | "DONE";
  exam_date: string | null;
  exam_venue: string | null;
  payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  department: string;
  year_of_entry: number | null;
  created_at: string;
  submitted_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        first_name: string;
        last_name: string;
        phone: string;
        role: "APPLICANT" | "REGISTRAR" | "ADMIN";
        lang: string;
        quote_categories: string[];
      }>;
      campuses: Table<{ id: string; name: string; code: string; active: boolean }>;
      programmes: Table<{ id: string; name: string; level: string; department: string; active: boolean; required_referees: string[] }>;
      admission_cycles: Table<{ id: string; year: number; label: string; active: boolean }>;
      ministry_areas: Table<{ id: string; name: string; active: boolean }>;
      fees: Table<{ id: string; programme_level: string; amount: number; currency: string; active: boolean }>;
      payments: Table<{
        id: string;
        application_id: string;
        fee_id: string;
        amount: number;
        currency: string;
        provider: string;
        provider_reference: string | null;
        provider_checkout_url: string | null;
        status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
      }>;
      documents: Table<{
        id: string;
        application_id: string;
        owner_id: string;
        kind: string;
        storage_path: string;
        mime_type: string;
        size_bytes: number;
        scan_status: "PENDING" | "CLEAN" | "REJECTED";
      }>;
      programme_document_requirements: Table<{
        id: string;
        programme_level: string;
        document_kind: string;
        required: boolean;
        requires_married: boolean;
      }>;
      referees: Table<{ id: string; application_id: string; kind: string; status: "PENDING" | "RECEIVED"; created_at: string }>;
      matricule_history: Table<{
        id: string;
        application_id: string;
        old_value: string;
        new_value: string;
        changed_by: string;
        reason: string;
        changed_at: string;
      }>;
      applications: Table<ApplicationRow, Partial<ApplicationRow>, Partial<ApplicationRow>, [
        Relation & { foreignKeyName: "applications_campus_id_fkey"; columns: ["campus_id"]; referencedRelation: "campuses"; referencedColumns: ["id"] },
        Relation & { foreignKeyName: "applications_programme_id_fkey"; columns: ["programme_id"]; referencedRelation: "programmes"; referencedColumns: ["id"] },
      ]>;
      step_progress: Table<{
        id: string;
        application_id: string;
        step_key: string;
        status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
        data: Json;
        updated_at: string;
        created_at: string;
      }>;
      login_events: Table<{
        id: string;
        user_id: string;
        created_at: string;
        quote_id: string | null;
        quote_seen_at: string | null;
        shown_quote_ids: string[];
      }, Partial<{ id: string; user_id: string; created_at: string; quote_id: string | null; quote_seen_at: string | null; shown_quote_ids: string[] }>, Partial<{ quote_id: string | null; quote_seen_at: string | null; shown_quote_ids: string[] }>, [
        Relation & { foreignKeyName: "login_events_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] },
      ]>;
      quotes: Table<QuoteRow>;
      quote_favorites: Table<{ user_id: string; quote_id: string }, { user_id: string; quote_id: string }, Partial<{ user_id: string; quote_id: string }>, [
        Relation & { foreignKeyName: "quote_favorites_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] },
      ]>;
    };
    Views: Record<string, never>;
    Functions: {
      record_login_and_pick_quote: { Args: Record<PropertyKey, never>; Returns: QuoteRow };
      pick_another_login_quote: { Args: Record<PropertyKey, never>; Returns: QuoteRow };
      complete_application_step: { Args: { p_application_id: string; p_step_key: string; p_data: Json }; Returns: undefined };
      submit_application: { Args: { p_application_id: string }; Returns: undefined };
      admin_upsert_quote: {
        Args: {
          p_id: string | null;
          p_text: string;
          p_author: string | null;
          p_source: string;
          p_translation: string | null;
          p_category: string;
          p_lang: string;
          p_rights_note: string;
          p_status: "DRAFT" | "APPROVED" | "ARCHIVED";
        };
        Returns: string;
      };
      admin_change_matricule: { Args: { p_application_id: string; p_new_matricule: string; p_reason: string }; Returns: undefined };
      admin_set_application_status: { Args: { p_application_id: string; p_status: Database["public"]["Enums"]["application_status"] }; Returns: undefined };
      admin_update_exam: {
        Args: {
          p_application_id: string;
          p_score: number | null;
          p_exam_status: "NOT_SCHEDULED" | "SCHEDULED" | "DONE";
          p_exam_date: string | null;
          p_exam_venue: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "APPLICANT" | "REGISTRAR" | "ADMIN";
      application_status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ADMITTED" | "WAITLISTED" | "REJECTED";
      quote_status: "DRAFT" | "APPROVED" | "ARCHIVED";
      exam_status: "NOT_SCHEDULED" | "SCHEDULED" | "DONE";
    };
    CompositeTypes: Record<string, never>;
  };
};
