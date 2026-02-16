import type { Database } from "./database.types";

export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
export type BookmarkInsert = Database["public"]["Tables"]["bookmarks"]["Insert"];
export type BookmarkCreate = Omit<BookmarkInsert, "user_id">;
