### A mock demo of a contractor-focused, site-first email workflow.

## What is this?
SiteThreads is a UI prototype that reimagines contractor email around job sites:
- inbox on the left
- map in the center
- site/thread workspace on the right
- integrates automatically 

## Current demo features
- inbox-style left rail
- draggable email linking to map sites
- create new site from the map
- right-side thread/email reader
- in-app reply/new email mock flows
- local persistence for demo state
- attachment viewer in the app UI

## Demo scope
This repository is currently a **mock/local demo** intended to showcase workflow and UX.

It is **not yet a production Gmail client**.

## Not production-ready yet
The following are planned for a future production release:
- secure Gmail OAuth flow
- live Gmail read/send sync
- server-side persistence
- real geocoding and address normalization
- production-safe attachment storage/streaming
- team access / account management
- mobile application

## Running locally
```bash
npm install
npm run dev
=======
# SiteThread

A Next.js prototype for a contractor inbox map with mock data, drag/drop site linking, and optional Gmail read sync.

## Run locally

1. Install dependencies

```bash
npm install
```

2. Copy env file and add your Google OAuth credentials

```bash
cp .env.example .env.local
```

3. Start the dev server

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Gmail read sync (prototype)

This build adds a prototype Gmail connection flow.

Required env vars:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Recommended local callback:

```text
http://localhost:3000/api/gmail/callback
```

After you add your Google OAuth credentials:

- click **Connect Gmail** in the left rail
- approve Gmail read-only access
- return to SiteThread
- click **Sync Gmail**

Recent Gmail messages from the last 180 days are imported into the inbox feed and can be read in the right-side panel, then manually linked to map sites.

## Included

- real interactive map (Leaflet + OpenStreetMap tiles)
- inbox feed on the left rail
- site timeline on the right
- drag/drop email-to-site linking
- create site from empty map drop
- local persistence for mock app state
- attachment viewing in-app
- Gmail read-only sync prototype

## Notes

- Gmail tokens are stored in cookies in this prototype so you can test the flow locally.
- Gmail read sync is read-only in this step; send/reply still uses the mock send routes already present in the app shell.
>>>>>>> d564064 (Initial mock demo release)
