# Theaters

Theaters, rooms, seat layouts and seat types. Permissions live in IAM; showtimes, bookings and
pricing live in their own modules.

## Model

```text
Theater 1──n Room 1──n RoomLayout (versions) 1──n Seat n──1 SeatType
```

- A room has no seats of its own: seats belong to a layout version.
- Showtimes point at a layout id; bookings store only the booked seats, never a copy of the map.

## Lifecycle

Theater and room share the same status flow:

```text
DRAFT ──▶ ACTIVE ◀──▶ INACTIVE
             │            │
             └──▶ CLOSED ◀┘
```

- New theaters and rooms start as DRAFT: set up, never sold.
- Nothing returns to DRAFT; CLOSED is terminal and read-only.
- Delete works only while DRAFT; anything that has been opened is closed instead, so its history stays.
- Status changes are actions (`activate`, `deactivate`, `close`), not a status field: each has its own rules and permission.
- Requesting the current status again is a no-op.

## Rules

### Theater

- Slug is unique and changes only while DRAFT: public URLs stay stable once opened.
- Phone number is stored as E.164; the API also accepts the local Vietnamese format.
- A closed theater cannot be edited, and its rooms cannot be created or edited.

### Room

- Code is unique per theater, stored uppercase, and changes only while DRAFT.
- The name can change at any time.
- Activating needs a published layout; a room may be ACTIVE while its theater is still DRAFT.
- A room is sellable only when both the theater and the room are ACTIVE (derived at query time).
- A closed room frees its code: a new room may reuse it (history goes by id, bookings snapshot the code).

### Room layout

- Versions per room: DRAFT → PUBLISHED → RETIRED, never backwards.
- At most one DRAFT per room, always the newest version (`max + 1`).
- Only a DRAFT can be edited; saving replaces its whole seat list.
- Editing and publishing do not need the room to be inactive: published layouts never change.
- Publishing needs at least one seat and retires the previous PUBLISHED version in the same transaction.
- Publishing affects only showtimes created afterwards; existing showtimes keep their layout.
- Rolling back means copying an old version into a new draft, never re-publishing a RETIRED one.
- Grid is at most 30 rows × 50 columns; that also bounds the number of seats.

### Seat

- Placed by its left grid cell `(x, y)`; a seat spans `seatType.width` cells and seats never overlap.
- Row labels count only rows that hold seats: A–Z skipping I and O (they read like 1 and 0), then AA.
- Column numbers count seats only, left to right, starting at 1.
- Seat code is the row label plus a two-digit column (`A01`, `AA12`); it is derived, not stored.
- A broken seat is marked INACTIVE; it still counts toward capacity.

### Seat type

- The database is the source of truth; seeded by migration, managed through CRUD.
- Code is the primary key and never changes.
- Width and max occupancy are each 1–4: upper bounds only catch typos.
- Width and max occupancy cannot change while any seat uses the type: layouts would break and capacity history would shift.
- Delete works only while no seat uses the type; there is no archive (few types, rarely changed).
- Capacity of a layout is the sum of `maxOccupancy` over its seats (a couple seat counts 2).

## Deferred

- Block deactivating or closing a theater or room while upcoming showtimes exist (showtime module).
- Experience type, projection and audio formats (showtime step); red zones.
- Bookings snapshot the room code and name at purchase.
