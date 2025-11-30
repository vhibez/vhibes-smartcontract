import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
  pinataGateway: "your-gateway.mypinata.cloud", // Optional
});

export async function uploadMoodToIPFS(
  image: Blob,
  moodType: string,
  title: string,
  caption: string,
  timestamp: number
) {
  try {
    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error("Pinata JWT missing - please set NEXT_PUBLIC_PINATA_JWT");
    }

    console.log("Uploading image to Pinata...");

    // Upload image using SDK
    const imageFile = new File([image], `${moodType}-${timestamp}.png`, {
      type: "image/png",
    });

    const imageUpload = await pinata.upload.public.file(imageFile);
    console.log("Image uploaded:", imageUpload);

    const imageUri = `ipfs://${imageUpload.cid}`;

    // Create metadata
    const metadata = {
      name: title,
      description: caption,
      image: imageUri,
      attributes: [
        { trait_type: "Mood", value: moodType },
        { trait_type: "Title", value: title },
        { trait_type: "Timestamp", value: timestamp.toString() },
      ],
    };

    console.log("Uploading metadata to Pinata...");

    // Upload metadata using SDK
    const metadataUpload = await pinata.upload.public.json(metadata);
    console.log("Metadata uploaded:", metadataUpload);

    return `ipfs://${metadataUpload.cid}`;
  } catch (error) {
    console.error("Pinata upload failed:", error);
    throw error;
  }
}

export async function uploadRoastToIPFS(
  image: File,
  roastText: string,
  timestamp: number
) {
  try {
    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error("Pinata JWT missing - please set NEXT_PUBLIC_PINATA_JWT");
    }

    console.log("Uploading roast image to Pinata...");

    // Upload original image
    const imageUpload = await pinata.upload.public.file(image);
    console.log("Roast image uploaded:", imageUpload);

    const imageUri = `ipfs://${imageUpload.cid}`;

    // Create roast metadata
    const metadata = {
      name: "vhibes Roast",
      description: roastText,
      image: imageUri,
      external_url: "https://vhibes.vercel.app",
      attributes: [
        { trait_type: "Type", value: "Roast" },
        { trait_type: "Generated", value: new Date(timestamp).toISOString() },
        { trait_type: "Platform", value: "vhibes" },
      ],
    };

    console.log("Uploading roast metadata to Pinata...");

    // Upload metadata
    const metadataUpload = await pinata.upload.public.json(metadata);
    console.log("Roast metadata uploaded:", metadataUpload);

    return {
      imageHash: `ipfs://${imageUpload.cid}`,
      metadataHash: `ipfs://${metadataUpload.cid}`
    };
  } catch (error) {
    console.error("Roast IPFS upload failed:", error);
    throw error;
  }
}

export async function uploadChainToIPFS(
  image: File,
  promptText: string
) {
  try {
    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error("Pinata JWT missing - please set NEXT_PUBLIC_PINATA_JWT");
    }

    console.log("Uploading chain reaction image to Pinata...");

    // Upload image
    const imageUpload = await pinata.upload.public.file(image);
    console.log("Chain image uploaded:", imageUpload);

    const imageUri = `ipfs://${imageUpload.cid}`;

    // Create chain metadata
    const metadata = {
      name: "vhibes Chain Reaction",
      description: promptText,
      image: imageUri,
      external_url: "https://vhibes.vercel.app",
      attributes: [
        { trait_type: "Type", value: "Chain Reaction" },
        { trait_type: "Generated", value: new Date().toISOString() },
        { trait_type: "Platform", value: "vhibes" },
      ],
    };

    console.log("Uploading chain metadata to Pinata...");

    // Upload metadata
    const metadataUpload = await pinata.upload.public.json(metadata);
    console.log("Chain metadata uploaded:", metadataUpload);

    return {
      imageHash: `ipfs://${imageUpload.cid}`,
      metadataHash: `ipfs://${metadataUpload.cid}`
    };
  } catch (error) {
    console.error("Chain IPFS upload failed:", error);
    throw error;
  }
}

