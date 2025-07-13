// src/types.ts

export type Book = {
  id: string;
  title: string;
  author: string;
  user_id?: string;
  cover_image?: string | null;
  total_pages?: number;
  isbn?: string | null;
};

export type BookSubscription = {
  new: Book;
  old?: Book;
};

export type Results = {
  title: string;
  author: string;
  isbn?: string;
  cover?: string | null;
  total_pages?: number;
};

export type UserBooks = Book[]; 