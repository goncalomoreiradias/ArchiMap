"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Home, LayoutList, RefreshCcw } from "lucide-react"
import Link from "next/link"

interface StepResultProps {
    result: { success: boolean; count?: any; error?: string }
    onReset: () => void
}

export function StepResult({ result, onReset }: StepResultProps) {
    if (result.success) {
        return (
            <div className="bg-white p-12 rounded-xl border text-center shadow-sm">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Import Successful!</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Your architecture catalog has been updated.
                    Added {result.count?.components} components and {result.count?.relationships} relationships.
                </p>

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={onReset}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Import More
                    </Button>
                    <Link href="/components">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <LayoutList className="mr-2 h-4 w-4" /> View Catalog
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-12 rounded-xl border text-center shadow-sm border-red-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <XCircle size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Import Failed</h2>
            <p className="text-red-600 mb-8 max-w-md mx-auto bg-red-50 p-4 rounded-lg">
                {result.error || "An unexpected error occurred."}
            </p>

            <div className="flex justify-center gap-4">
                <Button onClick={onReset}>
                    Try Again
                </Button>
            </div>
        </div>
    )
}
