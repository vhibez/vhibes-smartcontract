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
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 md:py-3">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-105">
              <Image
                src="/vhibes-logo.png"
                alt="vhibes Logo"
                width={100}
                height={100}
                className="rounded-lg"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation - Only Admin */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAdmin && (
              <a 
                href="/admin" 
                className="text-vhibes-light hover:text-vhibes-primary transition-colors duration-300 font-medium"
              >
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

