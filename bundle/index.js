var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db.ts
var db_exports = {};
__export(db_exports, {
  countEventsSince: () => countEventsSince,
  getDb: () => getDb,
  getDomainByHostname: () => getDomainByHostname,
  getDomainById: () => getDomainById,
  getLanderByDomainId: () => getLanderByDomainId,
  getLatestDigestAt: () => getLatestDigestAt,
  insertAffiliateOffer: () => insertAffiliateOffer,
  insertAgentAction: () => insertAgentAction,
  insertAnalyticsEvent: () => insertAnalyticsEvent,
  insertDigest: () => insertDigest,
  insertDomain: () => insertDomain,
  insertLead: () => insertLead,
  listAgentActionsSince: () => listAgentActionsSince,
  listDomains: () => listDomains,
  listGreenlitOffers: () => listGreenlitOffers,
  listLeadsForDomain: () => listLeadsForDomain,
  parseLanderConfig: () => parseLanderConfig,
  updateDomainBindStatus: () => updateDomainBindStatus,
  upsertLander: () => upsertLander
});
function getDb(env) {
  return env.DB;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function newId() {
  return crypto.randomUUID();
}
async function insertDomain(db, input) {
  const row = {
    id: input.id ?? newId(),
    hostname: input.hostname.toLowerCase(),
    bind_status: input.bind_status ?? "pending",
    mode: input.mode ?? "yolo",
    prompt: input.prompt ?? null,
    cf_custom_hostname_id: input.cf_custom_hostname_id ?? null,
    created_at: input.created_at ?? nowIso()
  };
  await db.prepare(
    `INSERT INTO domains (id, hostname, bind_status, mode, prompt, cf_custom_hostname_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    row.id,
    row.hostname,
    row.bind_status,
    row.mode,
    row.prompt,
    row.cf_custom_hostname_id,
    row.created_at
  ).run();
  return row;
}
async function getDomainById(db, id) {
  return db.prepare(`SELECT * FROM domains WHERE id = ?`).bind(id).first();
}
async function getDomainByHostname(db, hostname) {
  return db.prepare(`SELECT * FROM domains WHERE hostname = ?`).bind(hostname.toLowerCase()).first();
}
async function listDomains(db) {
  const result = await db.prepare(`SELECT * FROM domains ORDER BY created_at DESC`).all();
  return result.results ?? [];
}
async function updateDomainBindStatus(db, id, bind_status, cf_custom_hostname_id) {
  if (cf_custom_hostname_id !== void 0) {
    await db.prepare(
      `UPDATE domains SET bind_status = ?, cf_custom_hostname_id = ? WHERE id = ?`
    ).bind(bind_status, cf_custom_hostname_id, id).run();
    return;
  }
  await db.prepare(`UPDATE domains SET bind_status = ? WHERE id = ?`).bind(bind_status, id).run();
}
async function upsertLander(db, input) {
  const existing = await getLanderByDomainId(db, input.domain_id);
  const version = input.version ?? (existing ? existing.version + 1 : 1);
  const row = {
    id: existing?.id ?? input.id ?? newId(),
    domain_id: input.domain_id,
    type: input.type,
    config_json: JSON.stringify(input.config),
    ogi_image_url: input.ogi_image_url ?? existing?.ogi_image_url ?? null,
    version,
    updated_at: nowIso()
  };
  if (existing) {
    await db.prepare(
      `UPDATE landers
         SET type = ?, config_json = ?, ogi_image_url = ?, version = ?, updated_at = ?
         WHERE id = ?`
    ).bind(
      row.type,
      row.config_json,
      row.ogi_image_url,
      row.version,
      row.updated_at,
      row.id
    ).run();
  } else {
    await db.prepare(
      `INSERT INTO landers (id, domain_id, type, config_json, ogi_image_url, version, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      row.id,
      row.domain_id,
      row.type,
      row.config_json,
      row.ogi_image_url,
      row.version,
      row.updated_at
    ).run();
  }
  return row;
}
async function getLanderByDomainId(db, domainId) {
  return db.prepare(`SELECT * FROM landers WHERE domain_id = ? ORDER BY version DESC LIMIT 1`).bind(domainId).first();
}
function parseLanderConfig(row) {
  return JSON.parse(row.config_json);
}
async function insertLead(db, input) {
  const row = {
    id: input.id ?? newId(),
    domain_id: input.domain_id,
    email: input.email.trim().toLowerCase(),
    meta_json: input.meta ? JSON.stringify(input.meta) : null,
    created_at: nowIso()
  };
  await db.prepare(
    `INSERT INTO leads (id, domain_id, email, meta_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(row.id, row.domain_id, row.email, row.meta_json, row.created_at).run();
  return row;
}
async function listLeadsForDomain(db, domainId) {
  const result = await db.prepare(
    `SELECT * FROM leads WHERE domain_id = ? ORDER BY created_at DESC`
  ).bind(domainId).all();
  return result.results ?? [];
}
async function insertAnalyticsEvent(db, input) {
  const row = {
    id: input.id ?? newId(),
    domain_id: input.domain_id,
    kind: input.kind,
    meta_json: input.meta ? JSON.stringify(input.meta) : null,
    created_at: nowIso()
  };
  await db.prepare(
    `INSERT INTO analytics_events (id, domain_id, kind, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?)`
  ).bind(row.id, row.domain_id, row.kind, row.meta_json, row.created_at).run();
  return row;
}
async function countEventsSince(db, domainId, kind, sinceIso) {
  const row = await db.prepare(
    `SELECT COUNT(*) AS c FROM analytics_events
       WHERE domain_id = ? AND kind = ? AND created_at >= ?`
  ).bind(domainId, kind, sinceIso).first();
  return row?.c ?? 0;
}
async function insertAgentAction(db, input) {
  const row = {
    id: input.id ?? newId(),
    domain_id: input.domain_id,
    summary: input.summary,
    payload_json: input.payload ? JSON.stringify(i