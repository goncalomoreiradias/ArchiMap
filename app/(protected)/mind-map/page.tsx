import { ArchMindMap } from "@/components/mindmap/ArchMindMap";

export default function MindMapPage() {
    return (
        <div className="h-[calc(100vh-theme(spacing.4))] w-full flex flex-col bg-blue-50">
            <div className="h-14 border-b flex items-center px-6 bg-white dark:bg-gray-950 shrink-0">
                <h1 className="text-lg font-semibold">Architecture Landscape</h1>
            </div>
            <div className="flex-1 min-h-0 relative">
                <ArchMindMap />
            </div>
        </div>
    );
}
