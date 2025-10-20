export default {
  schema: './lib/drizzle.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  verbose: true,
  strict: true,
}
