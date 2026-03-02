
import { Progress } from "@/components/ui/progress"

interface GapCoverageBarProps {
    changes: any[]
}

export function GapCoverageBar({ changes }: GapCoverageBarProps) {
    if (!changes || changes.length === 0) return null

    const total = changes.length
    const assigned = changes.filter((c: any) => c.gapPhaseId).length
    const percentage = Math.round((assigned / total) * 100)

    return (
        <div className="flex flex-col gap-1 w-full max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Roadmap Coverage</span>
                <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-[10px] text-muted-foreground text-right">
                {assigned} of {total} changes planned
            </div>
        </div>
    )
}
