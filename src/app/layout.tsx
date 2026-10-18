import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "FinanControl — Controle suas finanças",
  description:
    "Gerencie suas finanças pessoais de forma inteligente. Acompanhe receitas, despesas e alcance suas metas financeiras.",
  openGraph: {
    title: "FinanControl — Controle suas finanças",
    description:
      "Gerencie suas finanças pessoais de forma inteligente. Acompanhe receitas, despesas e alcance suas metas financeiras.",
    type: "website",
    locale: "pt_BR",
    siteName: "FinanControl",
    images: [
      {
        url: "/webimage.jpg",
        width: 1376,
        height: 768,
        type: "image/jpeg",
        alt: "FinanControl — controle de gastos e rendimentos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanControl — Controle suas finanças",
    description:
      "Gerencie suas finanças pessoais de forma inteligente. Acompanhe receitas, despesas e alcance suas metas financeiras.",
    images: ["/webimage.jpg"],
  },
  icons: {
    icon: [{ url: "/favicon.jpg", type: "image/jpeg" }],
    apple: [{ url: "/favicon.jpg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Tema antes do primeiro paint (evita flash claro→escuro). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("financontrol:theme");var s=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||(t!=="light"&&s))document.documentElement.classList.add("dark");}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

