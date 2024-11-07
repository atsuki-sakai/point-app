export type MSMerchant = {
  id: string;
  accessToken: string;
  // ポイント還元の最低購入金額
  amount_of_points: number;
  // ポイント還元率
  point_rate: number;
  // ポイント有効期限
  expiration_of_points_day?: number;
  // ポイント還元除外商品ID
  // FIXME - 上限数を設定した方が良い？
  point_excluded_product_ids?: string[];
};

export type MSCampaign = {
  id: string;
  merchant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  publish: boolean;
  special_point_rate?: number;
  point_excluded_product_ids: string[];
};

export type MSPoint = {
  id: string;
  merchant_id: string;
  customer_id: string;
  last_updated: string;
  point: number;
};

export type MSPointHistory = {
  id: string;
  point_id: string;
  action: 'ADD' | 'SUBTRACT' | 'RESET';
  amount: number;
  created_at: string;
};
