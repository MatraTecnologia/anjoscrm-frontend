// Query keys centralizadas — evita strings soltas espalhadas pelo projeto.
// Todas as invalidações e lookups de cache passam por aqui.

export const keys = {
    auth: {
        session: () => ['session'] as const,
    },

    enterprises: {
        all: () => ['enterprises'] as const,
        verify: () => ['enterprises', 'verify'] as const,
        detail: (id: string) => ['enterprises', id] as const,
        members: (id: string) => ['enterprises', id, 'members'] as const,
        roles: (id: string) => ['enterprises', id, 'roles'] as const,
        invites: (id: string) => ['enterprises', id, 'invites'] as const,
    },

    leads: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'leads'] as const,
        detail: (id: string) => ['leads', id] as const,
    },

    tags: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'tags'] as const,
        detail: (id: string) => ['tags', id] as const,
    },

    pipelines: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'pipelines'] as const,
        groups: (enterpriseId: string) => ['enterprises', enterpriseId, 'pipelines', 'groups'] as const,
        detail: (id: string) => ['pipelines', id] as const,
        stages: (pipelineId: string) => ['pipelines', pipelineId, 'stages'] as const,
    },

    deals: {
        all: (pipelineId: string) => ['pipelines', pipelineId, 'deals'] as const,
        byStage: (stageId: string) => ['stages', stageId, 'deals'] as const,
        detail: (id: string) => ['deals', id] as const,
        products: (dealId: string) => ['deals', dealId, 'products'] as const,
    },

    connections: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'connections'] as const,
        detail: (id: string) => ['connections', id] as const,
    },

    chat: {
        messages: (connectionId: string, leadId: string) =>
            ['chat', connectionId, leadId] as const,
    },

    automations: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'automations'] as const,
        detail: (id: string) => ['automations', id] as const,
    },

    audit: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'audit'] as const,
    },

    products: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'products'] as const,
        detail: (id: string) => ['products', id] as const,
    },

    customFields: {
        all: (enterpriseId: string) => ['enterprises', enterpriseId, 'custom-fields'] as const,
        byEntity: (enterpriseId: string, entity: string) => ['enterprises', enterpriseId, 'custom-fields', entity] as const,
        leadValues: (leadId: string) => ['custom-fields', 'lead', leadId] as const,
        dealValues: (dealId: string) => ['custom-fields', 'deal', dealId] as const,
    },

    dashboard: {
        negocios: (enterpriseId: string, from: string, to: string) =>
            ['dashboard', enterpriseId, 'negocios', from, to] as const,
        messages: (enterpriseId: string, from: string, to: string) =>
            ['dashboard', enterpriseId, 'messages', from, to] as const,
    },
}
