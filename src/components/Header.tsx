"use client";

import { useAccount } from "wagmi";
import ConnectButton from "./ConnectButton";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const { address, isConnected } = useAccount();

  // Admin addresses - add your admin wallet addresses here
  const adminAddresses = [
    "0x1234567890123456789012345678901234567890", // Replace with actual admin addresses
    // Add more admin addresses as needed
  ];

  const isAdmin = isConnected && address && adminAddresses.includes(address.toLowerCase());

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-vibecaster-lavender/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                src="/vibecaster-logo.png"
                alt="vhibes Logo"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Only Admin */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAdmin && (
              <a href="/admin" className="text-vibecaster-pink-light hover:text-vibecaster-lavender transition-colors">
                Admin
              </a>
            )}
            </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}

