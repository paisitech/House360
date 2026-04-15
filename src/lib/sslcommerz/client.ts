import SSLCommerzPayment from "sslcommerz-lts";
import { SSLCOMMERZ_CONFIG } from "./config";

export function createSSLCommerzClient() {
  return new SSLCommerzPayment(
    SSLCOMMERZ_CONFIG.store_id,
    SSLCOMMERZ_CONFIG.store_passwd,
    SSLCOMMERZ_CONFIG.is_live
  );
}
