name: security-best-practices

# Security Best Practices

Security guidelines for code review and implementation.

## Authentication

- Never store passwords in plain text
- Use secure password hashing (bcrypt, argon2)
- Implement rate limiting on auth endpoints
- Use secure, httpOnly cookies for sessions

## Authorization

- Validate permissions on every request
- Use principle of least privilege
- Never trust client-side authorization

## Input Validation

- Validate and sanitize all inputs
- Use parameterized queries (never string concatenation)
- Escape output based on context
- Validate file uploads

## Secrets Management

- Never commit secrets to version control
- Use environment variables
- Rotate credentials regularly
- Use secret management services in production

## Common Vulnerabilities

| Type | Prevention |
|------|------------|
| XSS | Escape output, CSP headers |
| SQL Injection | Parameterized queries |
| CSRF | Anti-CSRF tokens |
| SSRF | Validate and whitelist URLs |

## Dependencies

- Regularly update dependencies
- Audit with `npm audit`
- Monitor for CVEs
