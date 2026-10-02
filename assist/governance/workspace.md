# Workspace ownership

Cxsun is the base application. Framework owns reusable runtime and HTTP primitives. UI owns React components, blocks, layouts, templates, and styles. UIUX is the separate gallery at http://127.0.0.1:6102. Tools owns development and maintenance commands. Governance owns developer instructions only.

Consume public package exports. Keep business behavior in its owning app. Do not add application implementations to shared tools or governance. Use the sibling projects, shared, and devkits layout.
