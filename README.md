# ITDI204 Cloud Deployment Project

## Student Information

- Student name: Benoit YOU
- Course: ITDI204 Cloud Computing
- Application: Nakamal-App

## Project Overview

This application is an application listing all the Nakamals in Port VILA

## Cloud Deployment

This application is deployed using Render.

## Repository Structure

This package contains:
- `frontend-static/` → Render Static Site
- `backend-api/` → Render Web Service (Node.js + Express)
- `database/` → PostgreSQL schema scripts
- `render.yaml` → optional Render Blueprint for one-repo deployment

## Local Installation

Non relevant

## Branching Strategy

| Branch | Purpose |
|---|---|
| main | Production version |
| staging | Testing version before production |
| benoit-dev | Personal working branch |

## Render Environments

| Environment | Branch | Render URL |
|---|---|---|
| Staging | staging | Add URL here |
| Production | main | Add URL here |

## Environment Variables

| Variable Name | Purpose | Where it is stored |
|---|---|---|
| PORT | Port used by the app | Render |
| API_KEY | External API key, if used | Render Environment Variables |

## Deployment Notes

Explain any issue you had during deployment and how you fixed it.

# Others comments

## What is verified in this version
- The backend dependencies install cleanly.
- The backend API is covered by automated tests.
- The backend can auto-create the database tables at startup.
- The frontend has a build step that injects the backend API URL into the static site output.

## Recommended deployment order (manual)
1. Create the PostgreSQL database on Render.
2. Deploy `backend-api/` as a Render Web Service.
3. Set backend environment variables:
   - `DATABASE_URL`
   - `DATABASE_SSL`
   - `AUTO_RUN_MIGRATIONS=true`
4. Deploy `frontend-static/` as a Render Static Site.
5. Set `FRONTEND_API_BASE_URL` to your deployed backend URL with `/api` at the end.

## Optional one-repo deployment
You can also commit the whole package and deploy with `render.yaml`.
The Blueprint file auto-connects the backend to the Render Postgres database.
You still need to provide `FRONTEND_API_BASE_URL` during the static site setup because Render Blueprints do not expose the backend public URL directly to the static site build.
