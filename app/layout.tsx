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
    <html
      lang="en"
      className="dark:bg-black dark:text-white bg-white text-black"
    >
      <body className={inter.className}>
        <div className="flex w-full justify-center">
          <main className="flex justify-center flex-col gap-4 mt-4 w-full max-w-2xl mx-8">
            <div className="flex w-full items-center justify-between">
              <h1 className="tracking-tighter font-bold text-2xl">
                ⚡ flash tracker
              </h1>

              <a
                href="https://beast.flash.trade?referral=Beast_1373"
                target="blank"
                className="text-black p-2 rounded text-sm font-medium"
                style={{
                  background:
                    "linear-gradient(94.61deg,#fffaf3 -4.98%,#fff200 32.6%,#01e1e0 114.17%)",
                }}
              >
                Save 5% on Fees
              </a>
            </div>
            <Search />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
