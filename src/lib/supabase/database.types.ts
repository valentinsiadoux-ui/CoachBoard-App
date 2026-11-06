/**
 * Types de la base, écrits à la main d'après supabase/migrations.
 * À remplacer par `supabase gen types typescript` une fois le projet relié.
 * Seules les colonnes lues ou écrites par l'application sont détaillées.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ClubRole = "admin" | "coach";

type ContentRow = { id: string; club_id: string | null; author_id: string | null; content: Json; created_at: string; updated_at: string };

type ContentTable<Generated> = {
  Row: ContentRow & Generated;
  Insert: { id?: string; club_id: string | null; content: Json };
  Update: { club_id?: string | null; content?: Json };
  Relationships: [];
};

/** Colonnes générées depuis `content` (lecture et filtres uniquement). */
type ExerciseGenerated = {
  slug: string;
  title: string;
  themes: string[];
  age_from: number;
  age_to: number;
  difficulty: string;
  space: string;
  court: string;
  duration_min: number;
  duration_max: number;
  players_min: number;
  players_max: number;
  search: unknown;
};

type SessionGenerated = { number: number; title: string; category: number; duration_min: number };

export type Database = {
  public: {
    Tables: {
      exercises: ContentTable<ExerciseGenerated>;
      sessions: ContentTable<SessionGenerated>;
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string };
        Insert: never;
        Update: { display_name?: string | null };
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string; user_id: string; kind: "exercise" | "session"; status: "ok" | "invalid" | "refused" | "error";
          model: string; attempts: number; input_tokens: number; output_tokens: number; created_at: string;
        };
        Insert: {
          kind: "exercise" | "session"; status: "ok" | "invalid" | "refused" | "error";
          model: string; attempts?: number; input_tokens?: number; output_tokens?: number;
        };
        Update: never;
        Relationships: [];
      };
      clubs: {
        Row: { id: string; name: string; invite_code: string; created_at: string };
        Insert: never;
        Update: { name?: string; invite_code?: string };
        Relationships: [];
      };
      club_members: {
        Row: { club_id: string; user_id: string; role: ClubRole; joined_at: string };
        Insert: never;
        Update: { role?: ClubRole };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_club: { Args: { club_name: string }; Returns: { id: string; name: string; invite_code: string; created_at: string } };
      join_club: { Args: { code: string }; Returns: string };
    };
    Enums: { club_role: ClubRole };
    CompositeTypes: { [_ in never]: never };
  };
};
