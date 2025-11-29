"use client";

import { useAccount } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import { APP_URLS } from "@/lib/constants";

export default function Footer() {
  const { address, isConnected } = useAccount();

  // Admin addresses - add your admin wallet addresses here
  const adminAddresses = [
    "0x1234567890123456789012345678901234567890", // Replace with actual admin addresses
    // Add more admin addresses as needed
  ];

  const isAdmin = isConnected && address && adminAddresses.includes(address.toLowerCase());

  return (
    <footer className="w-full mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
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

          {/* Navigation and Social Links */}
          <div className="flex items-center space-x-6">
            {/* Admin Link - Only visible to admins */}
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-vhibes-light hover:text-vhibes-primary transition-colors duration-300 font-medium"
              >
                Admin
              </Link>
            )}

            {/* Social Links */}
            <div className="flex items-center space-x-4">
            <a
              href="https://twitter.com/vhibes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vhibes-light hover:text-vhibes-primary transition-colors"
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
              href={APP_URLS.FARCASTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-vhibes-light hover:text-vhibes-primary transition-colors"
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
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 text-center">
          <p className="text-xs text-vhibes-light">
            © 2025 <Link href="/admin" className="hover:text-vhibes-primary transition-colors">vhibes</Link>. Built on Base. Powered by Farcaster.
          </p>
        </div>
      </div>
    </footer>
  );
}

