/**
 * Dev Test Data Seeder — server functions.
 *
 * Creates a small end-to-end dataset (users → services → jobs → match →
 * booking → messages → review) using the service-role Supabase client
 * so RLS is bypassed only in this admin path. All rows are tagged with
 * the fixed email pattern `%@handwerk-test.local` so `resetTestData`
 * can wipe them cleanly and re-run the flow.
 *
 * Gating: the caller must be signed in AND either
 *   - have the `admin` role in `public.user_roles`, or
 *   - be the first user to hit the seeder (no admins exist yet). In
 *     that case the caller is promoted to admin so subsequent calls
 *     stay gated.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TEST_EMAIL_DOMAIN = "handwerk-test.local";
const TEST_EMAILS = {
  client: `test-client@${TEST_EMAIL_DOMAIN}`,
  tradesperson: `test-tradesperson@${TEST_EMAIL_DOMAIN}`,
  business: `test-business@${TEST_EMAIL_DOMAIN}`,
};
const TEST_PASSWORD = "TestPass!23";

type AdminClient = Awaited<ReturnType<typeof getAdmin>>;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Ensure the calling user is authorized. Bootstrap first admin on empty table. */
async function assertAdmin(admin: AdminClient, userId: string) {
  const { data: adminRows, error } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);
  if (error) throw new Error(`admin lookup failed: ${error.message}`);

  if (!adminRows || adminRows.length === 0) {
    // Bootstrap: no admins yet — promote the current caller.
    const { error: grantErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (grantErr) throw new Error(`bootstrap admin grant failed: ${grantErr.message}`);
    return;
  }

  const { data: mine, error: mineErr } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (mineErr) throw new Error(`admin check failed: ${mineErr.message}`);
  if (!mine) throw new Error("Forbidden: admin role required");
}

/** Find or create an auth user by email; return the auth.users.id. */
async function ensureUser(
  admin: AdminClient,
  email: string,
  fullName: string,
  accountType: string,
): Promise<string> {
  // Try to find existing.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
  const found = list.users.find((u: any) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (found) return found.id;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, display_name: fullName, account_type: accountType },
  });
  if (createErr || !created.user)
    throw new Error(`createUser(${email}) failed: ${createErr?.message}`);
  return created.user.id;
}

/** Delete all test rows and test auth users. Idempotent. */
export const resetTestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdmin();
    await assertAdmin(admin, context.userId);

    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
    const testUsers = list.users.filter((u: any) =>
      (u.email ?? "").toLowerCase().endsWith(`@${TEST_EMAIL_DOMAIN}`),
    );
    const ids = testUsers.map((u: any) => u.id);

    // Explicit deletes in FK order. auth.users delete cascades to most tables
    // but not every path — do it explicitly for a clean slate.
    if (ids.length > 0) {
      await admin.from("reviews").delete().in("client_id", ids);
      await admin.from("messages").delete().in("sender_id", ids);
      await admin.from("bookings").delete().in("client_id", ids);
      await admin.from("matches").delete().in("client_id", ids);
      await admin.from("services").delete().in("provider_id", ids);
      await admin.from("jobs").delete().in("owner_id", ids);
      await admin.from("user_roles").delete().in("user_id", ids);
      for (const id of ids) {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw new Error(`deleteUser(${id}) failed: ${error.message}`);
      }
    }
    return { deletedUsers: ids.length };
  });

/** Seed the end-to-end test dataset. */
export const seedTestData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdmin();
    await assertAdmin(admin, context.userId);

    // 1. USERS
    const clientId = await ensureUser(admin, TEST_EMAILS.client, "Test Client", "homeowner");
    const tradeId = await ensureUser(
      admin,
      TEST_EMAILS.tradesperson,
      "Test Tradesperson",
      "handyman",
    );
    const bizId = await ensureUser(admin, TEST_EMAILS.business, "Test Business", "business");

    // Profiles are created by handle_new_user trigger; fill trades on the pro.
    await admin
      .from("profiles")
      .update({
        trades: ["Plumbing", "Roofing"],
        city: "Berlin",
        postal_code: "10115",
        company_name: "Test Trades GmbH",
        languages: ["de", "en"],
      })
      .eq("id", tradeId);
    await admin
      .from("profiles")
      .update({
        trades: ["Roofing"],
        city: "Munich",
        postal_code: "80331",
        company_name: "Test Roofing AG",
        languages: ["de"],
      })
      .eq("id", bizId);
    await admin
      .from("profiles")
      .update({
        city: "Berlin",
        postal_code: "10115",
      })
      .eq("id", clientId);

    // Roles
    await admin.from("user_roles").upsert(
      [
        { user_id: clientId, role: "user" },
        { user_id: tradeId, role: "user" },
        { user_id: bizId, role: "user" },
      ],
      { onConflict: "user_id,role" },
    );

    // 2. SERVICES on tradesperson + business
    const { data: services, error: svcErr } = await admin
      .from("services")
      .insert([
        {
          provider_id: tradeId,
          name: "Plumbing repair",
          description: "General plumbing troubleshooting and repairs.",
          trade: "Plumbing",
          base_price_cents: 8000,
        },
        {
          provider_id: tradeId,
          name: "Roof leak inspection",
          description: "On-site roof inspection with same-day report.",
          trade: "Roofing",
          base_price_cents: 12000,
        },
        {
          provider_id: bizId,
          name: "Full roof replacement",
          description: "Complete roof teardown and replacement with warranty.",
          trade: "Roofing",
          base_price_cents: 850000,
        },
      ])
      .select("id, name, trade, provider_id");
    if (svcErr || !services) throw new Error(`services insert failed: ${svcErr?.message}`);
    const plumbingSvc = services.find((s: any) => s.name === "Plumbing repair");
    if (!plumbingSvc) throw new Error("plumbing service missing");

    // 3. JOBS posted by the client
    const { data: jobs, error: jobsErr } = await admin
      .from("jobs")
      .insert([
        {
          owner_id: clientId,
          title: "Kitchen sink is leaking",
          description: "Drip under the sink, needs urgent plumbing fix.",
          trade: "Plumbing",
          estimated_budget: 250,
          location_zip: "10115",
          city: "Berlin",
          language: "de",
          urgency: "high",
          status: "open",
        },
        {
          owner_id: clientId,
          title: "Roof tiles blown off after storm",
          description: "Several tiles missing on the east side. Need inspection & repair.",
          trade: "Roofing",
          estimated_budget: 1800,
          location_zip: "10115",
          city: "Berlin",
          language: "de",
          urgency: "normal",
          status: "open",
        },
      ])
      .select("id, title, trade");
    if (jobsErr || !jobs) throw new Error(`jobs insert failed: ${jobsErr?.message}`);
    const plumbingJob = jobs.find((j: any) => j.trade === "Plumbing");
    if (!plumbingJob) throw new Error("plumbing job missing");

    // 4. MATCH + BOOKING + MESSAGES
    const { data: match, error: matchErr } = await admin
      .from("matches")
      .insert({
        job_id: plumbingJob.id,
        client_id: clientId,
        contractor_id: tradeId,
        status: "accepted",
        match_unlocked: true,
        accepted_at: new Date().toISOString(),
        unlocked_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (matchErr || !match) throw new Error(`match insert failed: ${matchErr?.message}`);

    const scheduledStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const scheduledEnd = new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString();
    const completedAt = new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString();

    const { data: booking, error: bookErr } = await admin
      .from("bookings")
      .insert({
        job_id: plumbingJob.id,
        match_id: match.id,
        service_id: plumbingSvc.id,
        client_id: clientId,
        provider_id: tradeId,
        status: "completed",
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        completed_at: completedAt,
        agreed_price_cents: 12500,
        notes: "Seeded test booking.",
      })
      .select("id")
      .single();
    if (bookErr || !booking) throw new Error(`booking insert failed: ${bookErr?.message}`);

    const now = Date.now();
    const { error: msgErr } = await admin.from("messages").insert([
      {
        booking_id: booking.id,
        sender_id: clientId,
        recipient_id: tradeId,
        body: "Hi! When can you come by to look at the sink?",
        created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        booking_id: booking.id,
        sender_id: tradeId,
        recipient_id: clientId,
        body: "Hey — I can be there tomorrow morning around 9. Sound good?",
        created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        booking_id: booking.id,
        sender_id: clientId,
        recipient_id: tradeId,
        body: "Perfect, see you at 9. Address is on file.",
        created_at: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    if (msgErr) throw new Error(`messages insert failed: ${msgErr.message}`);

    // 5. REVIEW (5-star)
    const { error: revErr } = await admin.from("reviews").insert({
      booking_id: booking.id,
      job_id: plumbingJob.id,
      client_id: clientId,
      provider_id: tradeId,
      rating: 5,
      comment: "Fast, friendly, and fixed it in one visit. Highly recommend!",
    });
    if (revErr) throw new Error(`review insert failed: ${revErr.message}`);

    return {
      users: {
        client: { id: clientId, email: TEST_EMAILS.client },
        tradesperson: { id: tradeId, email: TEST_EMAILS.tradesperson },
        business: { id: bizId, email: TEST_EMAILS.business },
      },
      password: TEST_PASSWORD,
      counts: {
        services: services.length,
        jobs: jobs.length,
        matches: 1,
        bookings: 1,
        messages: 3,
        reviews: 1,
      },
    };
  });
