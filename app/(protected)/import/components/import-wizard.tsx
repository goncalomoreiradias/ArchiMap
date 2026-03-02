"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Steps } from "./steps" // We'll create a simple steps indicator
import { StepUpload } from "./step-upload"
import { StepPreview } from "./step-preview"
import { StepResult } from "./step-result"
import { analyzeImport, ImportAnalysisResult } from "@/app/actions/import-analysis"
import { executeImport } from "@/app/actions/import-execute"

export type ImportState = {
    step: 'upload' | 'preview' | 'result'
    analysis: ImportAnalysisResult | null
    file: File | null
    result: { success: boolean; count?: any; error?: string } | null
}

export function ImportWizard() {
    const [state, setState] = useState<ImportState>({
        step: 'upload',
        analysis: null,
        file: null,
        result: null
    })
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)

    // Helper to strip comments from JSON (allowing // and /* */)
    const parseJSON = (text: string) => {
        const cleanText = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        return JSON.parse(cleanText);
    }

    const handleFileUpload = async (file: File) => {
        setIsAnalyzing(true)
        try {
            const text = await file.text()
            const json = parseJSON(text)

            // Validate basic structure
            if (!json.components && !json.relationships) {
                throw new Error("Invalid format: Missing 'components' or 'relationships' keys")
            }

            const analysis = await analyzeImport({
                components: json.components || [],
                relationships: json.relationships || []
            })

            setState(prev => ({
                ...prev,
                file,
                analysis,
                step: 'preview'
            }))
        } catch (error: any) {
            alert("Analysis failed: " + error.message)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleConfirmImport = async () => {
        if (!state.analysis || !state.file) return

        setIsExecuting(true)
        try {
            const text = await state.file.text()
            const json = parseJSON(text)

            const result = await executeImport({
                components: json.components || [],
                relationships: json.relationships || []
            })

            setState(prev => ({
                ...prev,
                result,
                step: 'result'
            }))
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                result: { success: false, error: error.message },
                step: 'result'
            }))
        } finally {
            setIsExecuting(false)
        }
    }

    const handleReset = () => {
        setState({
            step: 'upload',
            analysis: null,
            file: null,
            result: null
        })
    }

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Import Wizard</h1>
                <p className="text-slate-500">
                    Upload your architecture data to analyze impact before applying changes.
                </p>
            </div>

            <Steps currentStep={state.step} />

            <div className="mt-8">
                {state.step === 'upload' && (
                    <StepUpload onUpload={handleFileUpload} isAnalyzing={isAnalyzing} />
                )}

                {state.step === 'preview' && state.analysis && (
                    <StepPreview
                        analysis={state.analysis}
                        onConfirm={handleConfirmImport}
                        onCancel={handleReset}
                        isExecuting={isExecuting}
                    />
                )}

                {state.step === 'result' && state.result && (
                    <StepResult result={state.result} onReset={handleReset} />
                )}
            </div>
        </div>
    )
}
