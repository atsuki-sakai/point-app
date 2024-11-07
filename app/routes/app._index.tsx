import { useState, useCallback } from "react";
import { useLoaderData, Form } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// - Polaris
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  TextField,
  Frame,
  Toast,
} from "@shopify/polaris";

import { TitleBar } from "@shopify/app-bridge-react";

// - Service
import { getMerchant, updateMerchant } from "../service/firestore/merchant";
import { getProducts } from "../service/store/product";

// - Type
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

// -  Loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const admin = await authenticate.admin(request);
  const { shop, accessToken } = admin.session;

  const merchant = await getMerchant(shop);
  const products = await getProducts(accessToken!, shop);
  return json({ merchant, products });
};

// - Action
export const action = async ({ request }: ActionFunctionArgs) => {
  let formData = await request.formData();
  const admin = await authenticate.admin(request);
  // FIXME - store-idの取得方法がわからないのでdomainをidにしている
  const { shop, accessToken } = admin.session;

  const point = formData.get("point") as string;
  const pointRate = formData.get("point_rate") as string;
  const expirationOfPointsDay = formData.get(
    "expiration_of_points_day",
  ) as string;

  await updateMerchant({
    id: shop,
    accessToken: accessToken ?? "",
    amount_of_points: Number(point),
    point_rate: Number(pointRate),
    expiration_of_points_day: Number(expirationOfPointsDay),
  });

  return redirect(`/app`);
};

// - Component
export default function Index() {
  const { merchant } = useLoaderData<typeof loader>();

  const [point, setPoint] = useState(merchant?.amount_of_points ?? "100");
  const [pointRate, setPointRate] = useState(merchant?.point_rate ?? "1");
  const [expirationOfPointsDay, setExpirationOfPointsDay] = useState(
    merchant?.expiration_of_points_day ?? "360",
  );

  const [active, setActive] = useState(false);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const toastMarkup = active ? (
    <Toast
      content="ポイント還元設定が変更されました"
      onDismiss={toggleActive}
    />
  ) : null;

  return (
    <Page>
      <Frame>
        <TitleBar title="Multiseller App">Point App</TitleBar>

        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="500">
                  {toastMarkup}
                  <Form method="POST">
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingLg">
                        ポイント還元設定
                      </Text>

                      <TextField
                        id="point"
                        name="point"
                        label="ポイント還元の最低購入金額"
                        autoComplete="off"
                        type="number"
                        placeholder="100"
                        prefix="¥"
                        value={point}
                        onChange={(value) => setPoint(value)}
                      />
                      <TextField
                        id="point_rate"
                        name="point_rate"
                        label="ポイント還元率(%)"
                        autoComplete="off"
                        type="number"
                        placeholder="1"
                        suffix="%"
                        value={pointRate}
                        onChange={(value) => setPointRate(value)}
                      />
                      <TextField
                        id="expiration_of_points_day"
                        name="expiration_of_points_day"
                        label="ポイントの最終利用日からの有効期限"
                        autoComplete="off"
                        type="number"
                        placeholder="360"
                        suffix="日"
                        value={expirationOfPointsDay}
                        onChange={(value) => setExpirationOfPointsDay(value)}
                      />
                      <Button
                        submit={true}
                        variant="primary"
                        onClick={toggleActive}
                      >
                        ポイント設定を変更
                      </Button>
                    </BlockStack>
                  </Form>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Frame>
    </Page>
  );
}
