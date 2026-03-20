"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ZapIcon } from "lucide-react"

import { AutomationSidebar } from "@/components/automation/automation-sidebar"
import { AutomationBuilder } from "@/components/automation/automation-builder"
import { api } from "@/lib/api"
import type { WorkflowAutomation } from "@/lib/automation-types"
import { useEnterprise } from "@/hooks/use-enterprise"

export default function AutomacoesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { enterprise } = useEnterprise()
  const enterpriseId = enterprise?.id ?? ""

  const [automations, setAutomations] = useState<WorkflowAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("id"))

  const selected = automations.find((a) => a.id === selectedId) ?? null

  const headers = enterpriseId ? { "X-Enterprise-Id": enterpriseId } : {}

  useEffect(() => {
    if (!enterpriseId) return
    fetchAutomations()
  }, [enterpriseId])

  async function fetchAutomations() {
    try {
      const res = await api.get("/automations", { headers })
      const list: WorkflowAutomation[] = res.data.data ?? []
      setAutomations(list)
      // Auto-seleciona a primeira se não houver seleção
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id)
      }
    } catch {
      toast.error("Erro ao carregar automações")
    } finally {
      setLoading(false)
    }
  }

  async function fetchAutomationFull(id: string): Promise<WorkflowAutomation | null> {
    try {
      const res = await api.get(`/automations/${id}`, { headers })
      return res.data
    } catch {
      toast.error("Erro ao carregar automação")
      return null
    }
  }

  async function handleSelect(id: string) {
    setSelectedId(id)
    // Se a automação já está na lista mas sem nodes (foi carregada só com metadata),
    // busca a versão completa
    const existing = automations.find((a) => a.id === id)
    if (!existing?.nodes || (existing.nodes as unknown[]).length === 0) {
      const full = await fetchAutomationFull(id)
      if (full) {
        setAutomations((prev) => prev.map((a) => (a.id === id ? full : a)))
      }
    }
    router.replace(`/automacoes?id=${id}`, { scroll: false })
  }

  async function handleCreate(name: string, category: string) {
    try {
      const res = await api.post("/automations", { name, category }, { headers })
      const created: WorkflowAutomation = res.data
      setAutomations((prev) => [created, ...prev])
      setSelectedId(created.id)
      router.replace(`/automacoes?id=${created.id}`, { scroll: false })
      toast.success("Automação criada")
    } catch {
      toast.error("Erro ao criar automação")
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await api.post(`/automations/${id}/duplicate`, {}, { headers })
      const cloned: WorkflowAutomation = res.data
      setAutomations((prev) => [cloned, ...prev])
      setSelectedId(cloned.id)
      toast.success("Automação duplicada")
    } catch {
      toast.error("Erro ao duplicar automação")
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/automations/${id}`, { headers })
      setAutomations((prev) => prev.filter((a) => a.id !== id))
      if (selectedId === id) {
        const remaining = automations.filter((a) => a.id !== id)
        const next = remaining[0]?.id ?? null
        setSelectedId(next)
        if (next) router.replace(`/automacoes?id=${next}`, { scroll: false })
        else router.replace("/automacoes", { scroll: false })
      }
      toast.success("Automação deletada")
    } catch {
      toast.error("Erro ao deletar automação")
    }
  }

  async function handleToggle(id: string) {
    try {
      const res = await api.patch(`/automations/${id}/toggle`, {}, { headers })
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: res.data.isActive } : a)),
      )
    } catch {
      toast.error("Erro ao alterar status")
    }
  }

  const handleUpdate = useCallback((updated: WorkflowAutomation) => {
    setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }, [])

  const handleBack = useCallback(() => {
    setSelectedId(null)
    router.replace("/automacoes", { scroll: false })
  }, [router])

  const handleDeleteFromBuilder = useCallback((id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id))
    setSelectedId(null)
  }, [])

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <AutomationSidebar
        automations={automations}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando automações...</p>
            </div>
          </div>
        ) : selected ? (
          <AutomationBuilder
            automation={selected}
            enterpriseId={enterpriseId}
            onUpdate={handleUpdate}
            onBack={handleBack}
            onDelete={handleDeleteFromBuilder}
          />
        ) : (
          <EmptyCanvas onNew={() => {/* open sidebar */}} />
        )}
      </div>
    </div>
  )
}

function EmptyCanvas({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-muted/20">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <ZapIcon size={28} className="text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Nenhuma automação selecionada</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Selecione uma automação na barra lateral ou crie uma nova para começar a construir seu fluxo.
      </p>
    </div>
  )
}
