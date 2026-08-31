# Dev Uni current design baseline

Saved on 2026-08-01 before the authored-archive redesign concept was created.

This baseline is a rollback reference only. Saving it did not modify the active site implementation.

## Archive

- File: `dev-uni-current-design-source.tar.gz`
- SHA-256: `ead1b871b6b87c116b1a85520300a9e942b32f5d3af8c9738d4e6ffdfab36ac5`

## Included sources

- `quartz/styles/custom.scss`
- `quartz/components/DevUniLanding.tsx`
- `quartz/components/PrimaryNavigation.tsx`
- `quartz/components/Header.tsx`
- `quartz/components/DevUniFooter.tsx`
- `quartz/components/devUniSurface.ts`
- `quartz/components/frames/DevUniFrame.tsx`
- `quartz/components/frames/DefaultFrame.tsx`
- `quartz/components/frames/FullWidthFrame.tsx`
- `quartz/components/frames/MinimalFrame.tsx`
- `quartz.config.default.yaml`

## Inspect without restoring

```sh
tar -tzf dev-uni-current-design-source.tar.gz
```

## Restore into a temporary directory

```sh
mkdir -p /tmp/dev-uni-current-design
tar -xzf dev-uni-current-design-source.tar.gz -C /tmp/dev-uni-current-design
```

Do not extract directly over the working tree without first reviewing the diff.
