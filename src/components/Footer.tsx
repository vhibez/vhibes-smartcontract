"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-vibecaster-dark to-vibecaster-purple-dark border-t border-vibecaster-lavender/20 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-row items-center justify-between">
          {/* vhibes Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                src="/vhibes-logo.png"
                alt="vhibes Logo"
                width={100}
                height={100}
                className="rounded-lg"
              />
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://twitter.com/vhibes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vibecaster-pink-light hover:text-vibecaster-lavender transition-colors"
            >
              <Image
                src="/twitter-x.svg"
                alt="X (Twitter)"
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </a>
            <a
              href="https://warpcast.com/vhibes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vibecaster-pink-light hover:text-vibecaster-lavender transition-colors"
            >
              <Image
                src="/farcaster.svg"
                alt="Farcaster"
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-vibecaster-lavender/10 text-center">
          <p className="text-xs text-vibecaster-pink-light">
            © 2025 <Link href="/admin" className="hover:text-vibecaster-lavender transition-colors">vhibes</Link>. Built on Base. Powered by Farcaster.
          </p>
        </div>
      </div>
    </footer>
  );
}

