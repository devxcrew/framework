# Codexsun framework

Reusable environment validation and native Node HTTP frontend serving. Application startup belongs to the consuming app.

Public source: https://github.com/devxcrew/framework. Package name: @codexsun/framework. This source repository does not publish an npm package.

Clone to shared/framework alongside projects/cxsun and shared/ui. Cxsun runs npm run build:framework to compile this package using its TypeScript installation.

Maintenance commands: npm run check:versions, npm run fix:line-endings, npm run version:update, and npm run github:now. The verified shared tools package is stored in vendor.

## Common maintenance commands

All repositories use the installed @devxcrew/tools package through these root scripts:

```powershell
npm run tools:check
npm run version:show
npm run version:update -- --dry-run
npm run check:versions
npm run changelog:show
npm run changelog:append -- --title "Change title" --note "Change details"
npm run lines:check
npm run fix:line-endings
npm run github:now -- --dry-run
```

Version updates and changelog appends change local files. github:now without --dry-run can commit and push after its review prompts. Reusable UI and framework packages keep their package-specific build contracts; the gallery keeps its standalone Vite workspace.
