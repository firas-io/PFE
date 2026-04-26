/**
 * Returns all environment variables with their defaults.
 * Matches the calling style: validateEnv().VARIABLE_NAME
 */
export function validateEnv() {
  return {
    MONGO_URI:          process.env.MONGO_URI          ?? "mongodb://127.0.0.1/habitflow",
    JWT_SECRET:         process.env.JWT_SECRET         ?? "changeme",
    PORT:               process.env.PORT               ?? "5000",
    LDAP_ENABLED:       process.env.LDAP_ENABLED       ?? "false",
    LDAP_URL:           process.env.LDAP_URL           ?? "",
    LDAP_BIND_DN:       process.env.LDAP_BIND_DN       ?? "",
    LDAP_BIND_PASSWORD: process.env.LDAP_BIND_PASSWORD ?? "",
    LDAP_BASE_DN:       process.env.LDAP_BASE_DN       ?? "",
  };
}
