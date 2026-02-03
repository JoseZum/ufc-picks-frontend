"use client";

import { UserProfilePage } from "./UserProfilePage";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params;
  return <UserProfilePage userId={userId} />;
}
