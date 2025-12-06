/**
 * Share utility functions for vhibes platform
 */

export interface ShareOptions {
  text?: string;
  url?: string;
  title?: string;
}

/**
 * Share to Farcaster/Warpcast
 */
export const shareToFarcaster = (options: ShareOptions = {}) => {
  const defaultText = "Check out vhibes - The Future of Social on Farcaster! 🚀✨";
  const shareText = options.text || defaultText;
  const url = options.url || "https://vhibes.vercel.app";
  const fullText = `${shareText}\n\n${url}`;
  
import { APP_URLS } from "./constants";
  const farcasterUrl = `${APP_URLS.WARPCAST_COMPOSE}?text=${encodeURIComponent(fullText)}`;
  window.open(farcasterUrl, '_blank');
};

/**
 * Share to Twitter/X
 */
export const shareToTwitter = (options: ShareOptions = {}) => {
  const defaultText = "Check out vhibes - The Future of Social on Farcaster! 🚀✨";
  const shareText = options.text || defaultText;
  const url = options.url || "https://vhibes.vercel.app";
  const fullText = `${shareText}\n\n${url}`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
  window.open(twitterUrl, '_blank');
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Share using Web Share API (mobile devices)
 */
export const shareNative = async (options: ShareOptions = {}): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    const defaultText = "Check out vhibes - The Future of Social on Farcaster! 🚀✨";
    const shareText = options.text || defaultText;
    const url = options.url || "https://vhibes.vercel.app";
    
    await navigator.share({
      title: options.title || 'vhibes',
      text: shareText,
      url: url,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name !== 'AbortError') {
      console.error('Error sharing:', error);
    }
    return false;
  }
};

/**
 * Generic share function that tries native share first, then falls back to options
 */
export const share = async (options: ShareOptions = {}) => {
  // Try native share first (mobile)
  const nativeShared = await shareNative(options);
  if (nativeShared) {
    return;
  }

  // Fallback: show share options or copy to clipboard
  const defaultText = "Check out vhibes - The Future of Social on Farcaster! 🚀✨";
  const shareText = options.text || defaultText;
  const url = options.url || "https://vhibes.vercel.app";
  const fullText = `${shareText}\n\n${url}`;
  
  // Copy to clipboard as fallback
  const copied = await copyToClipboard(fullText);
  if (copied) {
    alert('Link copied to clipboard!');
  }
};

