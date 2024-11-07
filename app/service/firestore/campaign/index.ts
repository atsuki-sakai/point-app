
import firestore from "../client";
import type { MSCampaign } from "../type";


const campaignCollection = firestore.collection("campaign");

export const createCampaign = async (campaign: MSCampaign) => {
  try {
    const campaignRef = campaignCollection.doc();
    await campaignRef.set({ ...campaign, id: campaignRef.id });
    return { ...campaign, id: campaignRef.id };
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};

export const getCampaignToMerchantId = async (merchantId: string): Promise<any> => {
  try {
    const snapshot = await campaignCollection
      .where("merchant_id", "==", merchantId)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting campaign to merchant id:", error);
    throw error;
  }
};

export const getCampaignById = async (campaignId: string): Promise<any> => {
  try {
    const snapshot = await campaignCollection.where("id", "==", campaignId).get();
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error getting campaign by id:", error);
    throw error;
  }
};

export const updateCampaign = async (campaignId: string, campaign: MSCampaign) => {
  try {
    const campaignRef = campaignCollection.doc(campaignId);
    await campaignRef.update(campaign);
    return { ...campaign, id: campaignId };
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
};

export const deleteCampaign = async (campaignId: string) => {
  try {
    await campaignCollection.doc(campaignId).delete();
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
};

export const setCampaignExcludedProductIds = async (campaignId: string, productIds: string[]) => {
  try {
    const campaignRef = campaignCollection.doc(campaignId);
    await campaignRef.set({ excluded_product_ids: productIds }, { merge: true });
  } catch (error) {
    console.error("Error setting campaign excluded product IDs:", error);
    throw error;
  }
};
