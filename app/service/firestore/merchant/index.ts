import firestore from "../client";
import type { MSMerchant } from "../type";

const merchantCollection = firestore.collection("merchant");

// マーチャントを作成する関数
export const createMerchant = async (merchant: MSMerchant) => {
  try {
    const userRef = merchantCollection.doc();
    await userRef.set(merchant);
    return { ...merchant };
  } catch (error) {
    console.error("Error creating merchant:", error);
    throw error;
  }
};

// マーチャントを更新する関数
export const updateMerchant = async (merchant: MSMerchant) => {
  try {
    const userRef = merchantCollection.doc(merchant.id);
    await userRef.set(merchant, { merge: true });
    return { ...merchant };
  } catch (error) {
    console.error("Error updating merchant:", error);
    throw error;
  }
};

// マーチャントを取得する関数のリファクタリング
export const getMerchant = async (id: string) => {
  try{
  const snapshot = await merchantCollection
    .where("id", "==", id)
    .get();

    if (snapshot.docs.length === 0) {
      return null;
    }

    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error getting merchant:", error);
    throw error;
  }
};

// ストア全体でポイントの付与を除外する商品を設定する関数
export const setPointExcludedProductIds = async (merchantId: string, productIds: string[]) => {
  try {
    const merchantRef = merchantCollection.doc(merchantId);
    await merchantRef.set({ point_excluded_product_ids: productIds }, { merge: true });
  } catch (error) {
    console.error("Error setting point excluded product IDs:", error);
    throw error;
  }
};


// ポイントの付与を除外する商品を取得する関数
export const getPointExcludedProductIds = async (merchantId: string) => {
  try {
    const merchantRef = merchantCollection.doc(merchantId);
    const snapshot = await merchantRef.get();
    return snapshot.data()?.point_excluded_product_ids || [];
  } catch (error) {
    console.error("Error getting point excluded product IDs:", error);
    throw error;
  }
};

// マーチャントのストアポイント設定データを取得する関数
export const getMerchantPointInfo = async (merchantId: string) => {
  try {
    const merchantRef = merchantCollection.doc(merchantId);
    const snapshot = await merchantRef.get();
    return snapshot.data();
  } catch (error) {
    console.error("Error getting merchant point info:", error);
    throw error;
  }
};
