# Track: God-File Decomposition — HubScene & SettingsPanel

- **ID:** `god-file-decomposition_20261018`
- **Type:** Refactor
- **Status:** New
- **Branch:** `refactor/god-file-decomposition`

## Documents

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Summary

Decompose the two god files (`HubScene.ts` 1,382 L, `SettingsPanel.ts`
1,245 L) into focused modules, extract shared test helpers to remove the
duplicated `matchMedia`/Phaser-mock scaffolding across 15+ scene test files,
and verify/fix the `GameSceneBase` sticker-scale quirk. Byte-identical
behavior except the quirk fix.
