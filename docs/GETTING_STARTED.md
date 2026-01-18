# Getting Started with LiveJournal 2003

A nostalgic recreation of LiveJournal circa 2003, built with modern web technologies while maintaining the authentic feel of the original platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 1. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Required environment variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Development
NODE_ENV="development"
```

**⚠️ Important**: Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

**Initialize Prisma:**
```bash
npx prisma generate
```

**Run migrations:**
```bash
npx prisma migrate dev --name init
```

**Seed the database:**
```bash
npm run seed
```

This creates sample users, entries, and comments for development.

### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) to see the application.

## 👤 Default Test Accounts

After seeding, you can log in with these accounts:

### User: `alice`
- **Username:** `alice`
- **Password:** `password123`
- **Display Name:** Alice Johnson
- **Email:** alice@example.com

### User: `bob`  
- **Username:** `bob`
- **Password:** `password123`
- **Display Name:** Bob Smith
- **Email:** bob@example.com

### User: `carol`
- **Username:** `carol`
- **Password:** `password123`
- **Display Name:** Carol Davis
- **Email:** carol@example.com

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── journal/           # Journal pages & entry routes
│   ├── profile/           # User profile management
│   └── api/               # API routes (file uploads)
├── components/            # React components
│   ├── Calendar.tsx       # Calendar navigation
│   ├── CommentThread.tsx  # Threaded comments
│   ├── EntryCard.tsx      # Journal entry display
│   ├── Sidebar.tsx        # Left navigation
│   ├── TopBar.tsx         # Header navigation
│   └── UserSidebar.tsx    # User info sidebar
├── lib/
│   ├── actions/           # Server actions
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   └── validation.ts      # Input validation & sanitization
└── globals.css            # LiveJournal 2003 authentic styling
```

## 🗄️ Database Schema

The application uses SQLite with Prisma ORM:

- **User**: User accounts with authentication
- **Entry**: Journal entries with privacy levels
- **Comment**: Threaded comments with moderation
- **Account/Session**: NextAuth session management

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## 📊 Database Management

### View Database
```bash
npx prisma studio
```
Opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

### Reset Database
```bash
npx prisma migrate reset
npm run seed
```

### Create New Migration
```bash
npx prisma migrate dev --name your-migration-name
```

## 🎨 Features Included

### ✅ Implemented
- **User Authentication**: Registration, login, logout
- **Journal Entries**: Create, edit, delete with privacy levels
- **Threaded Comments**: Nested comments with moderation
- **User Profiles**: Edit display name, bio, userpic upload
- **LiveJournal 2003 Theme**: Authentic styling and layout
- **Security Hardening**: XSS prevention, input validation, rate limiting
- **Entry Privacy**: Public, private, friends-only (stub)
- **Comment Moderation**: Screen, delete by entry owner
- **Responsive Design**: Works on desktop and mobile

### 🔒 Security Features  
- Zod schema validation on all forms
- HTML sanitization (XSS prevention)
- Entry ownership enforcement
- Private entry visibility controls
- Rate limiting for anonymous comments
- Comprehensive security testing

## 🎯 Core User Flows

### 1. New User Registration
1. Visit `/register`
2. Create account with username, email, password
3. Automatically logged in and redirected to profile

### 2. Create Journal Entry
1. Click "Post New Entry" from journal page
2. Write entry with subject/content
3. Choose privacy level (Public/Private/Friends)
4. Submit to publish

### 3. Comment on Entry
1. Visit any public entry
2. Scroll to comments section
3. Write comment (authenticated or anonymous)
4. Submit to post

### 4. Profile Management
1. Click "Edit Personal Info" in sidebar
2. Update display name, bio
3. Upload userpic (100×100px recommended)
4. Save changes

## 🐛 Troubleshooting

### Common Issues

**"Database locked" error:**
```bash
rm prisma/dev.db*
npx prisma migrate dev --name init
npm run seed
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Authentication issues:**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your local URL
- Clear browser cookies for localhost

**Styling issues:**
- Check if Tailwind CSS is working
- Verify `globals.css` is imported
- Clear browser cache

### Getting Help

1. Check the [Security Documentation](../SECURITY.md)
2. Review [Database Schema](../prisma/schema.prisma)
3. Look at [Sample Seed Data](../prisma/seed.ts)
4. Check browser developer tools for client errors
5. Check terminal output for server errors

## 🚀 Production Deployment

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

### Build and Deploy
```bash
npm run build
npm start
```

### Database Migration in Production
```bash
npx prisma migrate deploy
```

---

**Happy Journaling!** 📝 Welcome to LiveJournal 2003 - where the web was young and blogging was personal.