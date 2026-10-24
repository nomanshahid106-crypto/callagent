import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DemoProvider } from "@/components/DemoProvider";

export const metadata: Metadata = {
  title: "CallAgent — AI Call Agents That Call For You",
  description:
    "Pick an AI call agent, subscribe, paste your phone numbers — the AI calls them one by one, summarises every call, and gives you a results list.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
