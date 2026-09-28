import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: BRAND.fullName,
  description: `${BRAND.company} — secure MoMo payment monitoring desk`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className={`${sans.className} flex min-h-full flex-col bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
