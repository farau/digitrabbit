"use client";
import { useState } from "react";
import HomeIntro from "./components/HomeIntro"; // adapte le chemin selon ton arborescence
import MainPage from "./components/MainPage"; // composant qui contient ta vraie page principale
import { useTheme } from "@/context";

export default function Page() {
  const { hasEntered, setHasEntered } = useTheme()

  return hasEntered ? <MainPage /> : <HomeIntro onEnter={() => setHasEntered(true)} />;
}
