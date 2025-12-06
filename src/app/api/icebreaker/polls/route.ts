import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import IcebreakerContractArtifact from '@/abis/IcebreakerContract.json';
import { ICEBREAKER_CONTRACT_ADDRESS } from '@/lib/constants';

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

    const polls = [];
    const totalPolls = parseInt(total);

    for (let i = 1; i <= totalPolls; i++) {
      try {
        const poll = await client.readContract({
          address: ICEBREAKER_CONTRACT_ADDRESS as `0x${string}`,
          abi: IcebreakerContractArtifact.abi,
          functionName: 'getPoll',
          args: [BigInt(i)],
        });

        if (poll && poll[0] !== '0x0000000000000000000000000000000000000000') {
          polls.push({
            creator: poll[0],
            question: poll[1],
            options: poll[2],
            voteCounts: poll[3],
            totalVotes: poll[4],
          });
        }
      } catch (error) {
        console.error(`Error fetching poll ${i}:`, error);
        // Continue with other polls even if one fails
      }
    }

    return NextResponse.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

