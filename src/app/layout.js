import "../styles/globals.css";

export const metadata = {
  title: "Azhl أزهل — AI Customer Operations for UAE Businesses",
  description: "Azhl handles WhatsApp customer service, generates social media content, and re-engages past clients — in Arabic and English — for UAE businesses.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
