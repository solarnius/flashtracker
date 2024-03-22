import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Search from "./Search";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "flash tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className=" bg-black text-white">
      <body className={inter.className}>
        <div className="flex w-full justify-center">
          <main className="flex justify-center flex-col gap-4 mt-4 w-full max-w-2xl mx-8">
            <h1 className="tracking-tighter font-bold text-2xl">
              flash tracker
            </h1>
            <Search />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
