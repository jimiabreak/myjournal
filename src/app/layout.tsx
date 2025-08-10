import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LiveJournal 2003",
  description: "A nostalgic LiveJournal experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TopBar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lj-content px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
