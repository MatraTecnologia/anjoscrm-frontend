import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Kinar CRM",
  description: "Kinar CRM - Sistema de gestão de relacionamentos para empresas de consórcio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html
      lang="pt-br"
      className={cn("h-full antialiased font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <Providers><Toaster />{children}</Providers>
        </ThemeProvider>
      </body>
    </html>


  );
}
