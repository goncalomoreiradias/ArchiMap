"use client"

import { createContext, useContext } from "react"

interface UserContextType {
    role: string | undefined
}

const UserContext = createContext<UserContextType>({ role: undefined })

export function UserProvider({ children, role }: { children: React.ReactNode, role?: string }) {
    return (
        <UserContext.Provider value={{ role }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)
}
