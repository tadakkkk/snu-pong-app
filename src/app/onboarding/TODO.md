# Onboarding Personalization TODO

The current frontend implementation is local-first. It can collect personalization consent, predefined question answers, and a weighted tag vector without waiting for login/backend recommendation APIs.

Integration tasks for collaborators:

- Connect the saved local `interestTagVector` to the future server-side `user_interest_profiles` table.
- Replace the frontend-only vector builder with server validation once the profile API exists.
- Decide whether uploaded files are processed transiently or stored. Do not retain raw resume/transcript files by default.
- Add real chat/file input flows after privacy and backend extraction behavior are settled.
- Add a post-onboarding settings surface for editing, deleting, disabling, or reinitializing personalization.
- Expose item `tags` from the server recommendation/item APIs so the result screen can show matched reasons.
