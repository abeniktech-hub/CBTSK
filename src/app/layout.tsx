import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbts-kumba.example"),
  title: { default: "Cameroon Baptist Theological Seminary | Kumba Campus", template: "%s | CBTS Kumba Campus" },
  description: "Discover theological study and campus life at Cameroon Baptist Theological Seminary, Kumba Campus, a branch of the Ndu Campus.",
  openGraph: {
    title: "Cameroon Baptist Theological Seminary | Kumba Campus",
    description: "Learn deeply and prepare for a life of faithful service at the Kumba Campus, a branch of the seminary at Ndu.",
    type: "website",
    locale: "en_CM",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
