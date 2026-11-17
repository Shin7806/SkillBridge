-- SkillBridge redesign 04: the parked legacy tables must not be reachable by API roles (REST or GraphQL).
revoke all on all tables in schema legacy from public, anon, authenticated;
alter default privileges in schema legacy revoke all on tables from public, anon, authenticated;
