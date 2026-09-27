import type { Metadata } from "next";
import { AssistantConsole } from "@/components/features/assistant/AssistantConsole";

export const metadata: Metadata = { title: "Tester l’assistant" };

export default function AdminAssistantPage() {
  return <AssistantConsole mode={{ kind: "platform" }} />;
}
