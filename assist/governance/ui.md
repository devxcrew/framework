# Common UI usage

Import Button from @codexsun/ui/components/button. Import LoginPage from @codexsun/ui/blocks/auth. Import MainWorkspace from @codexsun/ui/layouts/main-workspace. MainWorkspace composes mdi-main. Use @codexsun/ui/styles for shared styles and @codexsun/ui/design-system for public design-system contracts.

The get_ui_catalog tool reads current package exports. Inspect the actual component props and UIUX examples before use. The export list is an import catalog, not a complete component prop schema. Do not copy shared components into apps. Reusable UI dependencies belong to UI. Apps own page behavior, navigation, and data connections.
