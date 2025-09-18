"use client"

import { memo, useState, useCallback } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit2, Check, X, Trash2 } from "lucide-react"

export interface Method {
    id: string
    name: string
    returnType: string
    parameters: string
    visibility: "public" | "private" | "protected"
    isStatic: boolean
    isAbstract: boolean
}

export interface ClassAttribute {
    id: string
    name: string
    type: string
    visibility: "public" | "private" | "protected"
    isStatic: boolean
    defaultValue?: string
}

export interface ClassData {
    id: string
    name: string
    attributes: ClassAttribute[]
    methods: Method[]
    color: string
    isAbstract: boolean
    isInterface: boolean
    onUpdateClass?: (classId: string, updatedData: Partial<ClassData>) => void
    onUpdateAttribute?: (attributeId: string, updatedAttribute: Partial<ClassAttribute>) => void
    onUpdateMethod?: (methodId: string, updatedMethod: Partial<Method>) => void
    onDeleteAttribute?: (attributeId: string) => void
    onDeleteMethod?: (methodId: string) => void
    [key: string]: unknown
}

interface ClassNodeProps extends NodeProps {
    data: ClassData & {
        diagramType?: "class" | "er"
    }
}

const visibilitySymbols = {
    public: "+",
    private: "-",
    protected: "#",
} as const

const ClassNode = memo(({ data, selected, id }: ClassNodeProps) => {
    const [editingAttribute, setEditingAttribute] = useState<string | null>(null)
    const [editingMethod, setEditingMethod] = useState<string | null>(null)
    const [editingName, setEditingName] = useState(false)
    const [tempName, setTempName] = useState(data.name)
    const [tempAttribute, setTempAttribute] = useState<Partial<ClassAttribute>>({})
    const [tempMethod, setTempMethod] = useState<Partial<Method>>({})

    const colors = {
        blue: { bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500" },
        green: { bg: "bg-green-50", border: "border-green-200", accent: "bg-green-500" },
        purple: { bg: "bg-purple-50", border: "border-purple-200", accent: "bg-purple-500" },
        orange: { bg: "bg-orange-50", border: "border-orange-200", accent: "bg-orange-500" },
        red: { bg: "bg-red-50", border: "border-red-200", accent: "bg-red-500" },
        teal: { bg: "bg-teal-50", border: "border-teal-200", accent: "bg-teal-500" },
        indigo: { bg: "bg-indigo-50", border: "border-indigo-200", accent: "bg-indigo-500" },
        pink: { bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-500" },
    } as const

    const colorScheme = colors[data.color as keyof typeof colors] || colors.blue

    const handleNameSave = useCallback(() => {
        if (data.onUpdateClass && id && tempName.trim()) {
            data.onUpdateClass(id, { name: tempName.trim() })
        }
        setEditingName(false)
    }, [data, id, tempName])

    const handleNameCancel = useCallback(() => {
        setTempName(data.name)
        setEditingName(false)
    }, [data.name])

    const handleAttributeEdit = useCallback((attributeId: string, field: keyof ClassAttribute, value: any) => {
        if (data.onUpdateAttribute) {
            data.onUpdateAttribute(attributeId, { [field]: value })
        }
    }, [data])

    const handleMethodEdit = useCallback((methodId: string, field: keyof Method, value: any) => {
        if (data.onUpdateMethod) {
            data.onUpdateMethod(methodId, { [field]: value })
        }
    }, [data])

    const handleAddMethod = useCallback(() => {
        const newMethod: Method = {
            id: `method-${Date.now()}`,
            name: "newMethod",
            returnType: "void",
            parameters: "",
            visibility: "public",
            isStatic: false,
            isAbstract: false,
        }

        if (data.onUpdateClass && id) {
            const updatedMethods = [...data.methods, newMethod]
            data.onUpdateClass(id, { methods: updatedMethods })
        }
    }, [data, id])

    const handleAddAttribute = useCallback(() => {
        const newAttribute: ClassAttribute = {
            id: `attr-${Date.now()}`,
            name: "newAttribute",
            type: "String",
            visibility: "public",
            isStatic: false,
        }

        if (data.onUpdateClass && id) {
            const updatedAttributes = [...data.attributes, newAttribute]
            data.onUpdateClass(id, { attributes: updatedAttributes })
        }
    }, [data, id])

    const handleDeleteAttribute = useCallback((attributeId: string) => {
        if (data.onDeleteAttribute) {
            data.onDeleteAttribute(attributeId)
        } else if (data.onUpdateClass && id) {
            const updatedAttributes = data.attributes.filter(attr => attr.id !== attributeId)
            data.onUpdateClass(id, { attributes: updatedAttributes })
        }
    }, [data, id])

    const handleDeleteMethod = useCallback((methodId: string) => {
        if (data.onDeleteMethod) {
            data.onDeleteMethod(methodId)
        } else if (data.onUpdateClass && id) {
            const updatedMethods = data.methods.filter(method => method.id !== methodId)
            data.onUpdateClass(id, { methods: updatedMethods })
        }
    }, [data, id])

    const startEditingAttribute = useCallback((attr: ClassAttribute) => {
        setEditingAttribute(attr.id)
        setTempAttribute({ ...attr })
    }, [])

    const saveAttributeEdit = useCallback(() => {
        if (editingAttribute && tempAttribute) {
            if (data.onUpdateAttribute) {
                data.onUpdateAttribute(editingAttribute, tempAttribute)
            }
        }
        setEditingAttribute(null)
        setTempAttribute({})
    }, [editingAttribute, tempAttribute, data])

    const cancelAttributeEdit = useCallback(() => {
        setEditingAttribute(null)
        setTempAttribute({})
    }, [])

    const startEditingMethod = useCallback((method: Method) => {
        setEditingMethod(method.id)
        setTempMethod({ ...method })
    }, [])

    const saveMethodEdit = useCallback(() => {
        if (editingMethod && tempMethod) {
            if (data.onUpdateMethod) {
                data.onUpdateMethod(editingMethod, tempMethod)
            }
        }
        setEditingMethod(null)
        setTempMethod({})
    }, [editingMethod, tempMethod, data])

    const cancelMethodEdit = useCallback(() => {
        setEditingMethod(null)
        setTempMethod({})
    }, [])

    return (
        <div
            className={`min-w-[280px] max-w-[400px] bg-white border-2 rounded-lg shadow-lg transition-all duration-200 ${
                selected ? "ring-2 ring-blue-400 shadow-xl" : ""
            } ${colorScheme.border}`}
        >
            {/* Color accent bar */}
            <div className={`h-1 ${colorScheme.accent} rounded-t-md`} />

            {/* Class header */}
            <div className={`p-3 ${colorScheme.bg} border-b ${colorScheme.border}`}>
                <div className="flex items-center justify-between">
                    {editingName ? (
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="text-sm font-semibold"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNameSave()
                                    if (e.key === 'Escape') handleNameCancel()
                                }}
                            />
                            <Button size="sm" variant="ghost" onClick={handleNameSave}>
                                <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleNameCancel}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex flex-col">
                                {data.isInterface && <span className="text-xs text-gray-500 italic">«interface»</span>}
                                {data.isAbstract && !data.isInterface && (
                                    <span className="text-xs text-gray-500 italic">«abstract»</span>
                                )}
                                <h3
                                    className={`font-semibold text-gray-900 cursor-pointer hover:text-blue-600 ${
                                        data.isAbstract ? "italic" : ""
                                    }`}
                                    onClick={() => setEditingName(true)}
                                >
                                    {data.name}
                                </h3>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Attributes section */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Atributos</h4>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleAddAttribute}>
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
                <div className="space-y-1">
                    {data.attributes && data.attributes.length > 0 ? (
                        data.attributes.map((attr) => (
                            <div
                                key={attr.id}
                                className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded group"
                            >
                                <span className="text-gray-500 w-4 text-center">{visibilitySymbols[attr.visibility]}</span>
                                {editingAttribute === attr.id ? (
                                    <div className="flex items-center gap-1 flex-1">
                                        <Input
                                            value={tempAttribute.name || ""}
                                            onChange={(e) => setTempAttribute(prev => ({ ...prev, name: e.target.value }))}
                                            className="text-xs h-6"
                                            placeholder="name"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveAttributeEdit()
                                                if (e.key === 'Escape') cancelAttributeEdit()
                                            }}
                                        />
                                        <span className="text-gray-500">:</span>
                                        <Input
                                            value={tempAttribute.type || ""}
                                            onChange={(e) => setTempAttribute(prev => ({ ...prev, type: e.target.value }))}
                                            className="text-xs h-6"
                                            placeholder="type"
                                        />
                                        <Select
                                            value={tempAttribute.visibility || "public"}
                                            onValueChange={(value: "public" | "private" | "protected") =>
                                                setTempAttribute(prev => ({ ...prev, visibility: value }))
                                            }
                                        >
                                            <SelectTrigger className="text-xs h-6 w-16">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="public">Public</SelectItem>
                                                <SelectItem value="private">Private</SelectItem>
                                                <SelectItem value="protected">Protected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm" variant="ghost" onClick={saveAttributeEdit} className="h-6 w-6 p-0">
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={cancelAttributeEdit} className="h-6 w-6 p-0">
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className="flex items-center gap-1 flex-1 cursor-pointer"
                                            onClick={() => startEditingAttribute(attr)}
                                        >
                                            <span className={attr.isStatic ? "underline" : ""}>{attr.name}</span>
                                            <span className="text-gray-500">:</span>
                                            <span className="text-gray-500">{attr.type}</span>
                                            {attr.defaultValue && (
                                                <>
                                                    <span className="text-gray-500">=</span>
                                                    <span className="text-blue-600">{attr.defaultValue}</span>
                                                </>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteAttribute(attr.id)
                                            }}
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 italic">No hay atributos</p>
                    )}
                </div>
            </div>

            {/* Methods section */}
            <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Methods</h4>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleAddMethod}>
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.methods && data.methods.length > 0 ? (
                        data.methods.map((method) => (
                            <div
                                key={method.id}
                                className="flex items-center gap-2 text-sm hover:bg-gray-50 p-2 rounded border border-gray-100 group"
                            >
                                <span className="text-gray-500 w-4 text-center">{visibilitySymbols[method.visibility]}</span>
                                {editingMethod === method.id ? (
                                    <div className="flex items-center gap-1 flex-1 text-xs">
                                        <Input
                                            value={tempMethod.name || ""}
                                            onChange={(e) => setTempMethod(prev => ({ ...prev, name: e.target.value }))}
                                            className="text-xs h-7"
                                            placeholder="methodName"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveMethodEdit()
                                                if (e.key === 'Escape') cancelMethodEdit()
                                            }}
                                        />
                                        <span>(</span>
                                        <Input
                                            value={tempMethod.parameters || ""}
                                            onChange={(e) => setTempMethod(prev => ({ ...prev, parameters: e.target.value }))}
                                            className="text-xs h-7"
                                            placeholder="params"
                                        />
                                        <span>):</span>
                                        <Input
                                            value={tempMethod.returnType || ""}
                                            onChange={(e) => setTempMethod(prev => ({ ...prev, returnType: e.target.value }))}
                                            className="text-xs h-7"
                                            placeholder="returnType"
                                        />
                                        <Select
                                            value={tempMethod.visibility || "public"}
                                            onValueChange={(value: "public" | "private" | "protected") =>
                                                setTempMethod(prev => ({ ...prev, visibility: value }))
                                            }
                                        >
                                            <SelectTrigger className="text-xs h-7 w-16">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="public">Public</SelectItem>
                                                <SelectItem value="private">Private</SelectItem>
                                                <SelectItem value="protected">Protected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm" variant="ghost" onClick={saveMethodEdit} className="h-7 w-7 p-0">
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={cancelMethodEdit} className="h-7 w-7 p-0">
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className="flex items-center gap-1 flex-1 cursor-pointer"
                                            onClick={() => startEditingMethod(method)}
                                        >
                      <span className={`${method.isStatic ? "underline" : ""} ${method.isAbstract ? "italic" : ""}`}>
                        {method.name}
                      </span>
                                            <span className="text-gray-500">({method.parameters})</span>
                                            <span className="text-gray-500">:</span>
                                            <span className="text-gray-500">{method.returnType}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteMethod(method.id)
                                            }}
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 italic">No methods</p>
                    )}
                </div>
            </div>

            {/* Connection handles */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-white" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400 border-2 border-white" />
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400 border-2 border-white" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-400 border-2 border-white" />
        </div>
    )
})

ClassNode.displayName = "ClassNode"

export default ClassNode