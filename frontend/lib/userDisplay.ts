/** Display helpers — API may return English (firstName) or legacy French (prenom). */

export function userFirstName(u: { firstName?: string; prenom?: string } | null | undefined): string {
  return u?.firstName ?? u?.prenom ?? "";
}

export function userLastName(u: { lastName?: string; nom?: string } | null | undefined): string {
  return u?.lastName ?? u?.nom ?? "";
}

export function userDepartment(u: { department?: string; departement?: string } | null | undefined): string {
  return u?.department ?? u?.departement ?? "";
}
