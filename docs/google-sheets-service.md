# Google Sheets Service

Issue #2 adds Google Sheets access for the documented `event`, `signup`, and `template` sheets. Signal CLI REST API integration is still pending.

## Authentication

The service uses Google service account authentication. Configure either:

- `GOOGLE_APPLICATION_CREDENTIALS` with a local JSON key file path
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`

Share the spreadsheet with the service account email so the bot can read and update it.

## Sheets

Default sheet names match `docs/google-sheet-schema.md`:

- `event`
- `signup`
- `template`

Override them with:

- `GOOGLE_SHEETS_EVENT_SHEET`
- `GOOGLE_SHEETS_SIGNUP_SHEET`
- `GOOGLE_SHEETS_TEMPLATE_SHEET`

## Methods

- `getOpenEvent()` reads the event sheet and returns the first row with `Event_Status` set to `open`.
- `createSignup(signup)` appends a row to the signup sheet using the documented signup columns.
- `markPaid(criteria, payment)` finds a signup by name or number, optionally scoped by `Event_ID`, and updates `Paid_Status`, `Paid_By_Number`, and `Paid_Time`.
- `getSignupList(eventId)` reads signup rows and optionally filters by event.
- `getTemplate(templateKey)` reads the template sheet for future message rendering.

## Local Examples

Run without real Google credentials:

```bash
npm run sheets:example
```

Run local tests:

```bash
npm test
```
