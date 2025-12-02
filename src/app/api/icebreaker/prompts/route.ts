import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import IcebreakerContractArtifact from '@/abis/IcebreakerContract.json';

const ICEBREAKER_CONTRACT_ADDRESS = "0x72b92D55195c05E43A7E752839d6eCD23104ca8a";

const client = createPublicClient({
  chain: base,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const total = searchParams.get('total');

    if (!total || parseInt(total) === 0) {
      return NextResponse.json([]);
    }

    const prompts = [];
    const totalPrompts = parseInt(total);

    for (let i = 1; i <= totalPrompts; i++) {
      try {
        const prompt = await client.readContract({
          address: ICEBREAKER_CONTRACT_ADDRESS as `0x${string}`,
          abi: IcebreakerContractArtifact.abi,
          functionName: 'getPrompt',
          args: [BigInt(i)],
        });

        if (prompt && prompt.exists) {
          prompts.push({
            creator: prompt.creator,
            text: prompt.text,
            category: prompt.category,
            timestamp: prompt.timestamp,
            exists: prompt.exists,
          });
        }
      } catch (error) {
        console.error(`Error fetching prompt ${i}:`, error);
        // Continue with other prompts even if one fails
      }
    }

    // Sort prompts by timestamp (newest first)
    prompts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

