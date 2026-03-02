"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileJson, Download, Loader2 } from "lucide-react"

interface StepUploadProps {
    onUpload: (file: File) => void
    isAnalyzing: boolean
}

export function StepUpload({ onUpload, isAnalyzing }: StepUploadProps) {
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = (file: File) => {
        // We now accept .json files with comments, handled by the wizard parser
        if (!file.name.endsWith('.json')) {
            alert("Please upload a .json file")
            return
        }
        onUpload(file)
    }

    const downloadTemplate = () => {
        // We use a string template to include comments.
        // The Import Wizard includes a parser to strip these comments before processing.
        const templateContent = `{
  // ==================================================================================
  // ARCHITECTURE IMPORT TEMPLATE
  // ==================================================================================
  // This file defines components and their relationships.
  // You can add multiple components and relationships in the respective arrays.
  
  "components": [
    {
      // [REQUIRED] Unique name of the component
      "name": "Finance System",
      
      // [REQUIRED] Component Type corresponding to the layer:
      // Business: "BusinessCapability", "BusinessProcess", "ValueStream"
      // BIAN: "ServiceDomain", "ServiceOperation", "BusinessObject"
      // Application: "Application", "ApplicationComponent", "Interface"
      // Data: "DataEntity", "API", "DataFlow"
      // Technology: "TechComponent", "InfrastructureService", "IntegrationPlatform"
      "type": "ApplicationComponent",
      
      // [REQUIRED] Layer: "Business", "BIAN", "Application", "Data", "Technology"
      "layer": "Application",
      
      // [OPTIONAL] Detailed description or notes
      "description": "Core finance ledger system handling GL, AP, and AR.",
      
      // [OPTIONAL] Lifecycle State: "Plan", "Build", "Run", "Retire"
      "lifecycle": "Run",
      
      // [OPTIONAL] Strategic Value: "Critical", "High", "Medium", "Low", "Commodity"
      "strategicValue": "Critical",
      
      // [OPTIONAL] Version number
      "version": "2.0",
      
      // [OPTIONAL] Technical Fit: "Excellent", "Adequate", "Poor"
      "technicalFit": "Adequate",
      
      // [OPTIONAL] Implementation Complexity: "Low", "Medium", "High", "Very High"
      "complexity": "High",
      
      // [OPTIONAL] Comma-separated tags
      "tags": "finance, core, legacy",
      
      // [OPTIONAL] External link (e.g., to documentation or repository)
      "externalLink": "https://docs.internal/finance",
      
      // [OPTIONAL] Valid From Date (YYYY-MM-DD)
      "validFrom": "2023-01-01",
      
      // [OPTIONAL] Valid To Date (YYYY-MM-DD)
      "validTo": "2030-12-31",

      // [OPTIONAL] Owner email or name
      "owner": "finance-team@company.com",

      // [OPTIONAL] Custom Metadata (JSON string)
      "metadata": "{\\"costCenter\\": \\"CC-123\\"}"
    },
    {
      "name": "General Ledger DB",
      "type": "DataEntity",
      "layer": "Data",
      "description": "Primary database for financial records",
      "lifecycle": "Run",
      "strategicValue": "High"
    }
  ],

  "relationships": [
    // You can define multiple relationships for the same component to simplify connectivity.
    // Ensure 'sourceName' and 'targetName' match the 'name' of components defined above OR existing in the catalog.
    
    {
      // [REQUIRED] Name of the source component (must match a name in 'components' array or existing catalog)
      "sourceName": "Finance System",
      
      // [REQUIRED] Name of the target component (must match a name in 'components' array or existing catalog)
      "targetName": "General Ledger DB",
      
      // [REQUIRED] Type of relationship: "Composed Of", "Aggregates", "Realizes", "Serves", "Accesses", "Flows To", "Triggered By", "Associated With"
      "type": "Writes To",
      
      // [OPTIONAL] Description of the interaction
      "description": "Daily batch updates"
    },
    {
      "sourceName": "Finance System",
      "targetName": "Reporting Service",
      "type": "Flows To", 
      "description": "Real-time stream"
    }
  ]
}`

        const blob = new Blob([templateContent], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "import_template.json"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Select File</CardTitle>
                <CardDescription>Upload a JSON file containing your architecture components and relationships.</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className={`
                        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                        ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".json"
                        onChange={handleChange}
                        disabled={isAnalyzing}
                    />

                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="bg-slate-100 p-4 rounded-full">
                            {isAnalyzing ? (
                                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                            ) : (
                                <Upload className="h-8 w-8 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-medium text-slate-900">
                                {isAnalyzing ? "Analyzing..." : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">JSON files only</p>
                        </div>
                    </label>
                </div>

                <div className="mt-8 flex justify-center">
                    <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                        <Download size={16} />
                        Download Template with Comments
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
