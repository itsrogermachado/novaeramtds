// This hook is deprecated - membership tiers have been removed from the application
// Keeping file to prevent import errors in case of any remaining references

export function useUserMemberships() {
  return {
    memberships: new Map(),
    isLoading: false,
    updateMembership: async () => ({ error: null }),
    refetch: () => {},
  };
}
