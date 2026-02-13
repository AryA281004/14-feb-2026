import Image from "next/image";
import { Suspense } from "react";
import HomeClient from "@/app/components/HomeClient";

export default async function Home() {
  return (
    <main className="relative min-h-screen font-sans overflow-hidden">

      <div className="absolute inset-0 -z-20">
        <Image
          src="/clouds1.webp"
          alt="will you be my valentine"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      <Suspense fallback={<div className="fixed inset-0 bg-white z-50 flex items-center justify-center">Loading...</div>}>
        <HomeClient />
      </Suspense>

    </main>
  );
}
