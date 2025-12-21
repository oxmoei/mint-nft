import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";

export const metadata: Metadata = {
  title: "Netlify",
  description: "Your ultimate gateway to multiverse of dApps, NFTs, and more—on one seamless platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/Netlify.png" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Audiowide&family=Gudea:ital,wght@0,400;0,700;1,400&family=Khand:wght@300;400;500;600;700&family=PT+Sans+Caption:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-black text-white" suppressHydrationWarning>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
