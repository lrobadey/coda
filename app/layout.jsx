import "./globals.css";

export const metadata = {
  title: "Coda — Opportunity OS",
  description: "AI-native opportunity tracker",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b1b24",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><div id="app-root">{children}</div></body>
    </html>
  );
}
