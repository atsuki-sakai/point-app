import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  DatePicker,
  Checkbox,
  Button,
  Text,
  Frame,
  Toast,
} from "@shopify/polaris";

import { useLoaderData, Form, useNavigate } from "@remix-run/react";

import { json } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import type { MSCampaign } from "../service/firestore/type";
import { getCampaignById, updateCampaign } from "../service/firestore/campaign";
import { authenticate } from "../shopify.server";

export const loader: LoaderFunction = async ({ params }: any) => {
  const { id } = params;
  const campaign = await getCampaignById(id);
  return json({ campaign });
};

export const action: ActionFunction = async ({ request, params }: any) => {
  const { id } = params;
  const formData = await request.formData();
  const admin = await authenticate.admin(request);
  const { shop } = admin.session;
  const updatedData = {
    id: id,
    merchant_id: shop,
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    special_point_rate: formData.get("special_point_rate"),
    end_date: formData.get("end_date"),
    publish: formData.get("publish") === "true" ? true : false,
    point_excluded_product_ids: [],
  };
  await updateCampaign(id, updatedData);
  return json({ success: true });
};

export default function EditCampaign() {
  const { campaign } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState<MSCampaign>(campaign);

  const [{ month, year }, setDate] = useState({
    month: new Date(campaign.start_date).getMonth(),
    year: new Date(campaign.start_date).getFullYear(),
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(campaign.start_date),
    end: new Date(campaign.end_date),
  });

  const handleMonthChange = useCallback(
    (month: number, year: number) => setDate({ month, year }),
    [],
  );

  const [showToast, setShowToast] = useState(false);

  const showSuccessMessage = () => {
    if (showToast) {
      return (
        <Toast
          content="キャンペーンを編集しました。"
          onDismiss={() => setShowToast(false)}
          duration={3000}
        />
      );
    }
  };

  return (
    <Page
      title="キャンペーン編集"
      backAction={{
        content: "戻る",
        onAction: () => navigate("/app/campaign"),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Frame>
              <Card>
                {showSuccessMessage()}
                <Form method="POST">
                  <BlockStack gap="400">
                    <TextField
                      label="キャンペーン名"
                      id="name"
                      placeholder="キャンペーン名を入力してください"
                      name="name"
                      value={campaignData.name}
                      onChange={(value) =>
                        setCampaignData({ ...campaignData, name: value })
                      }
                      autoComplete="off"
                    />

                    <Text as="h2">開催期間</Text>
                    <DatePicker
                      month={month}
                      year={year}
                      onChange={setSelectedDates}
                      onMonthChange={handleMonthChange}
                      selected={selectedDates}
                      multiMonth
                      allowRange
                    />

                    <TextField
                      id="start_date"
                      label="開始日"
                      placeholder="開始日を入力してください"
                      name="start_date"
                      readOnly
                      value={selectedDates.start.toISOString().split("T")[0]}
                      autoComplete="off"
                    />

                    <TextField
                      label="終了日"
                      id="end_date"
                      placeholder="終了日を入力してください"
                      name="end_date"
                      readOnly
                      value={selectedDates.end.toISOString().split("T")[0]}
                      autoComplete="off"
                    />
                    <TextField
                      label="キャンペーン期間中のポイント還元率"
                      id="special_point_rate"
                      placeholder="ポイント還元率を入力してください"
                      name="special_point_rate"
                      suffix="%"
                      type="number"
                      value={campaignData?.special_point_rate?.toString()}
                      onChange={(value) =>
                        setCampaignData({
                          ...campaignData,
                          special_point_rate: Number(value),
                        })
                      }
                      autoComplete="off"
                    />
                    <input
                      type="hidden"
                      name="publish"
                      value={campaignData?.publish ? "true" : "false"}
                    />
                    <Checkbox
                      label="キャンペーンを有効にする"
                      checked={campaignData?.publish}
                      onChange={(value) =>
                        setCampaignData({ ...campaignData, publish: value })
                      }
                    />

                    <Button
                      submit
                      variant="primary"
                      size="large"
                      onClick={() => setShowToast(true)}
                    >
                      キャンペーンを編集
                    </Button>
                  </BlockStack>
                </Form>
              </Card>
            </Frame>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
