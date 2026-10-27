"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CryptoReviewQueue } from "@/components/exchange/CryptoReviewQueue";
import { CryptoAssetSettings } from "@/components/exchange/CryptoAssetSettings";

type CryptoSection = "BUY" | "SELL" | "SETTINGS";

export default function CryptoQueuePage() {
  const [section, setSection] = useState<CryptoSection>("BUY");

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Crypto Exchange"
        description="Review customer buy and sell requests, and manage supported assets."
      />
      <Tabs value={section} onValueChange={(value) => setSection(value as CryptoSection)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="BUY">Buy review</TabsTrigger>
          <TabsTrigger value="SELL">Sell review</TabsTrigger>
          <TabsTrigger value="SETTINGS">Assets & payment account</TabsTrigger>
        </TabsList>
      </Tabs>
      {section === "BUY" && <CryptoReviewQueue direction="BUY" />}
      {section === "SELL" && <CryptoReviewQueue direction="SELL" />}
      {section === "SETTINGS" && <CryptoAssetSettings />}
    </div>
  );
}
