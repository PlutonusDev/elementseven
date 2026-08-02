import { getShippingZones, getStoreSettings } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [settings, zones] = await Promise.all([getStoreSettings(), getShippingZones()]);

  return (
    <div>
      <AdminPageHeader title="Settings" description="Store details and shipping configuration" />
      <div className="max-w-3xl">
        <SettingsForm
          storeName={settings.storeName}
          contactEmail={settings.contactEmail}
          freeShippingThreshold={(settings.freeShippingThresholdCents / 100).toString()}
          zonesJson={JSON.stringify(zones, null, 2)}
        />
      </div>
    </div>
  );
}
