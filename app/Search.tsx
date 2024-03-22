"use client";

import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

export default function Search() {
  const [value, setValue] = useState("");

  const router = useRouter();

  return (
    <input
      type="text"
      placeholder="Address"
      className="w-full p-2 rounded-full dark:bg-zinc-900 dark:border-zinc-800 px-4 dark:text-zinc-600"
      onChange={(e) => setValue(e.target.value)}
      value={value}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          router.push(`/${value}`);
        }
      }}
    />
  );
}
