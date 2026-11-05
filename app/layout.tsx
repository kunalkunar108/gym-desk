import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymDesk | Gym Management",
  description: "Simple, reliable gym management for your team.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
