"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePhoneMask } from "@/hooks/use-phone-mask";

export function QuickSearch() {
  const router = useRouter();
  const phoneInput = usePhoneMask();
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneInput.isValid()) {
      alert("Por favor, digite um telefone válido.");
      return;
    }

    setLoading(true);

    try {
      // Store phone in session storage for the appointments page
      sessionStorage.setItem("searchPhone", phoneInput.getUnmaskedValue());
      router.push("/meus-agendamentos");
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      alert("Erro ao buscar agendamentos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          Busca Rápida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Input
              type="tel"
              value={phoneInput.value}
              onChange={phoneInput.handleChange}
              placeholder="(11) 99999-9999"
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Digite seu telefone para ver seus agendamentos
            </p>
          </div>
          <Button
            type="submit"
            disabled={loading || !phoneInput.isValid()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Buscando...
              </div>
            ) : (
              <div className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Buscar Agendamentos
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
