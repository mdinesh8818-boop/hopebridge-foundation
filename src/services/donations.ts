import {
  createDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
} from "./firestore";
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

type DonationDoc = {
  id: string;
  donorId?: string;
  campaignId?: string;
  amount?: number;
};

async function listDonations(): Promise<DonationDoc[]> {
  return (await getDocuments("donations")) as DonationDoc[];
}

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

/**
 * Keeps the donations collection aligned with a donor's recorded gift amount
 * so dashboard Funds Raised stays consistent after create/edit.
 */
export async function syncDonorGift(input: {
  donorId: string;
  donorName: string;
  amount: number;
  campaignId?: string;
  campaignName?: string;
  date: string;
  giftType?: string;
}): Promise<void> {
  const donations = await listDonations();
  const donorDonations = donations.filter((d) => d.donorId === input.donorId);
  const affectedCampaignIds = new Set<string>();

  for (const donation of donorDonations) {
    if (donation.campaignId) affectedCampaignIds.add(donation.campaignId);
  }
  if (input.campaignId) affectedCampaignIds.add(input.campaignId);

  if (input.amount <= 0) {
    await Promise.all(
      donorDonations.map((donation) => deleteDocument("donations", donation.id)),
    );
  } else if (donorDonations.length === 0) {
    await createDocument("donations", {
      donorId: input.donorId,
      donorName: input.donorName,
      amount: input.amount,
      campaignId: input.campaignId ?? "",
      campaignName: input.campaignName ?? "",
      date: input.date,
      paymentMethod: "Other",
      giftType: input.giftType ?? "One-Time",
      notes: "",
    });
  } else {
    const [primary, ...extras] = donorDonations;
    await updateDocument("donations", primary.id, {
      donorId: input.donorId,
      donorName: input.donorName,
      amount: input.amount,
      campaignId: input.campaignId ?? "",
      campaignName: input.campaignName ?? "",
      date: input.date,
      giftType: input.giftType ?? "One-Time",
    });
    await Promise.all(
      extras.map((donation) => deleteDocument("donations", donation.id)),
    );
  }

  await Promise.all(
    [...affectedCampaignIds].map((campaignId) => syncCampaignRaised(campaignId)),
  );
}

export async function deleteDonationsForDonor(donorId: string): Promise<void> {
  const donations = await listDonations();
  const donorDonations = donations.filter((d) => d.donorId === donorId);
  const affectedCampaignIds = new Set(
    donorDonations
      .map((d) => d.campaignId)
      .filter((id): id is string => Boolean(id)),
  );

  await Promise.all(
    donorDonations.map((donation) => deleteDocument("donations", donation.id)),
  );

  await Promise.all(
    [...affectedCampaignIds].map((campaignId) => syncCampaignRaised(campaignId)),
  );
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
