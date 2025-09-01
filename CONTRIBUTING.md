# Contributing to Mood Therapist

Thank you for your interest in contributing to the Mood Therapist project! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate of others
- Focus on what is best for the community
- Show empathy towards other community members
- Be collaborative and constructive in discussions
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information** including:
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Screenshots or error messages
   - Browser/device information
   - Environment details

### Suggesting Features

For feature requests:

1. **Check existing feature requests** first
2. **Describe the use case** and why it's needed
3. **Provide detailed specifications** if possible
4. **Consider the scope** - does it align with project goals?

### Pull Requests

#### Before You Start

1. **Fork the repository** and create your branch from `main`
2. **Check the issue tracker** to see if someone is already working on it
3. **Comment on the issue** to let others know you're working on it

#### Development Process

1. **Set up your development environment**
   ```bash
   git clone https://github.com/your-username/mood-therapist.git
   cd mood-therapist
   npm install
   cp .env.example .env.local
   # Fill in your API keys
   npm run dev
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run build
   npm run lint
   # Manual testing checklist
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

#### Pull Request Guidelines

- **Use descriptive titles** that explain what the PR does
- **Reference related issues** using keywords like "Fixes #123"
- **Provide detailed description** of changes made
- **Include screenshots** for UI changes
- **Add tests** if introducing new functionality
- **Update documentation** if needed
- **Keep PRs focused** - one feature/fix per PR

## Development Guidelines

### Code Style

#### TypeScript
- Use strict TypeScript settings
- Define proper interfaces for all data
- Avoid `any` types - use specific types or `unknown`
- Use meaningful variable and function names

```typescript
// ✅ Good
interface UserMessage {
  id: string;
  content: string;
  timestamp: Date;
  userId: string;
}

// ❌ Bad
const data: any = {};
```

#### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Handle loading and error states
- Use semantic HTML elements

```tsx
// ✅ Good
const ChatMessage: React.FC<{ message: UserMessage }> = ({ message }) => {
  return (
    <article className="message">
      <p>{message.content}</p>
      <time>{message.timestamp.toLocaleString()}</time>
    </article>
  );
};

// ❌ Bad
const ChatMessage = (props: any) => {
  return <div>{props.message}</div>;
};
```

#### CSS/Tailwind
- Use utility-first approach with Tailwind
- Maintain consistent spacing scale
- Ensure accessibility (contrast, focus states)
- Make responsive designs

```tsx
// ✅ Good
<button className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
  Send Message
</button>

// ❌ Bad
<button style={{background: 'blue', color: 'white'}}>
  Send
</button>
```

### Testing

#### Manual Testing Checklist
- [ ] Authentication flow works
- [ ] Chat functionality works
- [ ] Voice input works (with permissions)
- [ ] Music recommendations display
- [ ] News articles load properly
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Accessibility (keyboard navigation, screen readers)

#### Automated Testing (Future)
When we implement automated testing:

```typescript
// Example test structure
describe('ChatInterface', () => {
  it('should send a message when form is submitted', () => {
    // Test implementation
  });
  
  it('should handle voice input errors gracefully', () => {
    // Test implementation
  });
});
```

### Documentation

#### Code Documentation
- Add JSDoc comments for complex functions
- Document API endpoints
- Explain business logic

```typescript
/**
 * Generates an AI response using Gemini based on user message and chat history
 * @param message - The user's input message
 * @param chatHistory - Previous conversation context
 * @returns Promise containing bot response, mood, and external content
 */
export async function getBotResponse(
  message: string, 
  chatHistory: ChatHistory
): Promise<BotResponse> {
  // Implementation...
}
```

#### README Updates
- Keep installation instructions current
- Update feature lists
- Add troubleshooting for new issues

## Project Structure

Understanding the codebase:

```
mood-therapist/
├── app/                    # Next.js app directory
│   ├── actions.ts         # Server actions (API logic)
│   ├── api/              # API routes
│   ├── chat/             # Chat page
│   └── login/            # Authentication page
├── lib/                   # Shared utilities
│   ├── AuthContext.tsx   # Authentication context
│   └── supabaseClient.ts # Database client
├── docs/                  # Documentation
├── supabase/             # Database migrations
└── types/                # TypeScript definitions
```

## API Guidelines

### Server Actions
- Handle errors gracefully
- Validate input parameters
- Return consistent response formats
- Log important events

```typescript
export async function serverAction(input: string) {
  try {
    // Validate input
    if (!input || input.trim().length === 0) {
      return { error: 'Input is required' };
    }
    
    // Process request
    const result = await processInput(input);
    
    // Return success response
    return { success: true, data: result };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Internal server error' };
  }
}
```

### External API Integration
- Implement proper error handling
- Add fallback responses
- Respect rate limits
- Cache responses when appropriate

## Database Guidelines

### Migration Files
- Use descriptive names with timestamps
- Include both up and down migrations
- Test migrations on staging first
- Document schema changes

### Queries
- Use parameterized queries
- Implement proper error handling
- Consider performance implications
- Use indexes appropriately

## Security Guidelines

### Environment Variables
- Never commit API keys or secrets
- Use different keys for development/production
- Validate environment variables on startup
- Document required environment variables

### Input Validation
- Validate all user inputs
- Sanitize data before database operations
- Use TypeScript for compile-time validation
- Implement rate limiting for API endpoints

### Authentication
- Use Supabase Row Level Security
- Validate user sessions on server actions
- Handle authentication errors gracefully
- Implement proper logout functionality

## Release Process

### Version Numbering
We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Release Checklist
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Create git tag
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Create GitHub release

## Getting Help

### Resources
- **Documentation**: Check `/docs` folder
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for help in pull requests

### Communication
- Be clear and specific about issues
- Provide minimal reproducible examples
- Share relevant error messages and logs
- Include environment details when relevant

### Mentorship
If you're new to contributing:
- Look for issues labeled "good first issue"
- Ask questions in issues or discussions
- Request code review and feedback
- Pair with experienced contributors

## Recognition

Contributors will be recognized in:
- README.md contributor section
- GitHub contributor graphs
- Release notes for significant contributions
- Project documentation

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to mental health and well-being! 🙏**
