# Architecture Overview

## Frontend
React + Vite + TypeScript SPA.

## Backend
Cloudflare Workers API.

## Database
Cloudflare D1 relational database.

## Hosting
Cloudflare Workers.

## Security
Cloudflare Access for private authentication.

## Import Flow

CSV File
→ Validation
→ Staging Table
→ Duplicate Detection
→ Reconciliation
→ Final Transactions

## Core Tables

- institutions
- accounts
- import_batches
- staging_transactions
- transactions
- categories
- category_rules
- transfers
- tax_tags
- loans
- assets
- liabilities

## Design Principles

- immutable raw imports
- reconciliation-first
- auditability
- privacy-first
- mobile-friendly