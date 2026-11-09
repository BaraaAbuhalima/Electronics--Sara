import type { Metadata } from "next";
import localFont from "next/font/local";
import store from "../../data/store.json";
import "./globals.css";
const dmSans = localFont({
  src: "../../public/fonts/DM-Sans.ttf",
  variable: "--font-english",
  display: "swap",
});
const tajawal = localFont({
  src: "../../public/fonts/Tajawal-Regular.ttf",
  variable: "--font-arabic",
  display: "swap",
  weight: "400",
});
export const metadata: Metadata = {
  title: `${store.name.en} — ${store.tagline.en}`,
  description: store.description.en,
  icons: { icon: store.logo },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${tajawal.variable}`}>
        {children}
      </body>
    </html>
  );
}
