import { 
  sanitizeHtml, 
  journalEntrySchema, 
  commentSchema, 
  profileUpdateSchema,
  checkRateLimit 
} from '@/lib/validation';

describe('HTML Sanitization', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <b>world</b> <i>test</i> <u>underline</u></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <b>world</b> <i>test</i> <u>underline</u></p>');
  });

  it('should allow safe links with href attributes', () => {
    const input = '<p><a href="https://example.com" title="Example">Link</a></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p><a href="https://example.com" title="Example">Link</a></p>');
  });

  it('should remove dangerous script tags', () => {
    const input = '<p>Safe content</p><script>alert("XSS")</script>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Safe content</p>');
  });

  it('should remove event handlers', () => {
    const input = '<p onclick="alert(\'XSS\')">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Click me</p>');
  });

  it('should remove dangerous attributes from links', () => {
    const input = '<a href="javascript:alert(\'XSS\')" onclick="alert(\'XSS\')">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<a>Link</a>');
  });

  it('should preserve line breaks', () => {
    const input = '<p>Line 1<br>Line 2</p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Line 1<br>Line 2</p>');
  });
});

describe('Journal Entry Validation', () => {
  it('should validate a proper journal entry', () => {
    const input = {
      title: 'My Test Entry',
      content: '<p>This is my journal entry content.</p>',
      visibility: 'PUBLIC',
      allowComments: true
    };
    
    expect(() => journalEntrySchema.parse(input)).not.toThrow();
  });

  it('should reject empty title', () => {
    const input = {
      title: '',
      content: '<p>Content</p>',
      visibility: 'PUBLIC',
      allowComments: true
    };
    
    expect(() => journalEntrySchema.parse(input)).toThrow();
  });

  it('should reject overly long title', () => {
    const input = {
      title: 'a'.repeat(201),
      content: '<p>Content</p>',
      visibility: 'PUBLIC',
      allowComments: true
    };
    
    expect(() => journalEntrySchema.parse(input)).toThrow();
  });

  it('should reject empty content', () => {
    const input = {
      title: 'Title',
      content: '',
      visibility: 'PUBLIC',
      allowComments: true
    };
    
    expect(() => journalEntrySchema.parse(input)).toThrow();
  });

  it('should reject invalid visibility', () => {
    const input = {
      title: 'Title',
      content: '<p>Content</p>',
      visibility: 'INVALID',
      allowComments: true
    };
    
    expect(() => journalEntrySchema.parse(input)).toThrow();
  });
});

describe('Comment Validation', () => {
  it('should validate a proper comment', () => {
    const input = {
      entryId: 'entry-123',
      contentHtml: '<p>This is a comment</p>',
      authorName: 'Anonymous User'
    };
    
    expect(() => commentSchema.parse(input)).not.toThrow();
  });

  it('should reject empty content', () => {
    const input = {
      entryId: 'entry-123',
      contentHtml: '',
      authorName: 'Anonymous User'
    };
    
    expect(() => commentSchema.parse(input)).toThrow();
  });

  it('should reject overly long content', () => {
    const input = {
      entryId: 'entry-123',
      contentHtml: 'a'.repeat(5001),
      authorName: 'Anonymous User'
    };
    
    expect(() => commentSchema.parse(input)).toThrow();
  });

  it('should reject missing entryId', () => {
    const input = {
      entryId: '',
      contentHtml: '<p>Comment</p>',
      authorName: 'Anonymous User'
    };
    
    expect(() => commentSchema.parse(input)).toThrow();
  });
});

describe('Profile Update Validation', () => {
  it('should validate a proper profile update', () => {
    const input = {
      displayName: 'John Doe',
      bio: '<p>This is my bio</p>'
    };
    
    expect(() => profileUpdateSchema.parse(input)).not.toThrow();
  });

  it('should reject empty display name', () => {
    const input = {
      displayName: '',
      bio: 'Bio content'
    };
    
    expect(() => profileUpdateSchema.parse(input)).toThrow();
  });

  it('should reject overly long display name', () => {
    const input = {
      displayName: 'a'.repeat(101),
      bio: 'Bio content'
    };
    
    expect(() => profileUpdateSchema.parse(input)).toThrow();
  });

  it('should reject overly long bio', () => {
    const input = {
      displayName: 'John Doe',
      bio: 'a'.repeat(1001)
    };
    
    expect(() => profileUpdateSchema.parse(input)).toThrow();
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    jest.clearAllMocks();
  });

  it('should allow requests within limit', () => {
    const result1 = checkRateLimit('test-user', 3, 60000);
    const result2 = checkRateLimit('test-user', 3, 60000);
    const result3 = checkRateLimit('test-user', 3, 60000);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    // Use up all allowed requests
    checkRateLimit('test-user', 2, 60000);
    checkRateLimit('test-user', 2, 60000);
    
    // This should be blocked
    const result = checkRateLimit('test-user', 2, 60000);
    expect(result.success).toBe(false);
    expect(result.resetTime).toBeDefined();
  });

  it('should reset after window expires', () => {
    // Mock Date.now to simulate time passage
    const originalNow = Date.now;
    let mockTime = 1000000;
    
    Date.now = jest.fn(() => mockTime);

    // Use up all requests
    checkRateLimit('test-user', 1, 1000);
    const blocked = checkRateLimit('test-user', 1, 1000);
    expect(blocked.success).toBe(false);

    // Advance time beyond window
    mockTime += 2000;
    
    const afterReset = checkRateLimit('test-user', 1, 1000);
    expect(afterReset.success).toBe(true);

    // Restore original Date.now
    Date.now = originalNow;
  });
});