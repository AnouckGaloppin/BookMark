CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT,
  isbn VARCHAR(13),
  cover_url TEXT,
  total_pages INTEGER
);
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  book_id UUID REFERENCES books(id),
  pages_read INTEGER,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);