"use client"

import { useState } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Key, Edit3, Save, X, Database } from "lucide-react"

// Definir tipos internamente si no están disponibles
interface Attribute {
    id: string
    name: string
    type: string
    isPrimaryKey: boolean
    isForeignKey: boolean
    isRequired: boolean
}

interface EntityData {
    name: string
    color: string
    attributes: Attribute[]
    onUpdateAttribute?: (attributeId: string, updatedAttribute: Partial<Attribute>) => void
    onUpdateEntity?: (entityId: string, updatedData: Partial<EntityData>) => void
    modelType?: string
    [key: string]: unknown // Signatura de índice para permitir propiedades adicionales
}

// Simplificar la interfaz del nodo
interface EntityNodeProps extends NodeProps {
    data: EntityData
}

export default function EntityNode({ data, selected, id }: EntityNodeProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(data.name)
    const [editingAttribute, setEditingAttribute] = useState<string | null>(null)
    const [editAttributeData, setEditAttributeData] = useState<Partial<Attribute>>({})

    const handleSave = () => {
        // Llamar al callback de actualización si existe
        if (data.onUpdateEntity && id) {
            data.onUpdateEntity(id, { name: editName })
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditName(data.name)
        setIsEditing(false)
    }

    const handleAttributeClick = (attribute: Attribute) => {
        setEditingAttribute(attribute.id)
        setEditAttributeData({ ...attribute }) // Clonar el objeto completo
    }

    const handleAttributeSave = () => {
        if (editingAttribute && data.onUpdateAttribute) {
            data.onUpdateAttribute(editingAttribute, editAttributeData)
        }
        setEditingAttribute(null)
        setEditAttributeData({})
    }

    const handleAttributeCancel = () => {
        setEditingAttribute(null)
        setEditAttributeData({})
    }

    const getEntityAccentColor = () => {
        const colors: Record<string, string> = {
            blue: "rgb(59, 130, 246)",
            green: "rgb(16, 185, 129)",
            purple: "rgb(139, 92, 246)",
            orange: "rgb(249, 115, 22)",
            red: "rgb(239, 68, 68)",
            teal: "rgb(20, 184, 166)",
            indigo: "rgb(99, 102, 241)",
            pink: "rgb(236, 72, 153)",
        }
        return colors[data.color] || colors.blue
    }

    const getDisplayFields = (attribute: Attribute) => {
        const modelType = data.modelType || "physical"

        switch (modelType) {
            case "conceptual":
                return { showType: false, showConstraints: false }
            case "logical":
                return { showType: true, showConstraints: false }
            case "physical":
            default:
                return { showType: true, showConstraints: true }
        }
    }

    const accentColor = getEntityAccentColor()

    return (
        <div className={`entity-node min-w-[220px] max-w-[300px] group ${selected ? "selected" : ""}`}>
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-white border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-100 transition-all duration-200"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-white border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-100 transition-all duration-200"
            />
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-white border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-100 transition-all duration-200"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-white border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-100 transition-all duration-200"
            />

            <div
                className={`bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 overflow-hidden ${
                    selected ? "ring-2 ring-blue-300 shadow-md" : "hover:shadow-md"
                }`}
                style={{
                    borderLeftColor: accentColor,
                    borderLeftWidth: "3px",
                }}
            >
                <div className="entity-header bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-7 text-sm bg-white border-gray-300"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSave()
                                        } else if (e.key === 'Escape') {
                                            handleCancel()
                                        }
                                    }}
                                />
                                <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
                                    <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4" style={{ color: accentColor }} />
                                    <h3 className="font-semibold text-sm text-gray-900">{data.name}</h3>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsEditing(true)}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Edit3 className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white">
                    {data.attributes && data.attributes.length > 0 ? (
                        data.attributes.map((attribute: Attribute, index: number) => {
                            const displayFields = getDisplayFields(attribute)
                            const isEditingThis = editingAttribute === attribute.id

                            return (
                                <div
                                    key={attribute.id}
                                    className="attribute-item px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group"
                                >
                                    {isEditingThis ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editAttributeData.name || ""}
                                                    onChange={(e) => setEditAttributeData((prev) => ({ ...prev, name: e.target.value }))}
                                                    className="h-7 text-sm flex-1"
                                                    placeholder="Attribute name"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAttributeSave()
                                                        } else if (e.key === 'Escape') {
                                                            handleAttributeCancel()
                                                        }
                                                    }}
                                                />
                                                {displayFields.showType && (
                                                    <Select
                                                        value={editAttributeData.type || ""}
                                                        onValueChange={(value) => setEditAttributeData((prev) => ({ ...prev, type: value }))}
                                                    >
                                                        <SelectTrigger className="h-7 w-32 text-xs">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="INTEGER">INTEGER</SelectItem>
                                                            <SelectItem value="VARCHAR(255)">VARCHAR(255)</SelectItem>
                                                            <SelectItem value="TEXT">TEXT</SelectItem>
                                                            <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                                            <SelectItem value="DATE">DATE</SelectItem>
                                                            <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                                                            <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                            {displayFields.showConstraints && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editAttributeData.isPrimaryKey ?? false}
                                                            onChange={(e) =>
                                                                setEditAttributeData((prev) => ({ ...prev, isPrimaryKey: e.target.checked }))
                                                            }
                                                            className="w-3 h-3"
                                                        />
                                                        PK
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editAttributeData.isForeignKey ?? false}
                                                            onChange={(e) =>
                                                                setEditAttributeData((prev) => ({ ...prev, isForeignKey: e.target.checked }))
                                                            }
                                                            className="w-3 h-3"
                                                        />
                                                        FK
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editAttributeData.isRequired ?? false}
                                                            onChange={(e) =>
                                                                setEditAttributeData((prev) => ({ ...prev, isRequired: e.target.checked }))
                                                            }
                                                            className="w-3 h-3"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            )}
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={handleAttributeSave} className="h-6 w-6 p-0">
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={handleAttributeCancel} className="h-6 w-6 p-0">
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="flex items-center justify-between text-sm cursor-pointer"
                                            onClick={() => handleAttributeClick(attribute)}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {attribute.isPrimaryKey && displayFields.showConstraints && (
                                                    <Key className="h-3 w-3 text-amber-600 flex-shrink-0" />
                                                )}
                                                <span className="font-medium text-gray-900 truncate">{attribute.name}</span>
                                                {displayFields.showType && attribute.type && (
                                                    <span className="text-gray-500 font-mono text-xs flex-shrink-0">{attribute.type}</span>
                                                )}
                                            </div>
                                            {displayFields.showConstraints && (
                                                <div className="flex gap-1 flex-shrink-0">
                                                    {attribute.isPrimaryKey && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200"
                                                        >
                                                            PK
                                                        </Badge>
                                                    )}
                                                    {attribute.isForeignKey && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50"
                                                        >
                                                            FK
                                                        </Badge>
                                                    )}
                                                    {attribute.isRequired && !attribute.isPrimaryKey && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs px-1.5 py-0 border-red-200 text-red-700 bg-red-50"
                                                        >
                                                            *
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                            No hay atributos definidos
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}