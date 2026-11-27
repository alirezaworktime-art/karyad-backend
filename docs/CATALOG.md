# Editing the maintenance catalog

`catalog/maintenance-catalog.json` holds replacement and inspection intervals
for Iranian-made cars (Iran Khodro, SAIPA, Pars Khodro, Zamyad).

## Structure

- `parts` — every consumable the app knows, with a stable `id`
  (`engine_oil`, `timing_belt`, …). Never rename an `id`; add a new one.
- `vehicleGroups` — cars that share one schedule (same engine and parts).
  Each group lists its `models`, a `confidence`, a `sourceFa`, and `items`.
- `items[]`
  - `action`: `replace`, `inspect` or `perform`
  - `normal` / `severe`: `{ "km": …, "months": … }` — the reminder fires at
    whichever comes first
  - `confidence` (optional): overrides the group's confidence for one item
  - `noteFa` (optional): shown to the user under the reminder

## Confidence levels

| Value | Meaning | App behavior |
| --- | --- | --- |
| `official` | Taken from the manufacturer's owner manual or bulletin | Shown as-is |
| `inferred` | Derived from a sibling model with the same engine/parts | Shown with an «تقریبی» label |
| `unverified` | Manual was unreadable or the figure is a placeholder | Shown with «نیاز به تأیید» and an edit prompt |

## Severe conditions

Taxi or ride-hailing use, heavy city traffic, short trips, dust, heat above
32°C, or mineral/semi-synthetic oil. Drivers in the app's work mode are on the
severe schedule automatically.

## Releasing a change

1. Edit the JSON and bump `catalogVersion` (`YYYY.MM.DD`, add `.N` for a
   second change on the same day).
2. Put the source (manual name and year, bulletin) in `sourceFa` or `noteFa`.
3. Run `npm test` — the schema test lists any problem with its exact path.
4. Open a pull request. CI must pass before merge.
