// End-to-end test of the SkillBridge backend through the same HTTP API the app uses.
// Three real (test) accounts: Alice and Ben are a reciprocal match, Cara is an outsider.
// Usage: npm run test:e2e   (needs .env and .env.test)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* optional file */
  }
}
loadEnv(".env");
loadEnv(".env.test");

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const PASSWORD = process.env.E2E_PASSWORD;
if (!URL || !KEY || !PASSWORD) {
  console.error("Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or E2E_PASSWORD (.env / .env.test).");
  process.exit(2);
}

let passed = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL  ${name} ${detail}`);
  }
}
const rejects = async (name, promise) => {
  const { error } = await promise;
  check(name, !!error, error ? "" : "(was allowed)");
};
const must = async (name, promise) => {
  const { data, error } = await promise;
  check(name, !error, error?.message ?? "");
  return data;
};

async function login(email) {
  const client = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  client.realtime.setAuth(data.session.access_token);
  return { client, id: data.user.id };
}

const skillId = async (client, name) => (await client.rpc("add_skill", { p_name: name })).data.id;
const inHours = (h) => new Date(Date.now() + h * 3600_000).toISOString();

async function main() {
  console.log("Signing in three test accounts");
  const alice = await login(process.env.E2E_ALICE);
  const ben = await login(process.env.E2E_BEN);
  const cara = await login(process.env.E2E_CARA);
  const anon = createClient(URL, KEY, { auth: { persistSession: false } });

  console.log("Reset from earlier runs");
  for (const [me, other] of [[alice, ben], [ben, alice]]) await me.client.rpc("unblock_user", { p_user: other.id });
  for (const u of [alice, ben, cara]) {
    const { data: swaps } = await u.client.rpc("my_swaps");
    for (const s of swaps ?? []) {
      if (s.status === "accepted") await u.client.rpc("end_swap", { p_swap: s.id });
      if (s.status === "proposed" && s.i_proposed) await u.client.rpc("cancel_swap", { p_swap: s.id });
      if (s.status === "proposed" && !s.i_proposed) await u.client.rpc("respond_to_swap", { p_swap: s.id, p_accept: false });
    }
    await u.client.from("asks").delete().eq("author_id", u.id);
    await u.client.from("profiles").update({ is_discoverable: true }).eq("id", u.id);
  }

  console.log("Onboarding");
  const python = await skillId(alice.client, "Python");
  const photoshop = await skillId(alice.client, "  adobe   PHOTOSHOP ");
  const guitar = await skillId(cara.client, "Guitar");
  const spanish = await skillId(cara.client, "Spanish");
  check("add_skill normalises case and spacing to the existing skill", !!photoshop && photoshop !== python);
  await rejects("add_skill rejects junk names", alice.client.rpc("add_skill", { p_name: "<script>" }));
  await rejects("same skill on both lists is rejected",
    alice.client.rpc("set_my_skills", { p_teach: [{ skill_id: python }], p_learn: [{ skill_id: python }] }));
  await must("alice saves skills", alice.client.rpc("set_my_skills", { p_teach: [{ skill_id: python, level: "advanced" }], p_learn: [{ skill_id: photoshop, level: "beginner" }] }));
  await must("ben saves skills", ben.client.rpc("set_my_skills", { p_teach: [{ skill_id: photoshop, level: "intermediate" }], p_learn: [{ skill_id: python }] }));
  await must("cara saves skills", cara.client.rpc("set_my_skills", { p_teach: [{ skill_id: guitar }], p_learn: [{ skill_id: spanish }] }));
  for (const [name, u] of [["alice", alice], ["ben", ben], ["cara", cara]]) await must(`${name} completes onboarding`, u.client.rpc("complete_onboarding"));
  await rejects("client cannot flip onboarding_completed directly",
    alice.client.from("profiles").update({ onboarding_completed: false }).eq("id", alice.id));

  console.log("Anonymous access");
  const anonProfiles = await anon.from("profiles").select("id").limit(1);
  check("anonymous cannot read profiles", !!anonProfiles.error || anonProfiles.data.length === 0);
  const anonSwaps = await anon.from("swaps").select("id").limit(1);
  check("anonymous cannot read swaps", !!anonSwaps.error || anonSwaps.data.length === 0);
  await rejects("anonymous cannot call find_matches", anon.rpc("find_matches"));
  const stats = await must("anonymous can read public stats", anon.rpc("public_stats"));
  check("public stats are three numbers", stats && ["members", "swaps", "skills"].every((k) => Number.isInteger(stats[k])));
  const list = await anon.storage.from("avatars").list("", { limit: 5 });
  check("anonymous cannot list avatars", !!list.error || (list.data ?? []).length === 0);

  console.log("Matching");
  const matches = (await must("alice finds matches", alice.client.rpc("find_matches"))) ?? [];
  const mBen = matches.find((m) => m.id === ben.id);
  check("ben is a two-way match for alice", mBen?.kind === "two_way");
  check("match explains the exact skills", mBen?.they_teach?.[0]?.name === "Adobe Photoshop" && mBen?.they_want?.[0]?.name === "Python");
  check("two-way matches are listed first", matches.findIndex((m) => m.kind !== "two_way") === -1 || matches.findIndex((m) => m.kind !== "two_way") > matches.findIndex((m) => m.id === ben.id));
  check("cara is not a match for alice", !matches.some((m) => m.id === cara.id));
  const explore = (await must("explore by skill", alice.client.rpc("explore_people", { p_query: "guitar" }))) ?? [];
  check("explore finds cara by what she teaches", explore.some((p) => p.id === cara.id));

  console.log("Proposing a swap");
  await rejects("cannot propose to yourself", alice.client.rpc("propose_swap", { p_recipient: alice.id, p_offered_skill: python, p_requested_skill: photoshop }));
  await rejects("cannot offer a skill you do not teach", alice.client.rpc("propose_swap", { p_recipient: ben.id, p_offered_skill: guitar, p_requested_skill: photoshop }));
  await rejects("cannot request a skill they do not teach", alice.client.rpc("propose_swap", { p_recipient: ben.id, p_offered_skill: python, p_requested_skill: guitar }));
  const swapId = await must("alice proposes to ben", alice.client.rpc("propose_swap", { p_recipient: ben.id, p_offered_skill: python, p_requested_skill: photoshop, p_message: "Swap Python for Photoshop?", p_cadence: "Weekly, 45 min" }));
  await rejects("duplicate proposal is rejected", alice.client.rpc("propose_swap", { p_recipient: ben.id, p_offered_skill: python, p_requested_skill: photoshop }));
  await rejects("ben cannot counter-propose while one is open", ben.client.rpc("propose_swap", { p_recipient: alice.id, p_offered_skill: photoshop, p_requested_skill: python }));
  check("outsider cannot see the swap", ((await cara.client.from("swaps").select("id").eq("id", swapId)).data ?? []).length === 0);
  await rejects("outsider cannot accept it", cara.client.rpc("respond_to_swap", { p_swap: swapId, p_accept: true }));
  await rejects("proposer cannot accept their own proposal", alice.client.rpc("respond_to_swap", { p_swap: swapId, p_accept: true }));
  await rejects("no messages before acceptance", alice.client.from("messages").insert({ swap_id: swapId, sender_id: alice.id, body: "too early" }));
  const benNotifs = (await ben.client.from("notifications").select("type, swap_id").eq("swap_id", swapId)).data ?? [];
  check("ben is notified of the proposal", benNotifs.some((n) => n.type === "swap_proposed"));
  await must("ben accepts", ben.client.rpc("respond_to_swap", { p_swap: swapId, p_accept: true }));
  await rejects("a proposal cannot be answered twice", ben.client.rpc("respond_to_swap", { p_swap: swapId, p_accept: false }));
  const aliceNotifs = (await alice.client.from("notifications").select("type").eq("swap_id", swapId)).data ?? [];
  check("alice is notified of the acceptance", aliceNotifs.some((n) => n.type === "swap_accepted"));

  console.log("Chat (with realtime)");
  let delivered = null;
  const channel = ben.client.channel("e2e-messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `swap_id=eq.${swapId}` }, (p) => { delivered = p.new; });
  // SUBSCRIBED fires before the database listener is attached; wait for the server's confirmation.
  await new Promise((resolve) => {
    channel.on("system", {}, (p) => p.extension === "postgres_changes" && p.status === "ok" && resolve());
    channel.subscribe();
    setTimeout(resolve, 8000);
  });
  await must("alice sends a message", alice.client.from("messages").insert({ swap_id: swapId, sender_id: alice.id, body: "Hi Ben, when are you free?" }));
  for (let i = 0; i < 40 && !delivered; i++) await new Promise((r) => setTimeout(r, 250));
  check("ben receives it over realtime", delivered?.body === "Hi Ben, when are you free?");
  await ben.client.removeChannel(channel);
  await rejects("cannot send as someone else", alice.client.from("messages").insert({ swap_id: swapId, sender_id: ben.id, body: "spoof" }));
  await rejects("empty message is rejected", alice.client.from("messages").insert({ swap_id: swapId, sender_id: alice.id, body: "   " }));
  check("outsider reads no messages", ((await cara.client.from("messages").select("id").eq("swap_id", swapId)).data ?? []).length === 0);
  await rejects("outsider cannot post", cara.client.from("messages").insert({ swap_id: swapId, sender_id: cara.id, body: "hello?" }));
  let benSwap = (await ben.client.rpc("my_swaps", { p_swap: swapId })).data?.[0];
  check("ben has one unread message", benSwap?.unread_count === 1);
  check("swap shows the right direction for ben", benSwap?.i_teach?.name === "Adobe Photoshop" && benSwap?.i_learn?.name === "Python");
  await must("ben marks the swap read", ben.client.rpc("mark_swap_read", { p_swap: swapId }));
  benSwap = (await ben.client.rpc("my_swaps", { p_swap: swapId })).data?.[0];
  check("unread count returns to zero", benSwap?.unread_count === 0);

  console.log("Sessions");
  await rejects("cannot schedule in the past", alice.client.rpc("propose_session", { p_swap: swapId, p_teacher: alice.id, p_starts_at: inHours(-1), p_duration: 45 }));
  await rejects("outsider cannot schedule", cara.client.rpc("propose_session", { p_swap: swapId, p_teacher: alice.id, p_starts_at: inHours(5), p_duration: 45 }));
  await rejects("meeting link must be https", alice.client.rpc("propose_session", { p_swap: swapId, p_teacher: alice.id, p_starts_at: inHours(5), p_duration: 45, p_meeting_url: "javascript:alert(1)" }));
  const sessionId = await must("alice proposes a session", alice.client.rpc("propose_session", { p_swap: swapId, p_teacher: alice.id, p_starts_at: inHours(26), p_duration: 45, p_meeting_url: "https://meet.example.com/abc" }));
  let session = (await ben.client.from("sessions").select("*").eq("id", sessionId).single()).data;
  check("session records teacher, learner and skill", session?.teacher_id === alice.id && session?.learner_id === ben.id && session?.skill_id === python);
  check("time is stored as an absolute instant", Math.abs(new Date(session?.starts_at).getTime() - (Date.now() + 26 * 3600_000)) < 60_000);
  await rejects("proposer cannot confirm their own session", alice.client.rpc("respond_to_session", { p_session: sessionId, p_accept: true }));
  check("outsider cannot see the session", ((await cara.client.from("sessions").select("id").eq("id", sessionId)).data ?? []).length === 0);
  await must("ben suggests another time", ben.client.rpc("reschedule_session", { p_session: sessionId, p_starts_at: inHours(50), p_duration: 60 }));
  session = (await alice.client.from("sessions").select("*").eq("id", sessionId).single()).data;
  check("rescheduling hands the decision to alice", session?.status === "proposed" && session?.proposed_by === ben.id && session?.duration_minutes === 60);
  await must("alice confirms", alice.client.rpc("respond_to_session", { p_session: sessionId, p_accept: true }));
  session = (await alice.client.from("sessions").select("status").eq("id", sessionId).single()).data;
  check("session is confirmed only after both agree", session?.status === "confirmed");
  await rejects("cannot mark done before it starts", alice.client.rpc("complete_session", { p_session: sessionId }));
  await rejects("cannot vouch before completion", ben.client.rpc("add_vouch", { p_session: sessionId }));
  await must("ben cancels the session", ben.client.rpc("cancel_session", { p_session: sessionId }));
  const sessNotifs = (await alice.client.from("notifications").select("type").eq("session_id", sessionId)).data ?? [];
  check("alice is notified of reschedule and cancellation", ["session_rescheduled", "session_cancelled"].every((t) => sessNotifs.some((n) => n.type === t)));

  console.log("Asks");
  const ask = await must("alice posts an ask", alice.client.from("asks").insert({ author_id: alice.id, wanted_skill_id: photoshop, offered_skill_id: python, body: "Need help with layer masks this week." }).select("id").single());
  check("cara can see the ask", ((await cara.client.from("asks").select("id").eq("id", ask.id)).data ?? []).length === 1);
  await rejects("cannot post an ask as someone else", cara.client.from("asks").insert({ author_id: alice.id, wanted_skill_id: guitar, body: "fake" }));
  await cara.client.from("asks").delete().eq("id", ask.id);
  check("cara cannot delete alice's ask", ((await alice.client.from("asks").select("id").eq("id", ask.id)).data ?? []).length === 1);
  await must("alice closes her ask", alice.client.from("asks").update({ status: "closed" }).eq("id", ask.id));
  check("closed ask is hidden from others", ((await cara.client.from("asks").select("id").eq("id", ask.id)).data ?? []).length === 0);

  console.log("Privacy and safety");
  await must("cara hides her profile", cara.client.from("profiles").update({ is_discoverable: false }).eq("id", cara.id));
  check("hidden profile cannot be opened", (await alice.client.rpc("get_person", { p_user: cara.id })).data === null);
  check("hidden profile is not in explore", !((await alice.client.rpc("explore_people", { p_query: "guitar" })).data ?? []).some((p) => p.id === cara.id));
  check("hidden profile row is not readable", ((await alice.client.from("profiles").select("id").eq("id", cara.id)).data ?? []).length === 0);
  await cara.client.from("profiles").update({ is_discoverable: true }).eq("id", cara.id);
  check("swap partner stays visible", (await alice.client.rpc("get_person", { p_user: ben.id })).data?.id === ben.id);
  await rejects("cannot edit someone else's profile (no rows changed)",
    alice.client.from("profiles").update({ bio: "hacked" }).eq("id", ben.id).select("id").single());
  await must("cara reports alice", cara.client.rpc("report_user", { p_user: alice.id, p_reason: "spam", p_details: "e2e test report" }));
  check("reports are not readable by members", !!(await cara.client.from("reports").select("id").limit(1)).error);
  await must("ben blocks alice", ben.client.rpc("block_user", { p_user: alice.id }));
  check("blocking ends the swap", (await alice.client.rpc("my_swaps", { p_swap: swapId })).data?.[0]?.status === "ended");
  check("blocked user no longer sees ben in matches", !((await alice.client.rpc("find_matches")).data ?? []).some((m) => m.id === ben.id));
  check("blocked user cannot open ben's profile", (await alice.client.rpc("get_person", { p_user: ben.id })).data === null);
  await rejects("blocked user cannot propose", alice.client.rpc("propose_swap", { p_recipient: ben.id, p_offered_skill: python, p_requested_skill: photoshop }));
  await rejects("ended swap is read-only", alice.client.from("messages").insert({ swap_id: swapId, sender_id: alice.id, body: "still there?" }));
  await must("ben unblocks alice", ben.client.rpc("unblock_user", { p_user: alice.id }));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
