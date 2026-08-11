import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const montserrat = localFont({
  src: [
    {
      path: "./fonts/Montserrat-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "./fonts/Montserrat-Italic-VariableFont_wght.ttf",
      style: "italic",
    }
  ],
  variable: "--font-montserrat",
});

const schibstedGrotesk = localFont({
  src: [
    {
      path: "./fonts/SchibstedGrotesk-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "./fonts/SchibstedGrotesk-Italic-VariableFont_wght.ttf",
      style: "italic",
    }
  ],
  variable: "--font-schibsted",
});

export const metadata: Metadata = {
  title: "Juan Pablo Huston",
  description: "Photography Portfolio of Juan Pablo Huston",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${schibstedGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
