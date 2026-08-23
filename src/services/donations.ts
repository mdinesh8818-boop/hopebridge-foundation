import { createDocument, getDocuments, updateDocument } from "./firestore";
import { logActivity } from "./activity";

export type DonationRecord = {
  id: string;
  donorId: string;
  donorName: string;
  amount: number;
  campaignId?: string;
  campaignName?: string;
  date: string;
  paymentMethod?: string;
  giftType?: string;
  notes?: string;
};

export type RecordDonationInput = Omit<DonationRecord, "id">;

export async function recordDonation(
  input: RecordDonationInput,
): Promise<string | null> {
  try {
    const donationId = await createDocument("donations", {
      donorId: input.donorId,
      donorName: input.donorName,
      amount: input.amount,
      campaignId: input.campaignId ?? "",
      campaignName: input.campaignName ?? "",
      date: input.date,
      paymentMethod: input.paymentMethod ?? "Other",
      giftType: input.giftType ?? "One-Time",
      notes: input.notes ?? "",
    });

    if (input.campaignId && input.amount > 0) {
      await syncCampaignRaised(input.campaignId);
    }

    await logActivity({
      module: "donors",
      action: "donation_recorded",
      entityType: "donation",
      entityId: donationId,
      entityName: input.donorName,
      description: `Donation of $${input.amount.toLocaleString()} recorded for ${input.donorName}${input.campaignName ? ` (${input.campaignName})` : ""}`,
      metadata: {
        amount: input.amount,
        campaignId: input.campaignId,
        donorId: input.donorId,
      },
    });

    return donationId;
  } catch (error) {
    console.error("Unable to record donation.", error);
    return null;
  }
}

export async function syncCampaignRaised(campaignId: string): Promise<void> {
  const [campaigns, donations] = await Promise.all([
    getDocuments("campaigns") as Promise<
      { id: string; name?: string; raised?: number; goal?: number }[]
    >,
    getDocuments("donations") as Promise<
      { campaignId?: string; amount?: number }[]
    >,
  ]);

  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) return;

  const raised = donations
    .filter((d) => d.campaignId === campaignId)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  await updateDocument("campaigns", campaignId, { raised });
}

export async function getTotalDonations(): Promise<number> {
  const donations = (await getDocuments("donations")) as { amount?: number }[];
  return donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}
