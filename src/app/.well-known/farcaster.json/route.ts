declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

function withValidProperties(properties: Record<string, undefined | string | string[] | boolean>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => {
      if (typeof value === 'boolean') return true;
      return Array.isArray(value) ? value.length > 0 : !!value;
    })
  );
}

export async function GET() {
  const URL = "https://vhibes.vercel.app";
  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: '1',
      name: 'vhibes',
      subtitle: 'AI Roasts and Challenges',
      description: 'AI roasts, icebreakers, and viral challenges - enhance your social interaction and engagement within the Farcaster ecosystem',
      screenshotUrls: [],
      iconUrl: 'https://vhibes.vercel.app/og.png',
      splashImageUrl: 'https://vhibes.vercel.app/vhibes-logo.png',
      splashBackgroundColor: '#C63A35',
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: 'social',
      tags: ['vhibes', 'roasts', 'icebreakers', 'challenges', 'social'],
      heroImageUrl: 'https://vhibes.vercel.app/og.png',
      tagline: 'AI Roasts & Challenges',
      ogTitle: 'vhibes',
      ogDescription: 'The Future of Social on Farcaster - AI roasts, icebreakers, and viral challenges',
      ogImageUrl: 'https://vhibes.vercel.app/og.png',
      // use only while testing
      noindex: true,
    }),
    baseBuilder: {
      allowedAddresses: [
        '0x9A780EEbde134AA7c58A0b86C2Ce7A3dC66b5F5b',
      ],
    },  
  });
}
