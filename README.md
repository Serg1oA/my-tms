# My TMS
### Live demo: https://mytms-pi.vercel.app/

## 🔤 What is this project about?
My TMS is a lightweight Translation Management System for handling multilingual translation work from project setup to segment-level editing. It lets you organize projects by language pair, upload text documents, translate segment by segment, and reuse previous translations through a fuzzy Translation Memory panel to speed up consistent output.

## 💻 Technologies Utilized
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend/BaaS**: Supabase (auth, database, server/client integrations)
- **Core logic**: Levenshtein-based fuzzy matching for Translation Memory suggestions
- **Deployment**: Vercel-ready Next.js setup

## ✨ Current Features / Functionality
- Authentication flow and protected dashboard experience
- Project management by source and target language pair
- Document upload workflow that creates segment-based translation jobs
- Segment editor with statuses (`untranslated`, `draft`, `translated`, `reviewed`) and progress tracking
- Translation Memory side panel with ranked fuzzy matches and one-click apply
- Confirm-to-save flow that persists segment translations and adds validated pairs to TM

## 🛠️ Upcoming Features / Improvements
- Reviewer mode and QA checks (terminology consistency, missing-number detection, punctuation checks)
- Better TM quality controls (duplicate handling, domain tags, and confidence thresholds)
