# Tetrix
A capstone project

## Development
- in `/server`, run `pnpm dev` or `yarn dev`
- in `/client`, run `pnpm dev` or `yarn dev`

### Environment Variables
| Component | Name | Type | Default | Function |
| --------- | ---- | ---- | ------- | -------- |
| Client | `VITE_BACKEND_URL` | String | `http://localhost:3001/` | URL of the Tetrix backend server (not to be confused with the client Vite server) |
| Client & Server | `VITE_DISABLE_WAITING_ROOM` | Boolean | `false` | Skips the game's initial player waiting room |
| Server | `PORT` | Integer | `80` | The port used by the server |


## Build
- `pnpm build` in the monorepo root
    > `npm run build` is ran on heroku deployment which should work locally, too.
