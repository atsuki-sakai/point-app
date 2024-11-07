var _a;
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useNavigate, Form, useActionData, Link, useRouteError } from "@remix-run/react";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, ApiVersion, AppDistribution, LoginErrorType, boundary } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import { PrismaClient } from "@prisma/client";
import { useState, useCallback } from "react";
import { Page, Layout, BlockStack, Frame, Card, TextField, Text, DatePicker, Checkbox, Button, Toast, useIndexResourceState, IndexTable, Thumbnail, Divider, ButtonGroup, Bleed, EmptyState, InlineStack, Badge, AppProvider, FormLayout } from "@shopify/polaris";
import admin from "firebase-admin";
import dotenv from "dotenv";
import { TitleBar, NavMenu } from "@shopify/app-bridge-react";
import { AppProvider as AppProvider$1 } from "@shopify/shopify-app-remix/react";
if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
}
const prisma = global.prisma || new PrismaClient();
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  future: {
    unstable_newEmbeddedAuthStrategy: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.October24;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const ABORT_DELAY = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
function App$2() {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }),
      /* @__PURE__ */ jsx(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        }
      ),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App$2
}, Symbol.toStringTag, { value: "Module" }));
const action$5 = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }
  return new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
dotenv.config();
const serviceAccount = process.env.GCP_CREDENTIALS;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const firestore = admin.firestore();
const campaignCollection = firestore.collection("campaign");
const createCampaign = async (campaign) => {
  try {
    const campaignRef = campaignCollection.doc();
    await campaignRef.set({ ...campaign, id: campaignRef.id });
    return { ...campaign, id: campaignRef.id };
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};
const getCampaignToMerchantId = async (merchantId) => {
  try {
    const snapshot = await campaignCollection.where("merchant_id", "==", merchantId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting campaign to merchant id:", error);
    throw error;
  }
};
const getCampaignById = async (campaignId) => {
  try {
    const snapshot = await campaignCollection.where("id", "==", campaignId).get();
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error getting campaign by id:", error);
    throw error;
  }
};
const updateCampaign = async (campaignId, campaign) => {
  try {
    const campaignRef = campaignCollection.doc(campaignId);
    await campaignRef.update(campaign);
    return { ...campaign, id: campaignId };
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
};
const deleteCampaign = async (campaignId) => {
  try {
    await campaignCollection.doc(campaignId).delete();
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
};
const loader$7 = async ({ params }) => {
  const { id } = params;
  const campaign = await getCampaignById(id);
  return json({ campaign });
};
const action$4 = async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const admin2 = await authenticate.admin(request);
  const { shop } = admin2.session;
  const updatedData = {
    id,
    merchant_id: shop,
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    special_point_rate: formData.get("special_point_rate"),
    end_date: formData.get("end_date"),
    publish: formData.get("publish") === "true" ? true : false,
    point_excluded_product_ids: []
  };
  await updateCampaign(id, updatedData);
  return json({ success: true });
};
function EditCampaign() {
  var _a2;
  const { campaign } = useLoaderData();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState(campaign);
  const [{ month, year }, setDate] = useState({
    month: new Date(campaign.start_date).getMonth(),
    year: new Date(campaign.start_date).getFullYear()
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(campaign.start_date),
    end: new Date(campaign.end_date)
  });
  const handleMonthChange = useCallback(
    (month2, year2) => setDate({ month: month2, year: year2 }),
    []
  );
  const [showToast, setShowToast] = useState(false);
  const showSuccessMessage = () => {
    if (showToast) {
      return /* @__PURE__ */ jsx(
        Toast,
        {
          content: "キャンペーンを編集しました。",
          onDismiss: () => setShowToast(false),
          duration: 3e3
        }
      );
    }
  };
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "キャンペーン編集",
      backAction: {
        content: "戻る",
        onAction: () => navigate("/app/campaign")
      },
      children: /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(BlockStack, { gap: "400", children: /* @__PURE__ */ jsx(Frame, { children: /* @__PURE__ */ jsxs(Card, { children: [
        showSuccessMessage(),
        /* @__PURE__ */ jsx(Form, { method: "POST", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(
            TextField,
            {
              label: "キャンペーン名",
              id: "name",
              placeholder: "キャンペーン名を入力してください",
              name: "name",
              value: campaignData.name,
              onChange: (value) => setCampaignData({ ...campaignData, name: value }),
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(Text, { as: "h2", children: "開催期間" }),
          /* @__PURE__ */ jsx(
            DatePicker,
            {
              month,
              year,
              onChange: setSelectedDates,
              onMonthChange: handleMonthChange,
              selected: selectedDates,
              multiMonth: true,
              allowRange: true
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              id: "start_date",
              label: "開始日",
              placeholder: "開始日を入力してください",
              name: "start_date",
              readOnly: true,
              value: selectedDates.start.toISOString().split("T")[0],
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              label: "終了日",
              id: "end_date",
              placeholder: "終了日を入力してください",
              name: "end_date",
              readOnly: true,
              value: selectedDates.end.toISOString().split("T")[0],
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              label: "キャンペーン期間中のポイント還元率",
              id: "special_point_rate",
              placeholder: "ポイント還元率を入力してください",
              name: "special_point_rate",
              suffix: "%",
              type: "number",
              value: (_a2 = campaignData == null ? void 0 : campaignData.special_point_rate) == null ? void 0 : _a2.toString(),
              onChange: (value) => setCampaignData({
                ...campaignData,
                special_point_rate: Number(value)
              }),
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "hidden",
              name: "publish",
              value: (campaignData == null ? void 0 : campaignData.publish) ? "true" : "false"
            }
          ),
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              label: "キャンペーンを有効にする",
              checked: campaignData == null ? void 0 : campaignData.publish,
              onChange: (value) => setCampaignData({ ...campaignData, publish: value })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              submit: true,
              variant: "primary",
              size: "large",
              onClick: () => setShowToast(true),
              children: "キャンペーンを編集"
            }
          )
        ] }) })
      ] }) }) }) }) })
    }
  );
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: EditCampaign,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const merchantCollection = firestore.collection("merchant");
const updateMerchant = async (merchant) => {
  try {
    const userRef = merchantCollection.doc(merchant.id);
    await userRef.set(merchant, { merge: true });
    return { ...merchant };
  } catch (error) {
    console.error("Error updating merchant:", error);
    throw error;
  }
};
const getMerchant = async (id) => {
  try {
    const snapshot = await merchantCollection.where("id", "==", id).get();
    if (snapshot.docs.length === 0) {
      return null;
    }
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error getting merchant:", error);
    throw error;
  }
};
const setPointExcludedProductIds = async (merchantId, productIds) => {
  try {
    const merchantRef = merchantCollection.doc(merchantId);
    await merchantRef.set({ point_excluded_product_ids: productIds }, { merge: true });
  } catch (error) {
    console.error("Error setting point excluded product IDs:", error);
    throw error;
  }
};
const getPointExcludedProductIds = async (merchantId) => {
  var _a2;
  try {
    const merchantRef = merchantCollection.doc(merchantId);
    const snapshot = await merchantRef.get();
    return ((_a2 = snapshot.data()) == null ? void 0 : _a2.point_excluded_product_ids) || [];
  } catch (error) {
    console.error("Error getting point excluded product IDs:", error);
    throw error;
  }
};
const loader$6 = async ({ request }) => {
  const { admin: admin2, session } = await authenticate.admin(request);
  const products = await admin2.rest.resources.Product.all({
    session,
    limit: 250
  });
  const excludedProductIds = await getPointExcludedProductIds(session.shop);
  return json({ products: products.data, excludedProductIds });
};
const action$3 = async ({ request }) => {
  const admin2 = await authenticate.admin(request);
  const { shop } = admin2.session;
  const formData = await request.formData();
  const selectedProductIds = JSON.parse(formData.get("productIds"));
  setPointExcludedProductIds(shop, selectedProductIds);
  return redirect(`/app/excluded-product`);
};
function ExcludedProductPage() {
  const { products, excludedProductIds } = useLoaderData();
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(products, {
    selectedResources: excludedProductIds
  });
  const resourceName = {
    singular: "product",
    plural: "products"
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  console.log("currentItems", JSON.stringify(currentItems));
  const totalPages = Math.ceil(products.length / itemsPerPage);
  return /* @__PURE__ */ jsxs(Page, { fullWidth: true, children: [
    /* @__PURE__ */ jsx(TitleBar, { title: " Additional page" }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Form, { method: "POST", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "800", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingLg", children: "ポイント還元除外商品" }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(
          IndexTable,
          {
            resourceName,
            itemCount: products.length ?? 0,
            selectedItemsCount: allResourcesSelected ? "All" : selectedResources.length,
            onSelectionChange: handleSelectionChange,
            headings: [
              { title: "image" },
              { title: "title" },
              { title: "price" }
            ],
            children: currentItems.map((product, index2) => /* @__PURE__ */ jsxs(
              IndexTable.Row,
              {
                id: product.id,
                selected: selectedResources.includes(product.id),
                position: index2 + indexOfFirstItem,
                children: [
                  /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(
                    Thumbnail,
                    {
                      source: product.image.src,
                      size: "small",
                      alt: product.title
                    }
                  ) }),
                  /* @__PURE__ */ jsxs(IndexTable.Cell, { children: [
                    product.title,
                    " - ",
                    product.id
                  ] }),
                  /* @__PURE__ */ jsxs(IndexTable.Cell, { children: [
                    "¥",
                    product.variants[0].price
                  ] })
                ]
              },
              product.id
            ))
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "hidden",
            name: "productIds",
            value: JSON.stringify(selectedResources)
          }
        ),
        /* @__PURE__ */ jsx(Divider, { borderColor: "border" }),
        /* @__PURE__ */ jsxs(BlockStack, { gap: "800", align: "center", inlineAlign: "center", children: [
          /* @__PURE__ */ jsxs(ButtonGroup, { children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
                disabled: currentPage === 1,
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsxs(Text, { as: "h2", children: [
              "Page ",
              currentPage,
              " of ",
              totalPages
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
                disabled: currentPage === totalPages,
                children: "Next"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "large",
              fullWidth: true,
              submit: true,
              variant: "primary",
              children: "設定を更新する"
            }
          ),
          /* @__PURE__ */ jsx(Bleed, { marginInlineEnd: "600" })
        ] })
      ] }) })
    ] }) }) })
  ] });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: ExcludedProductPage,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({ request }) => {
  const admin2 = await authenticate.admin(request);
  const { shop } = admin2.session;
  const merchantCampaigns = await getCampaignToMerchantId(shop);
  return json({ merchantCampaigns });
};
const action$2 = async ({ request }) => {
  const admin2 = await authenticate.admin(request);
  const { shop } = admin2.session;
  if (request.method === "DELETE") {
    const formData2 = await request.formData();
    const deleteCampaignId = formData2.get("delete-campaign-id");
    await deleteCampaign(deleteCampaignId);
    return json({ success: true });
  }
  const formData = await request.formData();
  const name = formData.get("name");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");
  const special_point_rate = formData.get("special_point_rate");
  const publish = formData.get("publish") === "true" ? true : false;
  const campaignData = {
    id: "",
    merchant_id: shop,
    name: String(name ?? ""),
    // Convert to string
    start_date: String(start_date ?? ""),
    // Convert to string
    end_date: String(end_date ?? ""),
    // Convert to string
    special_point_rate: Number(special_point_rate ?? 0),
    // Convert to number
    publish,
    // Ensure status is a boolean
    point_excluded_product_ids: []
  };
  const campaign = await createCampaign(campaignData);
  return json({ campaign });
};
function CampaignPage() {
  var _a2;
  const navigate = useNavigate();
  const { merchantCampaigns } = useLoaderData();
  console.log(merchantCampaigns);
  const [campaignData, setCampaignData] = useState({
    id: "",
    merchant_id: "",
    name: "",
    start_date: "",
    end_date: "",
    special_point_rate: 0,
    point_excluded_product_ids: [],
    publish: true
  });
  const [{ month, year }, setDate] = useState({
    month: (/* @__PURE__ */ new Date()).getMonth(),
    year: (/* @__PURE__ */ new Date()).getFullYear()
  });
  const [selectedDates, setSelectedDates] = useState({
    start: /* @__PURE__ */ new Date(),
    end: /* @__PURE__ */ new Date()
  });
  const handleMonthChange = useCallback(
    (month2, year2) => setDate({ month: month2, year: year2 }),
    []
  );
  const [showToast, setShowToast] = useState(false);
  const toastMarkup = showToast ? /* @__PURE__ */ jsx(
    Toast,
    {
      content: "キャンペーンを作成しました",
      onDismiss: () => setShowToast(false)
    }
  ) : null;
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(Page, { children: [
    /* @__PURE__ */ jsx(TitleBar, { title: "キャンペーン設定" }),
    /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(Frame, { children: [
      toastMarkup,
      /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { fontWeight: "bold", as: "h1", children: "キャンペーンを作成する" }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(Form, { method: "POST", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(
            TextField,
            {
              label: "キャンペーン名",
              id: "name",
              placeholder: "キャンペーン名を入力してください",
              name: "name",
              value: campaignData == null ? void 0 : campaignData.name,
              onChange: (value) => setCampaignData({ ...campaignData, name: value }),
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            DatePicker,
            {
              month,
              year,
              onChange: setSelectedDates,
              onMonthChange: handleMonthChange,
              selected: selectedDates,
              multiMonth: true,
              allowRange: true
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              id: "start_date",
              label: "開始日",
              placeholder: "開始日を入力してください",
              name: "start_date",
              readOnly: true,
              value: selectedDates.start.toISOString().split("T")[0],
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              label: "終了日",
              id: "end_date",
              placeholder: "終了日を入力してください",
              name: "end_date",
              readOnly: true,
              value: selectedDates.end.toISOString().split("T")[0],
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            TextField,
            {
              label: "ポイント還元率",
              id: "special_point_rate",
              placeholder: "ポイント還元率を入力してください",
              name: "special_point_rate",
              suffix: "%",
              type: "number",
              value: (_a2 = campaignData == null ? void 0 : campaignData.special_point_rate) == null ? void 0 : _a2.toString(),
              onChange: (value) => setCampaignData({
                ...campaignData,
                special_point_rate: Number(value)
              }),
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "hidden",
              name: "publish",
              value: (campaignData == null ? void 0 : campaignData.publish) ? "true" : "false"
            }
          ),
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              label: "有効にする",
              checked: campaignData == null ? void 0 : campaignData.publish,
              onChange: (value) => setCampaignData({ ...campaignData, publish: value })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              submit: true,
              variant: "primary",
              size: "large",
              onClick: () => setShowToast(true),
              children: "キャンペーンを作成"
            }
          )
        ] }) }) }),
        /* @__PURE__ */ jsx(Card, { children: merchantCampaigns.length === 0 ? /* @__PURE__ */ jsx(
          EmptyState,
          {
            heading: "まだキャンペーンがありません.",
            action: { content: "キャンペーンを作成" },
            image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
            children: /* @__PURE__ */ jsx("p", { children: "キャンペーンを作成して、ポイント還元率を設定しましょう。" })
          }
        ) : /* @__PURE__ */ jsx(Card, { padding: "400", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { fontWeight: "bold", as: "h1", alignment: "center", children: "キャンペーン一覧" }),
          /* @__PURE__ */ jsx(BlockStack, { gap: "800", children: merchantCampaigns.map(
            (campaign, index2) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
              /* @__PURE__ */ jsx(Text, { fontWeight: "bold", as: "h1", children: campaign.name }),
              /* @__PURE__ */ jsxs(InlineStack, { gap: "400", children: [
                /* @__PURE__ */ jsxs(Text, { as: "span", children: [
                  "開始日: ",
                  campaign.start_date
                ] }),
                /* @__PURE__ */ jsxs(Text, { as: "span", children: [
                  "終了日: ",
                  campaign.end_date
                ] }),
                /* @__PURE__ */ jsx(
                  Badge,
                  {
                    size: "small",
                    tone: campaign.publish ? "success" : "critical",
                    children: campaign.publish ? "有効" : "無効"
                  }
                ),
                /* @__PURE__ */ jsxs(Text, { as: "span", children: [
                  "ポイント還元率:",
                  " ",
                  campaign.special_point_rate,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxs(ButtonGroup, { children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "primary",
                    onClick: () => navigate(
                      `/app/campaign-edit/${campaign.id}`
                    ),
                    children: "キャンペーンを編集"
                  }
                ),
                /* @__PURE__ */ jsxs(Form, { method: "DELETE", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "hidden",
                      name: "delete-campaign-id",
                      value: campaign.id
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "primary",
                      tone: "critical",
                      submit: true,
                      children: "キャンペーンを削除"
                    }
                  )
                ] })
              ] })
            ] }) }, index2)
          ) })
        ] }) }) })
      ] })
    ] }) }) })
  ] }) });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: CampaignPage,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const getProducts = async (accessToken, shop, limit) => {
  if (!accessToken || !shop) {
    throw new Error("accessToken or shop is not defined");
  }
  const response = await fetch(
    `https://${shop}/admin/api/2024-10/products.json?limit=${250}`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken
      }
    }
  );
  const responseData = await response.json();
  return responseData;
};
const loader$4 = async ({ request }) => {
  const admin2 = await authenticate.admin(request);
  const { shop, accessToken } = admin2.session;
  const merchant = await getMerchant(shop);
  const products = await getProducts(accessToken, shop);
  return json({ merchant, products });
};
const action$1 = async ({ request }) => {
  let formData = await request.formData();
  const admin2 = await authenticate.admin(request);
  const { shop, accessToken } = admin2.session;
  const point = formData.get("point");
  const pointRate = formData.get("point_rate");
  const expirationOfPointsDay = formData.get(
    "expiration_of_points_day"
  );
  await updateMerchant({
    id: shop,
    accessToken: accessToken ?? "",
    amount_of_points: Number(point),
    point_rate: Number(pointRate),
    expiration_of_points_day: Number(expirationOfPointsDay)
  });
  return redirect(`/app`);
};
function Index() {
  const { merchant } = useLoaderData();
  const [point, setPoint] = useState((merchant == null ? void 0 : merchant.amount_of_points) ?? "100");
  const [pointRate, setPointRate] = useState((merchant == null ? void 0 : merchant.point_rate) ?? "1");
  const [expirationOfPointsDay, setExpirationOfPointsDay] = useState(
    (merchant == null ? void 0 : merchant.expiration_of_points_day) ?? "360"
  );
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active2) => !active2), []);
  const toastMarkup = active ? /* @__PURE__ */ jsx(
    Toast,
    {
      content: "ポイント還元設定が変更されました",
      onDismiss: toggleActive
    }
  ) : null;
  return /* @__PURE__ */ jsx(Page, { children: /* @__PURE__ */ jsxs(Frame, { children: [
    /* @__PURE__ */ jsx(TitleBar, { title: "Multiseller App", children: "Point App" }),
    /* @__PURE__ */ jsx(BlockStack, { gap: "500", children: /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
      toastMarkup,
      /* @__PURE__ */ jsx(Form, { method: "POST", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingLg", children: "ポイント還元設定" }),
        /* @__PURE__ */ jsx(
          TextField,
          {
            id: "point",
            name: "point",
            label: "ポイント還元の最低購入金額",
            autoComplete: "off",
            type: "number",
            placeholder: "100",
            prefix: "¥",
            value: point,
            onChange: (value) => setPoint(value)
          }
        ),
        /* @__PURE__ */ jsx(
          TextField,
          {
            id: "point_rate",
            name: "point_rate",
            label: "ポイント還元率(%)",
            autoComplete: "off",
            type: "number",
            placeholder: "1",
            suffix: "%",
            value: pointRate,
            onChange: (value) => setPointRate(value)
          }
        ),
        /* @__PURE__ */ jsx(
          TextField,
          {
            id: "expiration_of_points_day",
            name: "expiration_of_points_day",
            label: "ポイントの最終利用日からの有効期限",
            autoComplete: "off",
            type: "number",
            placeholder: "360",
            suffix: "日",
            value: expirationOfPointsDay,
            onChange: (value) => setExpirationOfPointsDay(value)
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            submit: true,
            variant: "primary",
            onClick: toggleActive,
            children: "ポイント設定を変更"
          }
        )
      ] }) })
    ] }) }) }) }) })
  ] }) });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: Index,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const Polaris = {
  ActionMenu: {
    Actions: {
      moreActions: "More actions"
    },
    RollupActions: {
      rollupButton: "View actions"
    }
  },
  ActionList: {
    SearchField: {
      clearButtonLabel: "Clear",
      search: "Search",
      placeholder: "Search actions"
    }
  },
  Avatar: {
    label: "Avatar",
    labelWithInitials: "Avatar with initials {initials}"
  },
  Autocomplete: {
    spinnerAccessibilityLabel: "Loading",
    ellipsis: "{content}…"
  },
  Badge: {
    PROGRESS_LABELS: {
      incomplete: "Incomplete",
      partiallyComplete: "Partially complete",
      complete: "Complete"
    },
    TONE_LABELS: {
      info: "Info",
      success: "Success",
      warning: "Warning",
      critical: "Critical",
      attention: "Attention",
      "new": "New",
      readOnly: "Read-only",
      enabled: "Enabled"
    },
    progressAndTone: "{toneLabel} {progressLabel}"
  },
  Banner: {
    dismissButton: "Dismiss notification"
  },
  Button: {
    spinnerAccessibilityLabel: "Loading"
  },
  Common: {
    checkbox: "checkbox",
    undo: "Undo",
    cancel: "Cancel",
    clear: "Clear",
    close: "Close",
    submit: "Submit",
    more: "More"
  },
  ContextualSaveBar: {
    save: "Save",
    discard: "Discard"
  },
  DataTable: {
    sortAccessibilityLabel: "sort {direction} by",
    navAccessibilityLabel: "Scroll table {direction} one column",
    totalsRowHeading: "Totals",
    totalRowHeading: "Total"
  },
  DatePicker: {
    previousMonth: "Show previous month, {previousMonthName} {showPreviousYear}",
    nextMonth: "Show next month, {nextMonth} {nextYear}",
    today: "Today ",
    start: "Start of range",
    end: "End of range",
    months: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    },
    days: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    },
    daysAbbreviated: {
      monday: "Mo",
      tuesday: "Tu",
      wednesday: "We",
      thursday: "Th",
      friday: "Fr",
      saturday: "Sa",
      sunday: "Su"
    }
  },
  DiscardConfirmationModal: {
    title: "Discard all unsaved changes",
    message: "If you discard changes, you’ll delete any edits you made since you last saved.",
    primaryAction: "Discard changes",
    secondaryAction: "Continue editing"
  },
  DropZone: {
    single: {
      overlayTextFile: "Drop file to upload",
      overlayTextImage: "Drop image to upload",
      overlayTextVideo: "Drop video to upload",
      actionTitleFile: "Add file",
      actionTitleImage: "Add image",
      actionTitleVideo: "Add video",
      actionHintFile: "or drop file to upload",
      actionHintImage: "or drop image to upload",
      actionHintVideo: "or drop video to upload",
      labelFile: "Upload file",
      labelImage: "Upload image",
      labelVideo: "Upload video"
    },
    allowMultiple: {
      overlayTextFile: "Drop files to upload",
      overlayTextImage: "Drop images to upload",
      overlayTextVideo: "Drop videos to upload",
      actionTitleFile: "Add files",
      actionTitleImage: "Add images",
      actionTitleVideo: "Add videos",
      actionHintFile: "or drop files to upload",
      actionHintImage: "or drop images to upload",
      actionHintVideo: "or drop videos to upload",
      labelFile: "Upload files",
      labelImage: "Upload images",
      labelVideo: "Upload videos"
    },
    errorOverlayTextFile: "File type is not valid",
    errorOverlayTextImage: "Image type is not valid",
    errorOverlayTextVideo: "Video type is not valid"
  },
  EmptySearchResult: {
    altText: "Empty search results"
  },
  Frame: {
    skipToContent: "Skip to content",
    navigationLabel: "Navigation",
    Navigation: {
      closeMobileNavigationLabel: "Close navigation"
    }
  },
  FullscreenBar: {
    back: "Back",
    accessibilityLabel: "Exit fullscreen mode"
  },
  Filters: {
    moreFilters: "More filters",
    moreFiltersWithCount: "More filters ({count})",
    filter: "Filter {resourceName}",
    noFiltersApplied: "No filters applied",
    cancel: "Cancel",
    done: "Done",
    clearAllFilters: "Clear all filters",
    clear: "Clear",
    clearLabel: "Clear {filterName}",
    addFilter: "Add filter",
    clearFilters: "Clear all",
    searchInView: "in:{viewName}"
  },
  FilterPill: {
    clear: "Clear",
    unsavedChanges: "Unsaved changes - {label}"
  },
  IndexFilters: {
    searchFilterTooltip: "Search and filter",
    searchFilterTooltipWithShortcut: "Search and filter (F)",
    searchFilterAccessibilityLabel: "Search and filter results",
    sort: "Sort your results",
    addView: "Add a new view",
    newView: "Custom search",
    SortButton: {
      ariaLabel: "Sort the results",
      tooltip: "Sort",
      title: "Sort by",
      sorting: {
        asc: "Ascending",
        desc: "Descending",
        az: "A-Z",
        za: "Z-A"
      }
    },
    EditColumnsButton: {
      tooltip: "Edit columns",
      accessibilityLabel: "Customize table column order and visibility"
    },
    UpdateButtons: {
      cancel: "Cancel",
      update: "Update",
      save: "Save",
      saveAs: "Save as",
      modal: {
        title: "Save view as",
        label: "Name",
        sameName: "A view with this name already exists. Please choose a different name.",
        save: "Save",
        cancel: "Cancel"
      }
    }
  },
  IndexProvider: {
    defaultItemSingular: "Item",
    defaultItemPlural: "Items",
    allItemsSelected: "All {itemsLength}+ {resourceNamePlural} are selected",
    selected: "{selectedItemsCount} selected",
    a11yCheckboxDeselectAllSingle: "Deselect {resourceNameSingular}",
    a11yCheckboxSelectAllSingle: "Select {resourceNameSingular}",
    a11yCheckboxDeselectAllMultiple: "Deselect all {itemsLength} {resourceNamePlural}",
    a11yCheckboxSelectAllMultiple: "Select all {itemsLength} {resourceNamePlural}"
  },
  IndexTable: {
    emptySearchTitle: "No {resourceNamePlural} found",
    emptySearchDescription: "Try changing the filters or search term",
    onboardingBadgeText: "New",
    resourceLoadingAccessibilityLabel: "Loading {resourceNamePlural}…",
    selectAllLabel: "Select all {resourceNamePlural}",
    selected: "{selectedItemsCount} selected",
    undo: "Undo",
    selectAllItems: "Select all {itemsLength}+ {resourceNamePlural}",
    selectItem: "Select {resourceName}",
    selectButtonText: "Select",
    sortAccessibilityLabel: "sort {direction} by"
  },
  Loading: {
    label: "Page loading bar"
  },
  Modal: {
    iFrameTitle: "body markup",
    modalWarning: "These required properties are missing from Modal: {missingProps}"
  },
  Page: {
    Header: {
      rollupActionsLabel: "View actions for {title}",
      pageReadyAccessibilityLabel: "{title}. This page is ready"
    }
  },
  Pagination: {
    previous: "Previous",
    next: "Next",
    pagination: "Pagination"
  },
  ProgressBar: {
    negativeWarningMessage: "Values passed to the progress prop shouldn’t be negative. Resetting {progress} to 0.",
    exceedWarningMessage: "Values passed to the progress prop shouldn’t exceed 100. Setting {progress} to 100."
  },
  ResourceList: {
    sortingLabel: "Sort by",
    defaultItemSingular: "item",
    defaultItemPlural: "items",
    showing: "Showing {itemsCount} {resource}",
    showingTotalCount: "Showing {itemsCount} of {totalItemsCount} {resource}",
    loading: "Loading {resource}",
    selected: "{selectedItemsCount} selected",
    allItemsSelected: "All {itemsLength}+ {resourceNamePlural} in your store are selected",
    allFilteredItemsSelected: "All {itemsLength}+ {resourceNamePlural} in this filter are selected",
    selectAllItems: "Select all {itemsLength}+ {resourceNamePlural} in your store",
    selectAllFilteredItems: "Select all {itemsLength}+ {resourceNamePlural} in this filter",
    emptySearchResultTitle: "No {resourceNamePlural} found",
    emptySearchResultDescription: "Try changing the filters or search term",
    selectButtonText: "Select",
    a11yCheckboxDeselectAllSingle: "Deselect {resourceNameSingular}",
    a11yCheckboxSelectAllSingle: "Select {resourceNameSingular}",
    a11yCheckboxDeselectAllMultiple: "Deselect all {itemsLength} {resourceNamePlural}",
    a11yCheckboxSelectAllMultiple: "Select all {itemsLength} {resourceNamePlural}",
    Item: {
      actionsDropdownLabel: "Actions for {accessibilityLabel}",
      actionsDropdown: "Actions dropdown",
      viewItem: "View details for {itemName}"
    },
    BulkActions: {
      actionsActivatorLabel: "Actions",
      moreActionsActivatorLabel: "More actions"
    }
  },
  SkeletonPage: {
    loadingLabel: "Page loading"
  },
  Tabs: {
    newViewAccessibilityLabel: "Create new view",
    newViewTooltip: "Create view",
    toggleTabsLabel: "More views",
    Tab: {
      rename: "Rename view",
      duplicate: "Duplicate view",
      edit: "Edit view",
      editColumns: "Edit columns",
      "delete": "Delete view",
      copy: "Copy of {name}",
      deleteModal: {
        title: "Delete view?",
        description: "This can’t be undone. {viewName} view will no longer be available in your admin.",
        cancel: "Cancel",
        "delete": "Delete view"
      }
    },
    RenameModal: {
      title: "Rename view",
      label: "Name",
      cancel: "Cancel",
      create: "Save",
      errors: {
        sameName: "A view with this name already exists. Please choose a different name."
      }
    },
    DuplicateModal: {
      title: "Duplicate view",
      label: "Name",
      cancel: "Cancel",
      create: "Create view",
      errors: {
        sameName: "A view with this name already exists. Please choose a different name."
      }
    },
    CreateViewModal: {
      title: "Create new view",
      label: "Name",
      cancel: "Cancel",
      create: "Create view",
      errors: {
        sameName: "A view with this name already exists. Please choose a different name."
      }
    }
  },
  Tag: {
    ariaLabel: "Remove {children}"
  },
  TextField: {
    characterCount: "{count} characters",
    characterCountWithMaxLength: "{count} of {limit} characters used"
  },
  TooltipOverlay: {
    accessibilityLabel: "Tooltip: {label}"
  },
  TopBar: {
    toggleMenuLabel: "Toggle menu",
    SearchField: {
      clearButtonLabel: "Clear",
      search: "Search"
    }
  },
  MediaCard: {
    dismissButton: "Dismiss",
    popoverButton: "Actions"
  },
  VideoThumbnail: {
    playButtonA11yLabel: {
      "default": "Play video",
      defaultWithDuration: "Play video of length {duration}",
      duration: {
        hours: {
          other: {
            only: "{hourCount} hours",
            andMinutes: "{hourCount} hours and {minuteCount} minutes",
            andMinute: "{hourCount} hours and {minuteCount} minute",
            minutesAndSeconds: "{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds",
            minutesAndSecond: "{hourCount} hours, {minuteCount} minutes, and {secondCount} second",
            minuteAndSeconds: "{hourCount} hours, {minuteCount} minute, and {secondCount} seconds",
            minuteAndSecond: "{hourCount} hours, {minuteCount} minute, and {secondCount} second",
            andSeconds: "{hourCount} hours and {secondCount} seconds",
            andSecond: "{hourCount} hours and {secondCount} second"
          },
          one: {
            only: "{hourCount} hour",
            andMinutes: "{hourCount} hour and {minuteCount} minutes",
            andMinute: "{hourCount} hour and {minuteCount} minute",
            minutesAndSeconds: "{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds",
            minutesAndSecond: "{hourCount} hour, {minuteCount} minutes, and {secondCount} second",
            minuteAndSeconds: "{hourCount} hour, {minuteCount} minute, and {secondCount} seconds",
            minuteAndSecond: "{hourCount} hour, {minuteCount} minute, and {secondCount} second",
            andSeconds: "{hourCount} hour and {secondCount} seconds",
            andSecond: "{hourCount} hour and {secondCount} second"
          }
        },
        minutes: {
          other: {
            only: "{minuteCount} minutes",
            andSeconds: "{minuteCount} minutes and {secondCount} seconds",
            andSecond: "{minuteCount} minutes and {secondCount} second"
          },
          one: {
            only: "{minuteCount} minute",
            andSeconds: "{minuteCount} minute and {secondCount} seconds",
            andSecond: "{minuteCount} minute and {secondCount} second"
          }
        },
        seconds: {
          other: "{secondCount} seconds",
          one: "{secondCount} second"
        }
      }
    }
  }
};
const polarisTranslations = {
  Polaris
};
const polarisStyles = "/assets/styles-BeiPL2RV.css";
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
const links$1 = () => [{ rel: "stylesheet", href: polarisStyles }];
const loader$3 = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return json({ errors, polarisTranslations });
};
const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return json({
    errors
  });
};
function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;
  return /* @__PURE__ */ jsx(AppProvider, { i18n: loaderData.polarisTranslations, children: /* @__PURE__ */ jsx(Page, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(Form, { method: "post", children: /* @__PURE__ */ jsxs(FormLayout, { children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Log in" }),
    /* @__PURE__ */ jsx(
      TextField,
      {
        type: "text",
        name: "shop",
        label: "Shop domain",
        helpText: "example.myshopify.com",
        value: shop,
        onChange: setShop,
        autoComplete: "on",
        error: errors.shop
      }
    ),
    /* @__PURE__ */ jsx(Button, { submit: true, children: "Log in" })
  ] }) }) }) }) });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Auth,
  links: links$1,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const index = "_index_12o3y_1";
const heading = "_heading_12o3y_11";
const text = "_text_12o3y_12";
const content = "_content_12o3y_22";
const form = "_form_12o3y_27";
const label = "_label_12o3y_35";
const input = "_input_12o3y_43";
const button = "_button_12o3y_47";
const list = "_list_12o3y_51";
const styles = {
  index,
  heading,
  text,
  content,
  form,
  label,
  input,
  button,
  list
};
const loader$2 = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return json({ showForm: Boolean(login) });
};
function App$1() {
  const { showForm } = useLoaderData();
  return /* @__PURE__ */ jsx("div", { className: styles.index, children: /* @__PURE__ */ jsxs("div", { className: styles.content, children: [
    /* @__PURE__ */ jsx("h1", { className: styles.heading, children: "A short heading about [your app]" }),
    /* @__PURE__ */ jsx("p", { className: styles.text, children: "A tagline about [your app] that describes your value proposition." }),
    showForm && /* @__PURE__ */ jsxs(Form, { className: styles.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsxs("label", { className: styles.label, children: [
        /* @__PURE__ */ jsx("span", { children: "Shop domain" }),
        /* @__PURE__ */ jsx("input", { className: styles.input, type: "text", name: "shop" }),
        /* @__PURE__ */ jsx("span", { children: "e.g: my-shop-domain.myshopify.com" })
      ] }),
      /* @__PURE__ */ jsx("button", { className: styles.button, type: "submit", children: "Log in" })
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: styles.list, children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] })
    ] })
  ] }) });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App$1,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{ rel: "stylesheet", href: polarisStyles }];
const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};
function App() {
  const { apiKey } = useLoaderData();
  return /* @__PURE__ */ jsxs(AppProvider$1, { isEmbeddedApp: true, apiKey, children: [
    /* @__PURE__ */ jsxs(NavMenu, { children: [
      /* @__PURE__ */ jsx(Link, { to: "/app", rel: "home", children: "Home" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/excluded-product", children: "ポイント除外商品" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/campaign", children: "キャンペーン設定" })
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
function ErrorBoundary() {
  return boundary.error(useRouteError());
}
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: App,
  headers,
  links,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-D99sRxi7.js", "imports": ["/assets/components-BGDyOe_B.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-DOetYirn.js", "imports": ["/assets/components-BGDyOe_B.js"], "css": [] }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.campaign-edit.$id": { "id": "routes/app.campaign-edit.$id", "parentId": "routes/app", "path": "campaign-edit/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.campaign-edit._id-DDGs-rUv.js", "imports": ["/assets/components-BGDyOe_B.js", "/assets/Page-BlBOquBD.js", "/assets/Layout-9hDooW2t.js", "/assets/Toast-BgRIItsV.js", "/assets/DatePicker-BEsvGMWZ.js", "/assets/Checkbox-s0aEpANt.js", "/assets/context-D0ShNtlm.js", "/assets/context-DraICPrr.js"], "css": [] }, "routes/app.excluded-product": { "id": "routes/app.excluded-product", "parentId": "routes/app", "path": "excluded-product", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.excluded-product-D8QfNf6k.js", "imports": ["/assets/components-BGDyOe_B.js", "/assets/index-DDnn9pDE.js", "/assets/Page-BlBOquBD.js", "/assets/Layout-9hDooW2t.js", "/assets/context-D0ShNtlm.js", "/assets/Checkbox-s0aEpANt.js"], "css": [] }, "routes/app.campaign": { "id": "routes/app.campaign", "parentId": "routes/app", "path": "campaign", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.campaign-Bp0rPUKl.js", "imports": ["/assets/components-BGDyOe_B.js", "/assets/index-DDnn9pDE.js", "/assets/Page-BlBOquBD.js", "/assets/Layout-9hDooW2t.js", "/assets/Toast-BgRIItsV.js", "/assets/DatePicker-BEsvGMWZ.js", "/assets/Checkbox-s0aEpANt.js", "/assets/context-D0ShNtlm.js", "/assets/context-DraICPrr.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-D3Lo40L2.js", "imports": ["/assets/components-BGDyOe_B.js", "/assets/index-DDnn9pDE.js", "/assets/Page-BlBOquBD.js", "/assets/Toast-BgRIItsV.js", "/assets/Layout-9hDooW2t.js", "/assets/context-D0ShNtlm.js", "/assets/context-DraICPrr.js"], "css": [] }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-qaeTan1k.js", "imports": ["/assets/components-BGDyOe_B.js", "/assets/styles-B8Gy1_Dc.js", "/assets/Page-BlBOquBD.js", "/assets/context-D0ShNtlm.js", "/assets/context-DraICPrr.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-DyV7M__4.js", "imports": ["/assets/components-BGDyOe_B.js"], "css": ["/assets/route-TqOIn4DE.css"] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-Ckr7AnU1.js", "imports": ["/assets/components-BGDyOe_B.js", "/assets/styles-B8Gy1_Dc.js", "/assets/index-DDnn9pDE.js", "/assets/context-D0ShNtlm.js", "/assets/context-DraICPrr.js"], "css": [] } }, "url": "/assets/manifest-3c675044.js", "version": "3c675044" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": false, "v3_relativeSplatPath": false, "v3_throwAbortReason": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/app.campaign-edit.$id": {
    id: "routes/app.campaign-edit.$id",
    parentId: "routes/app",
    path: "campaign-edit/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/app.excluded-product": {
    id: "routes/app.excluded-product",
    parentId: "routes/app",
    path: "excluded-product",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/app.campaign": {
    id: "routes/app.campaign",
    parentId: "routes/app",
    path: "campaign",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route5
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
