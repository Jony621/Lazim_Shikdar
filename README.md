# Tender Package Builder — AI DevFest

Frontend-only implementation of the AI DevFest Tender Document Package Builder.

## Features
- Load `requirements.json`
- Tender summary and ordered requirements
- Upload up to 30 PDFs / 50 MB
- PDF validation and page counting
- SHA-256 exact-content duplicate detection
- One-to-one document/file matching
- Expiry-date validation against submission deadline
- Blocking statuses: Missing, Expiry date needed, Expired, Duplicate
- Optional document handling
- English/Bangla UI toggle
- Client-side combined PDF generation
- English cover page
- Correct requirement order and original page order
- Footer on every page: `<tender_id> | Page X of Y`
- Downloads as `<tender_id>_Package.pdf`
- No tender documents are uploaded to a backend

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL in Chrome.

## Build

```bash
npm run build
npm run preview
```

## Input format

Use the `requirements.json` format from the problem statement. The app expects:

```json
{
  "tender": {
    "tender_id": "T-2026-0417",
    "title": "Supply of IT Equipment",
    "procuring_entity": "Example Directorate",
    "bidder": "Example Company Ltd.",
    "submission_deadline": "2026-10-20"
  },
  "requirements": [
    {
      "id": "R01",
      "order": 1,
      "title_en": "Trade License",
      "title_bn": "ট্রেড লাইসেন্স",
      "mandatory": true,
      "has_expiry": true
    }
  ]
}
```

## Contest alignment

The implementation follows the supplied problem statement: browser-only processing, PDF-only uploads, status rules, duplicate checking, ordered package generation, cover page and page footers. The problem statement also lists optional bonus tasks such as an index, seal/signature placement, CSV/Excel export, persistence, Bangla PDF text, auto-match and damaged-PDF handling; those are not all included in this first build.
