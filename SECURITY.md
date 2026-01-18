# Security Hardening Documentation

This document outlines the security measures implemented in the LiveJournal 2003 MVP to prevent common web application vulnerabilities.

## 🔒 Security Features Implemented

### 1. Input Validation & Sanitization

**Zod Schema Validation**
- All server actions use strict Zod schemas for input validation
- Character limits enforced on all user inputs
- Required fields validated at the schema level
- Type safety enforced throughout the application

**HTML Sanitization**
- DOMPurify with custom configuration sanitizes all user-generated HTML content
- Allowed HTML tags: `<b>`, `<i>`, `<u>`, `<a>`, `<p>`, `<br>`, `<strong>`, `<em>`
- Allowed attributes: `href` and `title` for links only
- All JavaScript, event handlers, and dangerous protocols removed
- XSS prevention through content sanitization

### 2. Authorization & Access Control

**Entry Ownership Enforcement**
- Only entry owners can update or delete their entries
- Ownership verified at the database level before any modifications
- Permission checks occur before validation to prevent information leakage

**Private Entry Visibility**
- Private entries only visible to their owners
- Friends-only entries treated as owner-only for MVP (stub for future)
- Database queries include security filters based on current user context

**Comment Moderation**
- Only entry owners can screen or delete comments on their entries
- Comment authors can delete their own comments
- State-based comment filtering (VISIBLE, SCREENED, DELETED)

### 3. Rate Limiting

**Anonymous User Protection**
- Anonymous comment posting rate limited to 5 comments per 15 minutes
- Rate limiting based on IP address with in-memory store
- Authenticated users exempt from rate limiting
- Graceful error messages with reset time information

### 4. Content Security

**HTML Content Filtering**
- Whitelist approach: only safe HTML elements allowed
- Dangerous elements removed: `<script>`, `<iframe>`, `<object>`, etc.
- Event handlers stripped from all elements
- JavaScript URLs and data URIs blocked
- Link safety enforced with protocol validation

## 📝 Validation Schemas

### Journal Entry Schema
```typescript
const journalEntrySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().min(1).max(50000),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS']),
  allowComments: z.boolean()
});
```

### Comment Schema
```typescript
const commentSchema = z.object({
  entryId: z.string().min(1),
  parentId: z.string().optional().nullable(),
  contentHtml: z.string().min(1).max(5000),
  authorName: z.string().min(1).max(100).optional()
});
```

### Profile Update Schema
```typescript
const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).trim(),
  bio: z.string().max(1000).optional().nullable()
});
```

## 🛡️ Security Best Practices

### Server Actions
1. **Authentication First**: Always verify user authentication before processing
2. **Authorization Second**: Check user permissions before validation
3. **Validate Third**: Apply strict input validation with Zod schemas
4. **Sanitize Fourth**: Clean all HTML content before database storage
5. **Audit Trail**: Log security-relevant actions for monitoring

### Database Security
- Use parameterized queries through Prisma ORM
- Apply least-privilege access patterns
- Include security filters in all data retrieval queries
- Validate foreign key relationships for authorization

### Content Processing Pipeline
```
User Input → Zod Validation → HTML Sanitization → Database Storage
```

## 🔍 Security Testing

### XSS Prevention Tests
- Script tag removal verification
- Event handler stripping confirmation  
- JavaScript URL blocking validation
- Safe HTML preservation checks

### Authorization Tests
- Entry ownership enforcement
- Private entry access control
- Comment moderation permissions
- Cross-user access prevention

### Rate Limiting Tests
- Anonymous user request throttling
- Authenticated user exemption
- Rate limit reset functionality
- IP-based tracking accuracy

## 🚨 Known Limitations & Future Improvements

### Current MVP Limitations
1. **Rate Limiting**: In-memory store (use Redis in production)
2. **Friends System**: Not implemented (treating as owner-only)
3. **Audit Logging**: Basic error logging only
4. **CSRF Protection**: Relies on Next.js built-in protection

### Recommended Production Enhancements
1. **Content Security Policy (CSP)**: Implement strict CSP headers
2. **Rate Limiting**: Use Redis for distributed rate limiting
3. **Session Security**: Implement session timeout and rotation
4. **Audit Logging**: Comprehensive security event logging
5. **Input Validation**: Additional server-side validation layers
6. **File Upload Security**: Virus scanning and file type validation
7. **Database Security**: Connection pooling and query monitoring

## 📋 Security Checklist

- [x] Input validation with Zod schemas
- [x] HTML sanitization with DOMPurify
- [x] Entry ownership enforcement
- [x] Private entry access control
- [x] Comment moderation permissions
- [x] Anonymous user rate limiting
- [x] XSS prevention through content filtering
- [x] Authorization checks before validation
- [x] Safe HTML whitelist approach
- [x] Comprehensive security testing

## 🔧 Security Configuration

### DOMPurify Configuration
```typescript
const ALLOWED_TAGS = ['b', 'i', 'u', 'a', 'p', 'br', 'strong', 'em'];
const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title']
};
```

### Rate Limiting Configuration
```typescript
// Anonymous comments: 5 requests per 15 minutes
const rateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (ip) => `comment_${ip}`
};
```

This security implementation provides a solid foundation for the MVP while maintaining usability and performance. Regular security reviews and updates should be conducted as the application evolves.