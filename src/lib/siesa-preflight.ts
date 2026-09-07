export interface SiesaPreflightApprovalInput {
  errors: readonly string[];
}

export function isSiesaPreflightApproved(
  preflight: SiesaPreflightApprovalInput | null | undefined
): boolean {
  return Boolean(preflight && preflight.errors.length === 0);
}
