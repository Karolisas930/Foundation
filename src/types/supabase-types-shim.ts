// Permissive Supabase database types shim. Aliased in tsconfig for
// "@/integrations/supabase/types" so app code that references tables not
// yet reflected in the generated types file still typechecks. Once real
// tables are migrated, the generator overwrites this behavior via the
// original types.ts (drop the tsconfig path alias to re-enable strict).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AnyRow = Record<string, any>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: string };
  public: {
    Tables: {
      [key: string]: {
        Row: AnyRow;
        Insert: AnyRow;
        Update: AnyRow;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: { Row: AnyRow; Relationships: [] };
    };
    Functions: {
      [key: string]: { Args: AnyRow; Returns: any };
    };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: AnyRow };
  };
};

export type Tables<_T extends string = string> = AnyRow;
export type TablesInsert<_T extends string = string> = AnyRow;
export type TablesUpdate<_T extends string = string> = AnyRow;
export type Enums<_T extends string = string> = string;
export type CompositeTypes<_T extends string = string> = AnyRow;
export const Constants: Record<string, any> = {};
