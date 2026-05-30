'use client'

import React, { createContext, useContext, useState } from 'react'

export interface IdentityData {
    id: string
    email: string
    role: string
    fullName: string
    tenant_id: string | null
    tenant: {
        name: string
        logo_url: string | null
        tenant_type: string
    } | null
    is_first_login: boolean
}

interface IdentityContextValue {
    identity: IdentityData | null
    setIdentity: (data: IdentityData) => void
}

const IdentityContext = createContext<IdentityContextValue>({
    identity: null,
    setIdentity: () => {},
})

export function IdentityProvider({ children }: { children: React.ReactNode }) {
    const [identity, setIdentity] = useState<IdentityData | null>(null)
    return (
        <IdentityContext.Provider value={{ identity, setIdentity }}>
            {children}
        </IdentityContext.Provider>
    )
}

export function useIdentity() {
    return useContext(IdentityContext)
}
