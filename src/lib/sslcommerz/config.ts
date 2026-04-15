export const SSLCOMMERZ_CONFIG = {
  store_id: process.env.SSLCOMMERZ_STORE_ID!,
  store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD!,
  is_live: process.env.SSLCOMMERZ_IS_LIVE === "true",
};
