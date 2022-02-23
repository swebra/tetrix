# Tetrix

A capstone project

## Development

- in `/server`, run `pnpm dev` or `yarn dev`
- in `/client`, run `pnpm dev` or `yarn dev`

## Build

- `pnpm build` in the monorepo root
    > `npm run build` is ran on heroku deployment, which should work locally, too.

## Environment Variables

### Client
- `VITE_BACKEND_URL`: string
    the url of the backend, if not specified the client connects to `http://localhost:3001/`
- `VITE_DISABLE_GAMESTART`: boolean
    if set to non-empty value, the client will skip game start scene (queue)

### Server
- `PORT`: int
    the port to run the server on. default to 80.