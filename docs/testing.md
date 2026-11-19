# Testing

## Before every pull request

```bash
npm run typecheck
npm run build
```

CI runs both on every push and pull request.

## End-to-end test

`scripts/e2e.mjs` signs in as three test users and runs the real flows through the same API the app uses: matching, proposals, chat including realtime delivery, sessions, Asks, privacy, blocking, and what anonymous visitors can and can't read.

It writes to the Supabase project in your `.env`, so point it at a development project, not production data you care about.

1. Create three users in that project, for example `alice@skillbridge.test`, `ben@skillbridge.test` and `cara@skillbridge.test`, all with the same password, and confirm their emails.
2. Create `.env.test` (it is git-ignored):

   ```bash
   E2E_PASSWORD=choose-a-test-password
   E2E_ALICE=alice@skillbridge.test
   E2E_BEN=ben@skillbridge.test
   E2E_CARA=cara@skillbridge.test
   ```

3. Run it:

   ```bash
   npm run test:e2e
   ```

Each run starts by resetting what earlier runs left behind: it ends open swaps, unblocks the test users and deletes their Asks. Ended swaps and their messages stay in the database. Accounts ending in `@skillbridge.test` are left out of the public member count, so use that domain for test users.
