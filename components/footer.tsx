"use client";

import { Moon, Sun, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import Link from "next/link";

export function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="https://www.viercatech.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Developed by VierCa Tech
            </span>
          </Link>

          <div className="flex items-center space-x-4"></div>
        </div>
      </div>
    </footer>
  );
}
