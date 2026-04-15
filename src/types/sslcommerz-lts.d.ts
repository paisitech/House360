declare module "sslcommerz-lts" {
  interface SSLCommerzInitParams {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_phone: string;
    cus_add1: string;
    cus_city: string;
    cus_country: string;
    shipping_method: string;
    num_of_item?: number;
    value_a?: string;
    value_b?: string;
    value_c?: string;
    value_d?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzInitResponse {
    status: string;
    GatewayPageURL: string;
    sessionkey: string;
    [key: string]: unknown;
  }

  interface SSLCommerzValidateParams {
    val_id: string;
    [key: string]: unknown;
  }

  interface SSLCommerzValidateResponse {
    status: string;
    tran_id: string;
    val_id: string;
    amount: string;
    [key: string]: unknown;
  }

  class SSLCommerzPayment {
    constructor(store_id: string, store_passwd: string, is_live: boolean);
    init(params: SSLCommerzInitParams): Promise<SSLCommerzInitResponse>;
    validate(
      params: SSLCommerzValidateParams
    ): Promise<SSLCommerzValidateResponse>;
  }

  export default SSLCommerzPayment;
}
