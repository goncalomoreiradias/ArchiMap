"use client"

import { Check } from "lucide-react"

export function Steps({ currentStep }: { currentStep: 'upload' | 'preview' | 'result' }) {
    const steps = [
        { id: 'upload', name: 'Upload' },
        { id: 'preview', name: 'Preview & Analyze' },
        { id: 'result', name: 'Result' }
    ]

    const getCurrentIndex = () => steps.findIndex(s => s.id === currentStep)
    const currentIndex = getCurrentIndex()

    return (
        <div className="flex items-center justify-center w-full">
            {steps.map((step, idx) => {
                const isCompleted = idx < currentIndex
                const isCurrent = idx === currentIndex

                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-2 relative">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
                                ${isCompleted ? 'bg-green-600 border-green-600 text-white' :
                                    isCurrent ? 'bg-white border-indigo-600 text-indigo-600' :
                                        'bg-white border-slate-200 text-slate-300'}
                            `}>
                                {isCompleted ? <Check size={16} /> : idx + 1}
                            </div>
                            <span className={`
                                absolute -bottom-8 text-xs font-medium whitespace-nowrap
                                ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}
                            `}>
                                {step.name}
                            </span>
                        </div>

                        {idx < steps.length - 1 && (
                            <div className={`
                                w-24 h-0.5 mx-2 transition-colors
                                ${idx < currentIndex ? 'bg-green-600' : 'bg-slate-200'}
                            `} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
