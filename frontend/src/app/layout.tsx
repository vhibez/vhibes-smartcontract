import { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { MiniKitContextProvider } from "@/providers/MiniKitProvider";
import AppKitProvider from "@/contexts/AppKitProvider";
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const URL = "https://vhibes.vercel.app";
  return {
    title: 'vhibes',
    description: 'The Future of Social on Farcaster - AI roasts, icebreakers, and viral challenges',
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: 'https://vhibes.vercel.app/og.png',
        button: {
          title: 'Launch vhibes',
          action: {
            type: 'launch_frame',
            name: 'vhibes',
            url: URL,
            splashImageUrl: 'https://vhibes.vercel.app/vhibes-logo.png',
            splashBackgroundColor: '#C63A35',
          },
        },
      }),
    },
};
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body className="vibecaster-bg">
        <AppKitProvider cookies={cookies}>
          <MiniKitContextProvider>
            <Providers>{children}</Providers>
          </MiniKitContextProvider>
        </AppKitProvider>
      </body>
    </html>
  );
}
