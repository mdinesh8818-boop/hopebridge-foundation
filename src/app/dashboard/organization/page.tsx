import ModulePage from "../components/ModulePage";

export default function OrganizationPage() {
  return (
    <ModulePage
      eyebrow="Administration"
      title="Organization"
      modulePath="Organization"
      description="Manage foundation information, structure, departments, permissions, and operating settings."
      primaryAction="Update Organization"
    />
  );
}
