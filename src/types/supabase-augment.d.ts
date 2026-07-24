// Widen Supabase's `from()` signature to accept any relation name.
// The generated Database type in src/integrations/supabase/types.ts is
// managed by the migration system and starts empty; app code references
// tables that will be created by later migrations. This module augmentation
// adds a permissive `from(string): any` overload that TypeScript picks only
// when the strict, typed overloads don't match (i.e. when the relation is
// not yet in Database['public']['Tables']).
export {};

declare module "@supabase/postgrest-js" {
  interface PostgrestClient<Database = any, ClientOptions = any, SchemaName = any, Schema = any> {
    from(relation: string): any;
    rpc(fn: string, args?: any, options?: any): any;
  }
}

declare module "@supabase/supabase-js" {
  interface SupabaseClient<Database = any, SchemaName = any, Schema = any> {
    from(relation: string): any;
    rpc(fn: string, args?: any, options?: any): any;
  }
}
