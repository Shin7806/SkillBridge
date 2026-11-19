# Security policy

## Reporting a vulnerability

Please don't open a public issue for security problems. Use GitHub's private reporting instead: **Security → Report a vulnerability** on this repository.

Include what you found, how to reproduce it, and what an attacker could do with it. You'll get a reply within a week. Please give us a reasonable time to fix the problem before you share it publicly.

## Scope

In scope: the SkillBridge web app, its database policies and functions, and its storage rules. For example, reading another member's messages, sessions, attachments or email address, or acting on someone else's swap.

Out of scope: problems in Supabase or Vercel themselves (report those to them), denial of service, and social engineering.

## How the app protects data

- Row level security on every table; business rules in `security definer` functions.
- The browser only uses the publishable key. No service-role key exists in this repository.
- Message attachments sit in a private bucket and are served through short-lived signed links, readable only by the two people in the swap.
- Members' email addresses are never returned by the API to other members.
