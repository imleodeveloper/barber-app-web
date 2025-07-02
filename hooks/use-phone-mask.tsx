"use client";

import type React from "react";

import { useState, useCallback } from "react";

export function usePhoneMask() {
  const [value, setValue] = useState("");
  const [rawValue, setRawValue] = useState("");

  const formatPhone = useCallback((phone: string) => {
    // Remove all non-numeric characters
    const numbers = phone.replace(/\D/g, "");

    // Apply Brazilian phone mask
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7
      )}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numbers = inputValue.replace(/\D/g, "");

      if (numbers.length <= 11) {
        setRawValue(numbers);
        setValue(formatPhone(numbers));
      }
    },
    [formatPhone]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e);
    },
    [onChange]
  );

  const getUnmaskedValue = useCallback(() => {
    return rawValue;
  }, [rawValue]);

  const isValid = useCallback(() => {
    return rawValue.length >= 10;
  }, [rawValue]);

  return {
    value,
    rawValue,
    onChange,
    handleChange,
    setValue: (newValue: string) => {
      const numbers = newValue.replace(/\D/g, "");
      setRawValue(numbers);
      setValue(formatPhone(numbers));
    },
    formatPhone,
    getUnmaskedValue,
    isValid,
  };
}
