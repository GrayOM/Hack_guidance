/**
 * Stands in for Postgres. The tables and routines are the ones the real schema defines, with the
 * same constraints that matter: the stage bound, the per-user primary key, and an atomic coupon
 * apply. The point is to exercise the functions as deployed, not to re-test Postgres.
 */
export const USER = { id: "11111111-2222-3333-4444-555555555555", email: "selftest@local", email_confirmed_at: new Date().toISOString() };
export const db = {
  progress: new Map(),            // `${user}:${stage}` -> row
  range: new Map(),               // user -> { coupon_applied, stored_note }
  certificates: new Map(),
  profiles: new Map([[USER.id, { id: USER.id, display_name: "SelfTest" }]]),
  stageBound: 50,                 // the live check constraint
  required: 50,                   // the live certificate requirement
  rejected: [],
};

const ok = (data, error = null) => ({ data, error });

function table(name) {
  const api = { _filters: {}, _order: null };
  api.select = () => api;
  api.eq = (col, val) => { api._filters[col] = val; return api; };
  api.order = () => api;
  api.maybeSingle = async () => ok(rows(name, api._filters)[0] ?? null);
  api.then = (resolve) => resolve(ok(rows(name, api._filters)));
  api.upsert = async row => {
    if (name === "hg_black_trace_progress") {
      // The constraint that was wrong for four chapters. Reproduced so a regression shows up here.
      if (row.stage < 1 || row.stage > db.stageBound) {
        db.rejected.push(row.stage);
        return { error: { message: `violates check constraint "hg_black_trace_progress_stage_check"` } };
      }
      db.progress.set(`${row.user_id}:${row.stage}`, { ...row, completed_at: new Date().toISOString() });
      return { error: null };
    }
    if (name === "hg_range_state") {
      db.range.set(row.user_id, { ...(db.range.get(row.user_id) ?? { coupon_applied: 0, stored_note: "" }), ...row });
      return { error: null };
    }
    return { error: null };
  };
  api.update = () => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ok(null) }) }) });
  return api;
}

function rows(name, f) {
  if (name === "hg_black_trace_progress") {
    return [...db.progress.values()]
      .filter(r => !f.user_id || r.user_id === f.user_id)
      .sort((a, b) => a.stage - b.stage);
  }
  if (name === "hg_range_state") {
    const r = db.range.get(f.user_id);
    return r ? [r] : [];
  }
  if (name === "hg_profiles") return [...db.profiles.values()].filter(r => !f.id || r.id === f.id);
  if (name === "hg_course_certificates") {
    return [...db.certificates.values()].filter(r => !f.user_id || r.user_id === f.user_id);
  }
  return [];
}

export function createClient() {
  return {
    auth: { getUser: async () => ok({ user: USER }) },
    from: table,
    rpc: async (name, args) => {
      if (name === "hg_consume_submission_slot") return ok(true);
      if (name === "hg_consume_public_slot") return ok(119);
      if (name === "hg_display_name_available") return ok(true);
      if (name === "hg_provision_confirmed_profile") return ok("SelfTest");
      if (name === "hg_range_apply_coupon") {
        const cur = db.range.get(args.p_user_id) ?? { coupon_applied: 0, stored_note: "" };
        cur.coupon_applied += 1;                    // atomic, as the SQL routine is
        db.range.set(args.p_user_id, cur);
        return ok(cur.coupon_applied);
      }
      if (name === "hg_issue_clearance_certificate") {
        const done = [...db.progress.values()].filter(r => r.user_id === args.p_user_id).length;
        const held = db.certificates.get(args.p_user_id);
        if (held) return ok([{ issued: true, certificate_code: held.certificate_code, remaining_modules: 0 }]);
        if (done < db.required) return ok([{ issued: false, certificate_code: null, remaining_modules: db.required - done }]);
        const code = `HG-WSF-2026-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
        db.certificates.set(args.p_user_id, { user_id: args.p_user_id, certificate_code: code });
        return ok([{ issued: true, certificate_code: code, remaining_modules: 0 }]);
      }
      return ok(null);
    },
  };
}
