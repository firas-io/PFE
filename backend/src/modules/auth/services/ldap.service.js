/**
 * modules/auth/ldap.service.js
 * All LDAP I/O lives here. Nothing else should talk to ldapjs directly.
 */
import ldap from "ldapjs";

function _assertEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function _escape(value) {
  return String(value)
    .replace(/\\/g, "\\5c").replace(/\*/g, "\\2a")
    .replace(/\(/g, "\\28").replace(/\)/g, "\\29")
    .replace(/\0/g, "\\00");
}

function _createClient() {
  const url = _assertEnv("LDAP_URL");
  const client = ldap.createClient({ url });
  client.on("error", err => console.error("[LDAP] client error:", err.message));
  return client;
}

const _bind = (client, dn, password) =>
  new Promise((res, rej) => client.bind(dn, password, err => (err ? rej(err) : res())));

const _unbind = client =>
  new Promise(res => client.unbind(() => res()));

function _pojoToFlat(pojo) {
  const obj = {};
  if (!pojo || !Array.isArray(pojo.attributes)) return obj;
  for (const attr of pojo.attributes)
    obj[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
  return obj;
}

function _searchOne(client, baseDN, options) {
  return new Promise((res, rej) => {
    client.search(baseDN, options, (err, result) => {
      if (err) return rej(err);
      let entry = null;
      result.on("searchEntry", e => {
        if (!entry) {
          const pojo  = e?.pojo;
          const rawDn = pojo?.objectName ?? null;
          const dn    = typeof rawDn === "string" ? rawDn : rawDn?.toString?.() ?? null;
          entry = { ..._pojoToFlat(pojo), dn };
        }
      });
      result.on("error", rej);
      result.on("end", () => res(entry));
    });
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Authenticate a user against LDAP.
 * Returns the user's DN, email, name fields, and the raw `manager` DN attribute
 * so the auth service can resolve the manager→user relationship.
 *
 * @returns {{ ok: true, user: object } | { ok: false, reason: string, error?: Error }}
 */
export async function authenticateUser({ username, password }) {
  const baseDN         = _assertEnv("LDAP_BASE_DN");
  const bindDN         = _assertEnv("LDAP_BIND_DN");
  const bindPassword   = _assertEnv("LDAP_BIND_PASSWORD");
  const filterTemplate = process.env.LDAP_USER_FILTER || "(mail={{username}})";

  const client = _createClient();
  try {
    await _bind(client, bindDN, bindPassword);

    const filter = filterTemplate.replaceAll("{{username}}", _escape(username));
    let user = await _searchOne(client, baseDN, {
      scope: "sub",
      filter,
      attributes: ["dn", "cn", "sn", "givenName", "mail", "uid", "manager"],
    });

    // Fallback 1: search by uid (local part of email)
    if (!user?.dn) {
      const uid = String(username).split("@")[0];
      user = await _searchOne(client, baseDN, {
        scope: "sub",
        filter: `(uid=${_escape(uid)})`,
        attributes: ["dn", "cn", "sn", "givenName", "mail", "uid", "manager"],
      });
    }

    // Fallback 2: direct DN bind
    if (!user?.dn) {
      const uid        = String(username).split("@")[0];
      const dnTemplate = process.env.LDAP_USER_DN_TEMPLATE || "uid={{uid}},ou=people,dc=habitflow,dc=local";
      const userDn     = dnTemplate.replaceAll("{{uid}}", _escape(uid));
      const userClient = _createClient();
      try {
        await _bind(userClient, userDn, password);
        return { ok: true, user: { dn: userDn, email: username, uid, managerDn: null } };
      } catch (e) {
        return { ok: false, reason: "USER_NOT_FOUND", error: e };
      } finally {
        await _unbind(userClient);
      }
    }

    // Verify password by binding as the found user DN
    const userClient = _createClient();
    try {
      await _bind(userClient, user.dn, password);
    } finally {
      await _unbind(userClient);
    }

    return {
      ok: true,
      user: {
        dn:        user.dn,
        email:     user.mail,
        uid:       user.uid,
        givenName: user.givenName,
        sn:        user.sn,
        cn:        user.cn,
        managerDn: user.manager || null,
      },
    };
  } catch (e) {
    return { ok: false, reason: "INVALID_CREDENTIALS", error: e };
  } finally {
    await _unbind(client);
  }
}

/**
 * Resolve a user DN to their attributes (email, name).
 * Used to look up a manager by their DN stored in the `manager` attribute of a user.
 *
 * @param {string} dn  Full DN, e.g. "uid=sophie.martin,ou=managers,dc=habitflow,dc=local"
 * @returns {object|null}  { email, givenName, sn, cn, dn } or null if not found
 */
export async function lookupUserByDn(dn) {
  if (!dn) return null;

  const bindDN       = _assertEnv("LDAP_BIND_DN");
  const bindPassword = _assertEnv("LDAP_BIND_PASSWORD");
  const baseDN       = _assertEnv("LDAP_BASE_DN");

  const client = _createClient();
  try {
    await _bind(client, bindDN, bindPassword);

    // Primary: search by uid extracted from DN (most reliable across LDAP servers)
    const uidMatch = String(dn).match(/^uid=([^,]+)/i);
    if (uidMatch) {
      const entry = await _searchOne(client, baseDN, {
        scope: "sub",
        filter: `(uid=${_escape(uidMatch[1])})`,
        attributes: ["dn", "cn", "sn", "givenName", "mail", "uid"],
      });
      if (entry) {
        return {
          dn:        entry.dn,
          email:     entry.mail,
          givenName: entry.givenName,
          sn:        entry.sn,
          cn:        entry.cn,
        };
      }
    }

    return null;
  } catch (e) {
    console.error("[LDAP] lookupUserByDn error:", e.message);
    return null;
  } finally {
    await _unbind(client);
  }
}

/**
 * Add a user to LDAP directory.
 */
export async function addLdapUser({ password, firstName, lastName, email }) {
  const bindDN       = _assertEnv("LDAP_BIND_DN");
  const bindPassword = _assertEnv("LDAP_BIND_PASSWORD");

  const client = _createClient();
  try {
    await _bind(client, bindDN, bindPassword);

    const localPart = String(email).split("@")[0];
    const userDN    = `uid=${_escape(localPart)},ou=people,dc=habitflow,dc=local`;
    const entry     = {
      objectClass: ["inetOrgPerson", "organizationalPerson", "person", "top"],
      cn: `${firstName} ${lastName}`, sn: lastName, givenName: firstName,
      uid: localPart, mail: email, userPassword: `{PLAIN}${password}`,
    };

    await new Promise((res, rej) => client.add(userDN, entry, err => (err ? rej(err) : res())));
    console.log(`LDAP user added: ${userDN}`);
  } catch (e) {
    console.error("LDAP addUser error:", e);
    throw e;
  } finally {
    await _unbind(client);
  }
}
