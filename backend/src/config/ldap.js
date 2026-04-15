const ldap = require("ldapjs");

function assertEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function escapeLdapFilterValue(value) {
  return String(value)
    .replace(/\\/g, "\\5c")
    .replace(/\*/g, "\\2a")
    .replace(/\(/g, "\\28")
    .replace(/\)/g, "\\29")
    .replace(/\0/g, "\\00");
}

function buildUserFilter(template, username) {
  const safe = escapeLdapFilterValue(username);
  return template.replaceAll("{{username}}", safe);
}

function createClient() {
  const url = assertEnv("LDAP_URL");
  const client = ldap.createClient({ url });

  // Without this listener, ldapjs emits an "error" event when the TCP
  // connection fails (server down, wrong URL, etc.) and Node.js treats
  // every un-handled "error" event as a fatal unhandled exception, which
  // crashes the entire process.  We log it here; the operation-level
  // promise (bind/search) will reject separately with the same error.
  client.on("error", (err) => {
    console.error("[LDAP] client error:", err.message);
  });

  return client;
}

function bind(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => (err ? reject(err) : resolve()));
  });
}

function unbind(client) {
  return new Promise((resolve) => client.unbind(() => resolve()));
}

/**
 * ldapjs v3 dropped entry.object — all attributes are now in entry.pojo.
 * Convert the pojo attributes array into a flat key→value object so the
 * rest of the code can still read entry.mail, entry.cn, etc.
 */
function pojoToFlat(pojo) {
  const obj = {};
  if (!pojo || !Array.isArray(pojo.attributes)) return obj;
  for (const attr of pojo.attributes) {
    obj[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
  }
  return obj;
}

function searchOne(client, baseDN, options) {
  return new Promise((resolve, reject) => {
    client.search(baseDN, options, (err, res) => {
      if (err) return reject(err);

      let entry = null;

      res.on("searchEntry", (e) => {
        if (!entry) {
          const pojo = e && e.pojo;
          const rawDn = (pojo && pojo.objectName) || null;
          const dn =
            typeof rawDn === "string"
              ? rawDn
              : rawDn && typeof rawDn.toString === "function"
                ? rawDn.toString()
                : null;

          entry = { ...pojoToFlat(pojo), dn };
        }
      });
      res.on("error", reject);
      res.on("end", () => resolve(entry));
    });
  });
}

async function authenticateUser({ username, password }) {
  const baseDN = assertEnv("LDAP_BASE_DN");
  const bindDN = assertEnv("LDAP_BIND_DN");
  const bindPassword = assertEnv("LDAP_BIND_PASSWORD");
  const userFilterTemplate = process.env.LDAP_USER_FILTER || "(mail={{username}})";

  console.log("LDAP config in authenticateUser:", {
    LDAP_URL: process.env.LDAP_URL,
    LDAP_BASE_DN: baseDN,
    LDAP_BIND_DN: bindDN,
    LDAP_USER_FILTER: userFilterTemplate,
    username
  });

  const client = createClient();

  try {
    await bind(client, bindDN, bindPassword);

    const filter = buildUserFilter(userFilterTemplate, username);
    console.log("LDAP primary search filter:", filter);

    let user = await searchOne(client, baseDN, {
      scope: "sub",
      filter,
      attributes: ["dn", "cn", "sn", "givenName", "mail", "uid"]
    });

    // Fallback 1: if not found by mail, try by uid (local part before @)
    if (!user || !user.dn) {
      const localPart = String(username).split("@")[0];
      const uidFilter = `(uid=${escapeLdapFilterValue(localPart)})`;
      console.log("LDAP fallback search filter:", uidFilter);

      user = await searchOne(client, baseDN, {
        scope: "sub",
        filter: uidFilter,
        attributes: ["dn", "cn", "sn", "givenName", "mail", "uid"]
      });
    }

    // Fallback 2: if still not found, try direct bind with a DN pattern based on uid
    if (!user || !user.dn) {
      const localPart = String(username).split("@")[0];
      const userDnTemplate =
        process.env.LDAP_USER_DN_TEMPLATE || "uid={{uid}},ou=people,dc=habitflow,dc=local";
      const userDn = userDnTemplate.replaceAll("{{uid}}", escapeLdapFilterValue(localPart));

      console.log("LDAP direct bind fallback using DN:", userDn);

      const userClient = createClient();
      try {
        await bind(userClient, userDn, password);
        // Direct bind succeeded: minimal user info
        return {
          ok: true,
          user: {
            dn: userDn,
            email: username,
            uid: localPart
          }
        };
      } catch (e) {
        return { ok: false, reason: "USER_NOT_FOUND", error: e };
      } finally {
        await unbind(userClient);
      }
    }

    if (!user || !user.dn) return { ok: false, reason: "USER_NOT_FOUND" };

    // Verify password by binding as the user DN
    const userClient = createClient();
    try {
      await bind(userClient, user.dn, password);
    } finally {
      await unbind(userClient);
    }

    return {
      ok: true,
      user: {
        dn: user.dn,
        email: user.mail,
        uid: user.uid,
        givenName: user.givenName,
        sn: user.sn,
        cn: user.cn
      }
    };
  } catch (e) {
    return { ok: false, reason: "INVALID_CREDENTIALS", error: e };
  } finally {
    await unbind(client);
  }
}

async function addUser({ username, password, firstName, lastName, email }) {
  const baseDN = assertEnv("LDAP_BASE_DN");
  const bindDN = assertEnv("LDAP_BIND_DN");
  const bindPassword = assertEnv("LDAP_BIND_PASSWORD");

  const client = createClient();

  try {
    await bind(client, bindDN, bindPassword);

    const localPart = String(email).split("@")[0];
    const userDN = `uid=${escapeLdapFilterValue(localPart)},ou=people,dc=habitflow,dc=local`;

    const entry = {
      objectClass: ["inetOrgPerson", "organizationalPerson", "person", "top"],
      cn: `${firstName} ${lastName}`,
      sn: lastName,
      givenName: firstName,
      uid: localPart,
      mail: email,
      userPassword: password // Plain text password
    };

    await new Promise((resolve, reject) => {
      client.add(userDN, entry, (err) => (err ? reject(err) : resolve()));
    });

    console.log(`LDAP user added: ${userDN}`);
  } catch (e) {
    console.error("LDAP add user error:", e);
    throw e;
  } finally {
    await unbind(client);
  }
}

module.exports = {
  authenticateUser,
  addUser
};

