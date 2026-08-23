import ModulePage from "../components/ModulePage";

export default function SettingsPage() {
  return (
    <ModulePage
      eyebrow="Platform configuration"
      title="Settings"
      modulePath="Settings"
      description="Configure account preferences, notifications, security, roles, and system options."
      primaryAction="Save Settings"
    />
  );
}