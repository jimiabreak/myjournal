import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/components/SessionProvider";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "LiveJournal 2003",
  description: "A nostalgic LiveJournal experience",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <TopBar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 lj-content px-4 py-6">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
