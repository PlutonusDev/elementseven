import Link from "next/link";
import { audienceCounts } from "@/lib/campaigns";
import { AdminPageHeader } from "@/components/admin/ui";
import { CampaignEditor } from "@/components/admin/campaign-editor";

export const metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const counts = await audienceCounts();
  return (
    <div>
      <AdminPageHeader
        title="New campaign"
        description="Save first, then preview and test-send before sending."
        actions={
          <Link href="/admin/campaigns" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
            ← Campaigns
          </Link>
        }
      />
      <div className="max-w-3xl">
        <CampaignEditor campaign={null} counts={counts} />
      </div>
    </div>
  );
}
