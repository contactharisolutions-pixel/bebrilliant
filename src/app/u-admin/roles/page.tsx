'use client'

import { useState, useEffect } from 'react'

interface Role { id: string; name: string }
interface Permission { id: string; module: string; action: string; key: string }

export default function RoleManagementPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchRBAC = async () => {
            try {
                const res = await fetch('/api/admin/roles/rbac')
                if (!res.ok) throw new Error('Failed to load RBAC engine')

                const data = await res.json()
                setRoles(data.roles || [])
                setPermissions(data.permissions || [])

                // Map the active configurations [role_id]_[permission_id]
                const matrix: Record<string, boolean> = {}
                data.rolePerms?.forEach((rp: any) => {
                    matrix[`${rp.role_id}_${rp.permission_id}`] = true
                })
                setRolePerms(matrix)

            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchRBAC()
    }, [])

    const togglePermission = async (roleId: string, permId: string, currentStatus: boolean) => {
        // Optimistic UI update
        const matrixKey = `${roleId}_${permId}`
        setRolePerms(prev => ({ ...prev, [matrixKey]: !currentStatus }))

        try {
            const res = await fetch('/api/admin/roles/rbac', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleId,
                    permissionId: permId,
                    isGranted: !currentStatus
                })
            })
            if (!res.ok) throw new Error('Failed to save permission')
        } catch (err) {
            console.error(err)
            // Revert on failure
            setRolePerms(prev => ({ ...prev, [matrixKey]: currentStatus }))
            alert('Failed to update permission. Please try again.')
        }
    }

    if (isLoading) return <div className="p-8 text-center text-[#9CA3C7]">Initializing RBAC Engine...</div>
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>

    return (
        <div className="min-h-screen bg-[#0A0B14] text-[#F0F2FF] p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-[#672AEA] to-[#1FAC63] text-transparent bg-clip-text">
                        Roles & Permissions Grid
                    </h1>
                    <p className="text-[#9CA3C7]">Configure granular role-based access control matching your operational domain rules.</p>
                </div>

                <div className="bg-[#12131F] border border-[#2E3150] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1A1B2E] border-b border-[#2E3150]">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#9CA3C7]">Module / Key</th>
                                    {roles.map(r => (
                                        <th key={r.id} className="p-4 text-sm font-semibold text-center uppercase tracking-wider">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border border-opacity-30 
                                                ${r.name === 'tenant_admin' ? 'bg-purple-900 text-purple-300 border-purple-500' :
                                                    r.name === 'teacher' ? 'bg-emerald-900 text-emerald-300 border-emerald-500' :
                                                        'bg-blue-900 text-blue-300 border-blue-500'}`}>
                                                {r.name.replace('_', ' ')}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2E3150]">
                                {permissions.map(p => (
                                    <tr key={p.id} className="hover:bg-[#1A1B2E] transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-[0.95rem]">{p.key}</div>
                                            <div className="text-xs text-[#5C6080] capitalize">{p.module} &rarr; {p.action}</div>
                                        </td>
                                        {roles.map(r => {
                                            const matrixKey = `${r.id}_${p.id}`
                                            const isChecked = !!rolePerms[matrixKey]

                                            // Special logic: Student/Parent typically aren't assigned creation access, but visually they can be toggled by the admin if needed.
                                            // Tenant admins can toggle within their tenant. Owners override globally.
                                            return (
                                                <td key={r.id} className="p-4 text-center">
                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(r.id, p.id, isChecked)}
                                                        />
                                                        <div className={`w-11 h-6 bg-[#2E3150] peer-focus:outline-none rounded-full peer 
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                                            after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                                                            after:transition-all ${isChecked ? 'bg-gradient-to-r from-[#672AEA] to-[#1FAC63]' : ''}`}>
                                                        </div>
                                                    </label>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
