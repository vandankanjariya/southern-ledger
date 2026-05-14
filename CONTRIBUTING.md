# Contributing

Thanks for considering a contribution to Southern Ledger.

This project handles sensitive financial workflows, so changes should favour clarity, privacy, auditability, and simple maintenance over clever abstractions.

## Good First Contributions

- Improve setup and deployment documentation.
- Add support notes for common Australian bank CSV formats.
- Improve mock data coverage without using real financial records.
- Tighten validation, empty states, and error messages.
- Add focused tests around import parsing, duplicate detection, and date filtering.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run the local Worker API in another terminal when testing D1-backed flows:

```bash
npm run dev:api
```

Before opening a pull request:

```bash
npm run lint
npm run build
```

## Data Safety

Do not include real bank exports, personal account names, production D1 IDs, API tokens, screenshots with private financial data, or generated deployment configs in issues or pull requests.

Use synthetic examples only. If a real statement format is needed to explain a parser issue, replace all names, account numbers, transaction descriptions, amounts, and dates with safe sample values.

## Pull Request Guidelines

- Keep changes focused.
- Explain the user-facing workflow being improved.
- Include screenshots for visible UI changes.
- Include validation notes for import, reconciliation, or reporting changes.
- Update docs when setup, deployment, or data handling changes.

## Architecture Principles

- Raw imported transaction data should remain immutable.
- Transfers between owned accounts should not count as income or expenses.
- Australian financial year support should remain first-class.
- Private self-hosting should remain the default deployment posture.
- Provider-specific logic should stay isolated where practical.
