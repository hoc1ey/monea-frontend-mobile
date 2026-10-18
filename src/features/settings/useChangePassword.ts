import { useMutation } from '@tanstack/react-query';

import { changePassword, type ChangePasswordInput } from '@/api/users';

/** `PATCH /users/me/password` — closes every session on success (F15). */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  });
}
