"use client"

import { useState } from "react"
import {
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Info,
  Smartphone,
  Users,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SettingsData } from "@/lib/data/models"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "ai", label: "AI Behaviour", icon: BrainCircuit },
  { id: "team", label: "Team", icon: Users },
  { id: "channel", label: "Channel", icon: Smartphone },
] as const

export function AitSettingsContent({ data }: { data: SettingsData }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("business")

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Current organization and channel configuration</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-card border border-border/60 rounded-xl p-1">
        {TABS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2 flex-1 justify-center px-3 py-2 text-xs rounded-lg font-medium transition-all",
                tab === item.id
                  ? "bg-[#2DE2B1] text-[#071A1B]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === "business" && (
        <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-[#2DE2B1]" />
            <h2 className="text-sm font-semibold text-foreground">Business Profile</h2>
          </div>
          <ReadOnlyField label="Business name" value={data.organization.name} />
          <ReadOnlyField label="Workspace slug" value={data.organization.slug} mono />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Default language" value={data.organization.defaultLanguage.toUpperCase()} icon={Globe} />
            <ReadOnlyField label="Timezone" value={data.organization.timezone} icon={Clock} />
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/60">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Settings are read-only in this phase. Your role is{" "}
              <strong className="text-foreground capitalize">{data.role}</strong>.
              {data.organizationCount > 1 && (
                <>
                  {" "}AIT selected this workspace deterministically from {data.organizationCount} memberships until workspace switching is implemented.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <ComingSoon
          icon={BrainCircuit}
          title="AI behaviour is not configured yet"
          description="The production schema has no AI settings or execution tables in this phase. No placeholder settings are being saved."
        />
      )}

      {tab === "team" && (
        <ComingSoon
          icon={Users}
          title="Team management is not connected yet"
          description={`Your current membership role is ${data.role}. Invitations and team editing are outside this integration phase.`}
        />
      )}

      {tab === "channel" && (
        <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-[#2DE2B1]" />
            <h2 className="text-sm font-semibold text-foreground">Channels</h2>
          </div>

          {data.channels.length === 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/60">
              <XCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">WhatsApp disconnected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No channel connection exists for this organization.
                </p>
              </div>
            </div>
          ) : (
            data.channels.map((channel) => (
              <div key={channel.id} className="rounded-xl border border-border/60 overflow-hidden">
                <div className="flex items-start gap-3 p-4 bg-muted/20">
                  {channel.status === "connected" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2DE2B1] flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {channel.displayName ?? channel.channelType}
                      </p>
                      <Badge variant="outline" className="capitalize text-[10px] border-border/60">
                        {channel.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Provider: {channel.provider}</p>
                    {channel.connectedPhoneNumber && (
                      <p className="text-xs text-muted-foreground mt-0.5">{channel.connectedPhoneNumber}</p>
                    )}
                    {channel.lastError && (
                      <p className="text-xs text-[#FF6B6B] mt-1">{channel.lastError}</p>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                  {channel.metaConfigurationVisible ? (
                    <>
                      <p>Meta identifiers: {channel.metaIdentifiersConfigured ? "Configured" : "Not configured"}</p>
                      <p>Webhook subscription: {channel.webhookSubscriptionStatus ?? "Unavailable"}</p>
                    </>
                  ) : (
                    <p>Provider-specific identifiers are visible only to organization owners.</p>
                  )}
                </div>
              </div>
            ))
          )}

          <Button
            variant="outline"
            className="self-start border-border/60"
            disabled
            title="Meta connection flow is outside this task"
          >
            Connect WhatsApp Business
          </Button>
          <p className="text-xs text-muted-foreground">
            Connection behavior will be implemented in a later Meta integration task.
          </p>
        </div>
      )}
    </div>
  )
}

function ReadOnlyField({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: React.ElementType
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm bg-muted/30 border border-border/60 rounded-lg text-foreground",
          mono && "font-mono text-xs",
        )}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {value}
      </div>
    </div>
  )
}

function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[#2DE2B1]/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-[#2DE2B1]" />
      </div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">{description}</p>
    </div>
  )
}
