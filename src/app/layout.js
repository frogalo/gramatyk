// app/layout.js
export const metadata = {
    title: "Gramatyk",
    description: "Your description here",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head ><title>Gramatyk</title></head>
        <body>{children}</body>
        </html>
    );
}
