"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          <Link
            href="https://www.viercatech.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <Image
              src="/VierCaTech.webp"
              alt="Desenvolvimento de Sites e Sistemas"
              title="Developed By VierCa Tech"
              width={32}
              height={32}
            />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              Developed by VierCa Tech
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
