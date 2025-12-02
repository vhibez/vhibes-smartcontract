import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import ChainReactionContractArtifact from '@/abis/ChainReactionContract.json';

const CHAIN_REACTION_CONTRACT_ADDRESS = "0xE09596824F17c41eD18cCe7d7035908526f2BF14";

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

    const challenges = [];
    const totalChallenges = parseInt(total);

    for (let i = 1; i <= totalChallenges; i++) {
      try {
        const challenge = await client.readContract({
          address: CHAIN_REACTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: ChainReactionContractArtifact.abi,
          functionName: 'getChallenge',
          args: [BigInt(i)],
        });

        if (challenge && challenge.exists) {
          challenges.push({
            id: i,
            data: {
              initiator: challenge.initiator,
              prompt: challenge.prompt,
              promptImageIpfsHash: challenge.promptImageIpfsHash,
              timestamp: challenge.timestamp,
              responseIds: challenge.responseIds,
              exists: challenge.exists,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching challenge ${i}:`, error);
        // Continue with other challenges even if one fails
      }
    }

    // Sort by timestamp (newest first)
    challenges.sort((a, b) => Number(b.data.timestamp - a.data.timestamp));

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

