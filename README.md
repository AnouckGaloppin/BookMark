# BookMark

BookMark is a web application for tracking, searching, and managing your personal book collection. It allows users to search for books, add them to their collection, track reading progress, and view detailed information about each book.

## Features
- User authentication (login/signup)
- Search for books using Open Library
- Add books to your personal collection
- Track reading progress for each book
- View book details, including cover, author, and page count
- Remove books from your collection
- Responsive design for desktop and mobile
- Toast notifications for user actions

## Tech Stack
- **Frontend/Backend:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit
- **Database & Auth:** Supabase
- **UI Components:** Custom React components, Lucide icons
- **Notifications:** Sonner
- **Deployment:** Docker, Docker Compose, GitHub Actions (see DEPLOYMENT.md)

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Supabase account and project

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnouckGaloppin/BookMark.git
   cd BookMark/booktracker
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` (if provided) or create `.env.local`.
   - Add your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```
4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure
- `src/` — Main application source code
  - `app/` — Next.js app directory (pages, routes)
  - `components/` — Reusable React components
  - `lib/` — Utility libraries and Redux store
- `public/` — Static assets (images, icons)
- `supabase/` — Supabase configuration and migrations
- `Dockerfile`, `docker-compose.yml` — For containerized deployment

## Usage Notes
- You need a Supabase project with the required tables and API keys.
- For deployment and CI/CD instructions, see `DEPLOYMENT.md`.
- The app is designed to be easily deployed to AWS EC2 or similar cloud platforms.

## License
This project is licensed under the MIT License.

---
For deployment, troubleshooting, and advanced configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).
