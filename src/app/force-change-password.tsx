/**
 * `/force-change-password` — mandatory gate used when the API returns
 * `user.mustChangePassword = true`. Reuses the settings change-password screen;
 * the auth store makes it render the forced variant without a back button.
 */
export { default } from './change-password';
