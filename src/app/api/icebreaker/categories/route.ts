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

    const categories = [];
    const totalCategories = parseInt(total);

    for (let i = 1; i <= totalCategories; i++) {
      try {
        const category = await client.readContract({
          address: ICEBREAKER_CONTRACT_ADDRESS as `0x${string}`,
          abi: IcebreakerContractArtifact.abi,
          functionName: 'getCategory',
          args: [BigInt(i)],
        }) as any;

        if (category && category.exists) {
          categories.push({
            name: category.name,
            description: category.description,
            exists: category.exists,
          });
        }
      } catch (error) {
        console.error(`Error fetching category ${i}:`, error);
        // Continue with other categories even if one fails
      }
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

