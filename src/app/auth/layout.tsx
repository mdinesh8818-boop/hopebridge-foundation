import { Suspense } from "react";
import { AuthLoading, GuestRoute } from "@/components/AuthGuard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <GuestRoute>{children}</GuestRoute>
    </Suspense>
  );
}
