import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import ChainReactionContractArtifact from '@/abis/ChainReactionContract.json';
import { CHAIN_REACTION_CONTRACT_ADDRESS } from '@/lib/constants';

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

    const responses = [];
    const totalResponses = parseInt(total);

    for (let i = 1; i <= totalResponses; i++) {
      try {
        const response = await client.readContract({
          address: CHAIN_REACTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: ChainReactionContractArtifact.abi,
          functionName: 'getResponse',
          args: [BigInt(i)],
        });

        if (response && response.exists) {
          responses.push({
            id: i,
            data: {
              responder: response.responder,
              parentChallengeId: response.parentChallengeId,
              parentResponseId: response.parentResponseId,
              responseText: response.responseText,
              responseImageIpfsHash: response.responseImageIpfsHash,
              timestamp: response.timestamp,
              childResponseIds: response.childResponseIds,
              exists: response.exists,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching response ${i}:`, error);
        // Continue with other responses even if one fails
      }
    }

    // Sort by timestamp (newest first)
    responses.sort((a, b) => Number(b.data.timestamp - a.data.timestamp));

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

