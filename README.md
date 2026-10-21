# CERTIFICATION//OVERDRIVE

A flashy, arcade-inspired open-source certification learning game. Starting with AWS Solutions Architect Associate.

## Play online

**[▶ Play CERTIFICATION // OVERDRIVE on GitHub Pages](https://c-a-p-engineer.github.io/certification-study/)**

> Deployment status: GitHub Actions must complete successfully before the game is available.

## Features
- Neon arcade quiz interface with combo, XP, rank and particle effects
- 48 original AWS SAA practice questions with explanations and official reference links
- Local progress persistence, weak-topic review, reduced-motion support
- Extensible certification content format

## Current scope

The current prototype includes 48 original AWS SAA practice questions across four domains, a neon skill-tree overview, combo/XP progression, and local mistake review. The skill-tree nodes currently indicate available domains, not measured mastery. Learning progress is stored in browser localStorage; cloud sync is not available.

## Development
```sh
npm install
npm run dev
npm run build
```

## Deploy
GitHub Pages is deployed by GitHub Actions from `master` via `.github/workflows/deploy.yml`.

## Content policy
Questions are original practice material, not real exam dumps. AWS and its service names are trademarks of Amazon.com, Inc. This project is not affiliated with AWS.

## License
MIT.

## Question bank maintenance

Canonical new questions live in `certifications/aws-saa/questions/bank.jsonl` (one JSON object per line). Run `npm run validate:questions` to validate unique IDs, domains, four distinct options, answer indexes, explanations and official AWS references, and regenerate `src/generated/questions.json`. The first eight prototype questions are still embedded in `src/main.tsx` pending migration. Do not edit generated JSON manually. New questions should be original and reviewed for factual accuracy before release.
