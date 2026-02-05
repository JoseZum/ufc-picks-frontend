"use client";

import { UserProfilePageV2 } from "@/components/design-system-v2/pages/UserProfilePageV2";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params;
  return <UserProfilePageV2 userId={userId} />;
}
