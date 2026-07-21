# PathoLogix Supabase email templates

These templates are designed for the hosted Supabase dashboard. Copy the subject and HTML from the matching file into **Authentication > Email Templates**.

| Supabase template | Subject | File |
| --- | --- | --- |
| Confirm signup | Confirm your PathoLogix account | `confirmation.html` |
| Invite user | You're invited to PathoLogix | `invite.html` |
| Magic link | Your secure PathoLogix sign-in link | `magic-link.html` |
| Reset password | Reset your PathoLogix password | `recovery.html` |
| Change email address | Confirm your new PathoLogix email | `email-change.html` |
| Reauthentication | `{{ .Token }}` is your PathoLogix verification code | `reauthentication.html` |

Before sending production email:

1. Under **Authentication > URL Configuration**, set **Site URL** to `https://pathologix.io`.
2. Add `https://pathologix.io/**` to the redirect URL allow list. Keep `http://localhost:3011/**` only for local testing.
3. Configure custom SMTP so the sender can use a branded address such as `PathoLogix <training@yourdomain.com>`.
4. Send a new test for each flow and verify the button and fallback link on desktop and mobile. Previously generated links retain their original redirect destination.

The templates use only Supabase-supported variables and inline, email-safe styling. Keep `{{ .ConfirmationURL }}` and `{{ .Token }}` unchanged.
