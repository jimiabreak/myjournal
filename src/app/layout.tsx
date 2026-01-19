import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { ClerkProvider } from '@clerk/nextjs';

// Force dynamic rendering to avoid static generation issues with Clerk and database
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "MyJournal",
  description: "Your personal journaling space",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <TopBar />
          <div className="lj-container">
            <div className="flex">
              <Sidebar />
              <main className="lj-main-content">
                {children}
              </main>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
