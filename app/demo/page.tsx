import type { Metadata } from "next"
import { DemoWorkspace } from "@/components/demo/demo-workspace"

export const metadata: Metadata = {
  title: "AIT Interactive Demo",
  description: "Explore a sample AIT workspace without connecting an account or WhatsApp.",
}

export default function DemoPage() {
  return <DemoWorkspace />
}
