"use client"

import { useState, useEffect } from 'react';
import { X, History, RotateCcw, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Version {
    id: string;
    projectId: string;
    description: string;
    snapshots: string;
    createdAt: string;
}

interface VersionHistoryModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onRestore: () => void;
}

export function VersionHistoryModal({ projectId, isOpen, onClose, onRestore }: VersionHistoryModalProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchVersions();
        }
    }, [isOpen, projectId]);

    const fetchVersions = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/versions`);
            if (res.ok) {
                const data = await res.json();
                setVersions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId: string) => {
        if (!confirm('Restore this version? Current AS-IS will be archived first.')) return;

        setRestoring(versionId);
        try {
            const res = await fetch(`/api/projects/${projectId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId, action: 'restore' })
            });

            if (res.ok) {
                alert('Version restored successfully!');
                onRestore();
                onClose();
            } else {
                alert('Failed to restore version');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to restore version');
        } finally {
            setRestoring(null);
        }
    };

    const parseSnapshots = (snapshotsStr: string) => {
        try {
            return JSON.parse(snapshotsStr);
        } catch {
            return [];
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading versions...</div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No version history</h3>
                            <p className="text-sm text-gray-500">
                                Version history is created when you adopt a Target state as the new AS-IS.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <p className="text-sm text-amber-700">
                                    Restoring a version will replace the current AS-IS state. The current state will be archived first.
                                </p>
                            </div>

                            {versions.map((version, index) => {
                                const snapshots = parseSnapshots(version.snapshots);
                                const isExpanded = expandedVersion === version.id;

                                return (
                                    <div key={version.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div
                                            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                            onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        v{versions.length - index}
                                                    </Badge>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatDate(version.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">{version.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">
                                                    {snapshots.length} components
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => { e.stopPropagation(); handleRestore(version.id); }}
                                                    disabled={restoring === version.id}
                                                    className="gap-1"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    {restoring === version.id ? 'Restoring...' : 'Restore'}
                                                </Button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-4 bg-white border-t border-gray-100">
                                                <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                                                    Components in this version
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {snapshots.map((snap: any, i: number) => (
                                                        <span
                                                            key={i}
                                                            className={`px-2 py-1 text-xs rounded-full ${snap.componentType === 'bc' ? 'bg-amber-100 text-amber-800' :
                                                                    snap.componentType === 'dc' ? 'bg-emerald-100 text-emerald-800' :
                                                                        snap.componentType === 'abb' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-violet-100 text-violet-800'
                                                                }`}
                                                        >
                                                            {snap.componentType.toUpperCase()}: {snap.componentId}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
