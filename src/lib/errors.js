export function errorMessage(error) {
  const code = error?.code?.replace(/^(firestore|auth)\//, "");
  if (code === "permission-denied") return "Permission denied. Firebase rules do not allow this request. Check the deployed Firestore rules and admin permissions.";
  if (["unauthenticated", "user-token-expired", "invalid-user-token"].includes(code)) return "Your session has expired. Please log in again.";
  if (["unavailable", "network-request-failed"].includes(code)) return "Cannot reach Firebase. Check your connection and try again.";
  if (["invalid-credential", "wrong-password", "user-not-found", "invalid-email"].includes(code)) return "Invalid email or password.";
  if (code === "too-many-requests") return "Too many login attempts. Please try again later.";
  if (code === "not-found") return "This record no longer exists. Reload and try again.";
  return error?.message || "Something went wrong. Please try again.";
}
