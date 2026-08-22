-- Run once on an existing MySQL database if automatic startup migration is unavailable.
USE whtsapp;

ALTER TABLE team_members
  ADD COLUMN passwordHash TEXT NULL;

-- Do not put a plain-text password in this table.
-- The Node.js startup migration hashes ADMIN_PASSWORD from .env automatically.
