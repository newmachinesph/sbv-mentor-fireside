import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SBV Mentor | Expert Mentors On Demand",
  description:
    "Book sessions with expert mentors in tech, product, business, growth, design, and fundraising. The right expert at the right time for your startup journey.",
  keywords: [
    "mentor",
    "startup mentorship",
    "Philippines",
    "Z-One",
    "SBV",
    "expert booking",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
