"use client"

import { useState } from 'react';
import { X, Users, Tag, Calendar, FileText, Edit2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate?: string;
    endDate?: string;
    stakeholders?: string[];
    tags?: string[];
}

interface ProjectDetailsModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (updates: Partial<Project>) => void;
}

export function ProjectDetailsModal({ project, isOpen, onClose, onSave }: ProjectDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(project.description || '');
    const [stakeholders, setStakeholders] = useState(project.stakeholders?.join(', ') || '');
    const [tags, setTags] = useState(project.tags?.join(', ') || '');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave?.({
            description,
            stakeholders: stakeholders.split(',').map(s => s.trim()).filter(Boolean),
            tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        });
        setIsEditing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-500';
            case 'In Progress': return 'bg-blue-500';
            case 'Planned': return 'bg-gray-500';
            case 'Draft': return 'bg-amber-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold">{project.name}</h2>
                                <Badge className={`${getStatusColor(project.status)} text-white`}>
                                    {project.status}
                                </Badge>
                            </div>
                            {project.startDate && (
                                <div className="flex items-center gap-2 text-white/80 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>{project.startDate} — {project.endDate || 'Ongoing'}</span>
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Details
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Description */}
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            <FileText className="w-4 h-4" />
                            Description
                        </div>
                        {isEditing ? (
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Describe the project scope, objectives, and expected outcomes..."
                            />
                        ) : (
                            <p className="text-gray-700 leading-relaxed">
                                {project.description || 'No description provided.'}
                            </p>
                        )}
                    </div>

                    {/* Stakeholders */}
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            <Users className="w-4 h-4" />
                            Stakeholders
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={stakeholders}
                                onChange={(e) => setStakeholders(e.target.value)}
                                className="w-full px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Separate names with commas (e.g., John Doe, Jane Smith)"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {project.stakeholders && project.stakeholders.length > 0 ? (
                                    project.stakeholders.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            {s}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic">No stakeholders defined</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            <Tag className="w-4 h-4" />
                            Tags
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Separate tags with commas (e.g., GenAI, Customer Service, Chatbot)"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {project.tags && project.tags.length > 0 ? (
                                    project.tags.map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700">
                                            {tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic">No tags defined</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                {isEditing && (
                    <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
