import "./globals.css";

export const metadata = {
  title: "Coda — Opportunity OS",
  description: "AI-native opportunity tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
