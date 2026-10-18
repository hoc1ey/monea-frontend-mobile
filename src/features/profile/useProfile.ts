import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMe, updateMe, type UpdateProfileInput, type UserProfile } from '@/api/users';
import { useAuthStore } from '@/stores/auth';

/** Shared cache key for `GET /users/me`; the home dashboard reads the same key. */
export const PROFILE_QUERY_KEY = ['users', 'me'] as const;

/** `GET /users/me` — current user profile. */
export function useProfile() {
  return useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: getMe });
}

/** `PATCH /users/me` — persists name/timezone and refreshes the session user. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateMe(input),
    onSuccess: (profile: UserProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      const { user, setUser } = useAuthStore.getState();
      if (user) {
        setUser({ ...user, name: profile.name, timezone: profile.timezone });
      }
    },
  });
}
