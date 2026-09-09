# Theme lab

A folder of files that hit every syntax role, so a colour theme can be judged on *real* code, not a screenshot. Open it in the Extension Development Host and flip through the tabs.

## What is here

| File | Language | Why it is here |
| --- | --- | --- |
| `shipments.ts` | TypeScript | types, generics, classes, async, regex, numbers |
| `ShipmentTable.tsx` | TSX | JSX tags, attributes, expressions |
| `scorecard.py` | Python | dataclasses, decorators, f-strings, walrus |
| `ci.yaml` | YAML | keys, anchors, block scalars, `${{ }}` |

## How to look

1. Open the theme folder in Cursor and press **F5**.
2. In the new window, open this folder.
3. Run `Developer: Inspect Editor Tokens and Scopes` on anything that looks wrong.

> Rule from the apartment: keep the surfaces daylight hits light, the dark lives on the floor and furniture. On a screen that means light text, dark ground, one warm thing.

```ts
const summary = await service.list({ customerId, page: 1 }, actor);
console.log(ShipmentService.formatDocumentNumber(summary.items[0]?.documentNumber ?? 0));
```

- [ ] statusline re-checked on the new ground
- [x] samples written
- [x] screenshots on the sheet — see [the sheet](https://claude.ai/code/artifact/48b2ee4c-4572-48f2-9962-ff028536347f "Cursor Theme Sheet")

Inline `code`, **bold**, _italic_, ~~struck~~, and a footnote[^1].

---

[^1]: Values are sampled from the June stills, not invented.
