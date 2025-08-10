# lj2003 Architecture

## Tech Stack

This project is built with a modern web development stack focused on performance and developer experience:

### Frontend Framework
- **Next.js 14** with App Router for server-side rendering, routing, and full-stack capabilities
- **TypeScript** for type safety and better developer experience
- **React 18** with modern hooks and concurrent features

### Styling
- **Tailwind CSS** for utility-first styling with custom CSS variables
- **LiveJournal 2003 Theme** implemented through CSS custom properties
- Responsive design with mobile-first approach

### Database & Authentication (Planned for MVP)
- **Prisma** as the ORM for type-safe database operations
- **SQLite** for local development and MVP deployment
- **NextAuth.js** with Credentials provider for authentication
- **bcrypt** for secure password hashing

### Development Tools
- **ESLint** for code linting and consistency
- **Prettier** for code formatting
- **TypeScript** compiler for type checking
- **Git** for version control

### Project Structure
```
lj2003/
├── src/
│   └── app/                 # Next.js App Router pages
├── docs/                    # Documentation
├── prisma/                  # Database schema and migrations (future)
└── public/                  # Static assets
```

### Design System
The project implements a nostalgic LiveJournal 2003 theme with:
- Custom CSS variables for consistent theming
- Verdana font stack for authentic early 2000s feel
- Blue and purple color palette with subtle gradients
- 700px content width with left sidebar layout
- Boxy, structured design elements

This architecture provides a solid foundation for building a modern LiveJournal-inspired application with the reliability of contemporary web technologies.