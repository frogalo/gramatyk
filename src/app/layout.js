import "./globals.css";

export const metadata = {
    title: "Gramatyk — morfologia języka polskiego",
    description: "Narzędzie do analizy morfologicznej słów i zdań w języku polskim.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="pl">
        <head>
            <title>Gramatyk — morfologia języka polskiego</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..800;1,6..72,300..800&family=Inter:wght@300;400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                rel="stylesheet"
            />
        </head>
        <body>{children}</body>
        </html>
    );
}
