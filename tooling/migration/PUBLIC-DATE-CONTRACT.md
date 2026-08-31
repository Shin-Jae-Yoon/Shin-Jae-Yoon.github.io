# Public date contract

Every Markdown file under `content/` declares the three fields recognized by the
CreatedModifiedDate plugin: `created`, `modified`, and `published`. The build must
never fall back to Git, filesystem metadata, or the current clock.

- The 15 immutable Tistory migrations derive all three fields exactly from their
  preserved `originalPublished` value.
- Repository-authored migration product pages use
  `2026-07-19T00:00:00+09:00`, the start of the final migration date in
  Asia/Seoul, for creation, publication, and modification.
- The ambiguous legacy `date` key is not used.
- Generated folder and tag pages receive the same stable migration date through
  `configuration.generatedPageDate`; no virtual page reaches RSS or sitemap
  generation without a deterministic date.

`public-date-contract.test.mjs` enumerates the complete public Markdown input
set and rejects missing, malformed, or drifting dates.
