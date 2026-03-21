import "./globals.css";
import { Inter, Newsreader } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata = {
  title: "Gramatyk — morfologia języka polskiego",
  description: "Narzędzie do analizy morfologicznej słów i zdań w języku polskim.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${inter.variable} ${newsreader.variable}`}>
      <head>
        <title>Gramatyk — morfologia języka polskiego</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
