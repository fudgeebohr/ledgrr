# Ledger — Payoff Tracker

A full MERN-stack app for tracking BNPL (Buy Now Pay Later) purchases and installment plans across you and your friends. Filter by payer or platform, add new items, mark months as paid, and items automatically drop off the list once fully paid.

## Stack

- **MongoDB** — stores items
- **Express** — REST API
- **React (Vite)** — frontend
- **Node.js** — backend runtime

## Features

- **User accounts** — each person creates their own login; every account only ever sees, filters, and edits its own items
- List all BNPL/installment items with computed totals (monthly due, remaining balance, amount paid)
- Filter by **payer** and **platform** — the monthly-due total updates live based on the active filter
- Add an item: name, payer, platform, monthly due, months to pay, due date, optional notes
- "Mark month paid" button increments months paid and advances the due date by a month
- "Undo last payment" in case of a mis-click
- Edit any item's fields (including months paid) directly
- Delete an item manually, or let it auto-remove once months paid reaches months to pay
- Summary strip: total monthly due, remaining balance, amount paid, active item count

## Project structure

```
bnpl-tracker/
├── backend/          Express + Mongoose API
│   ├── models/Item.js
│   ├── routes/items.js
│   ├── server.js
│   └── .env.example
└── frontend/         React (Vite) app
    └── src/
        ├── api.js
        ├── App.jsx
        └── components/
```

## Authentication

Each friend creates their own account (name, email, password) and logs in independently. The frontend stores a JWT in `localStorage` and sends it as `Authorization: Bearer <token>` on every request; the backend uses that token to scope every query, so **one account never sees another account's items** — the `payer`/`platform` fields and filters described above operate within a single user's own data (e.g. if you're the household organizer, you might still use `payer` to note which family member an item is for, but the item itself lives under your login).

Sessions last 7 days by default (`JWT_EXPIRES_IN` in `.env`). If a token expires or is invalid, the app automatically drops back to the login screen.

## API reference

| Method | Endpoint                  | Description                                         |
|--------|----------------------------|------------------------------------------------------|
| POST   | `/api/auth/register`      | Create an account — `{ name, email, password }`     |
| POST   | `/api/auth/login`         | Log in — `{ email, password }` → `{ token, user }`   |
| GET    | `/api/auth/me`            | Return the current user for a valid token           |
| GET    | `/api/items?payer=&platform=` | List **your** items, optionally filtered        |
| GET    | `/api/items/meta`         | Distinct payers & platforms within your own items    |
| GET    | `/api/items/summary?payer=&platform=` | Totals for the current filter, your items only |
| POST   | `/api/items`               | Create a new item under your account                |
| PUT    | `/api/items/:id`           | Edit one of your items (auto-removes if fully paid) |
| PATCH  | `/api/items/:id/pay`       | Mark one more month as paid (auto-removes if done)  |
| PATCH  | `/api/items/:id/unpay`     | Undo the last month paid                            |
| DELETE | `/api/items/:id`           | Manually remove one of your items                    |

All `/api/items*` routes require a valid `Authorization: Bearer <token>` header.

## Notes on data model

Each item stores: `itemName`, `payer`, `platform`, `monthlyDue`, `monthsToPay`, `monthsPaid`, `dueDate`, `notes`.

Computed on the fly (not stored): `totalAmount`, `amountPaid`, `remainingMonths`, `remainingAmount`, `progressPercent`, `isCompleted`.

Since "payer" and "platform" are free-text fields rather than a fixed list, the filter dropdowns are populated dynamically from whatever values already exist in your data (via `/api/items/meta`) — add a new payer or platform just by typing it into the Add Item form, and it'll show up as a filter option immediately.
