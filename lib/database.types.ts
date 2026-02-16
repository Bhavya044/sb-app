export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          url: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          url: string;
        };
        Update: {
          title?: string;
          url?: string;
        };
      };
    };
  };
}
