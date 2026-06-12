// Access token kept in memory only (never localStorage). Per ADR 0001, the refresh
// token lives in an httpOnly cookie the browser sends automatically.
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
  clear: () => {
    accessToken = null;
  },
};
