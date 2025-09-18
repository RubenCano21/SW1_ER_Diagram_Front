"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ChevronLeft, ChevronRight, Database, Trash2, Edit3, Key, Link, GitBranch, Table } from "lucide-react"
import type { EntityData, Attribute, RelationshipData } from "./er-diagram-tool"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onAddEntity: () => void
  selectedEntity: EntityData | null
  selectedRelationship: RelationshipData | null
  onUpdateEntity: (entityId: string, data: Partial<EntityData>) => void
  onUpdateRelationship: (relationshipId: string, data: Partial<RelationshipData>) => void
  onAddAttribute: (entityId: string) => void
  onUpdateAttribute: (entityId: string, attributeId: string, data: Partial<Attribute>) => void
  onDeleteAttribute: (entityId: string, attributeId: string) => void
  onDeleteEntity: (entityId: string) => void
  onDeleteRelationship: (relationshipId: string) => void
  entities: EntityData[]
  onSelectEntity: (entityId: string) => void
  selectedEntityId: string | null
}

export const addEntity = () => {
  const newEntity = {
    id: `entity-${Date.now()}`,
    type: "entity",
    position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    data: {
      id: `entity-${Date.now()}`,
      name: "New Entity",
      attributes: [
        {
          id: `attr-${Date.now()}`,
          name: "id",
          type: "INTEGER",
          isPrimaryKey: true,
          isForeignKey: false,
          isRequired: true,
        },
      ],
    },
  }
  return newEntity
}

export default function Sidebar({
  isOpen,
  onToggle,
  onAddEntity,
  selectedEntity,
  selectedRelationship,
  onUpdateEntity,
  onUpdateRelationship,
  onAddAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  onDeleteEntity,
  onDeleteRelationship,
  entities,
  onSelectEntity,
  selectedEntityId,
}: SidebarProps) {
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null)

  const handleEntityNameChange = (name: string) => {
    if (selectedEntity) {
      onUpdateEntity(selectedEntity.id, { name })
    }
  }

  const handleAttributeUpdate = (attributeId: string, data: Partial<Attribute>) => {
    if (selectedEntity) {
      onUpdateAttribute(selectedEntity.id, attributeId, data)
      setEditingAttribute(null)
    }
  }

  const handleRelationshipUpdate = (data: Partial<RelationshipData>) => {
    if (selectedRelationship) {
      onUpdateRelationship(selectedRelationship.id, data)
    }
  }

  return (
    <div
      className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${isOpen ? "w-80" : "w-12"}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {isOpen && <h2 className="text-lg font-semibold text-sidebar-foreground">Tools</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {isOpen && (
          <div className="space-y-4">
            <Card className="bg-card border-border sidebar-section">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Entities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={onAddEntity}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: "#1f2937",
                    color: "#ffffff",
                    border: "1px solid #374151",
                    position: "relative",
                    zIndex: 999,
                  }}
                >
                  <Plus className="h-4 w-4" style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Add Entity</span>
                </button>

                {entities.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground flex items-center gap-1">
                      <Table className="h-3 w-3" />
                      Entity List ({entities.length})
                    </Label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {entities.map((entity) => (
                        <div
                          key={entity.id}
                          onClick={() => onSelectEntity(entity.id)}
                          className={`p-2 rounded-md cursor-pointer transition-colors border ${
                            selectedEntityId === entity.id
                              ? "bg-accent border-accent-foreground/20 text-accent-foreground"
                              : "bg-muted/50 border-border hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    {
                                      blue: "#3b82f6",
                                      green: "#10b981",
                                      purple: "#8b5cf6",
                                      orange: "#f97316",
                                      red: "#ef4444",
                                      teal: "#14b8a6",
                                      indigo: "#6366f1",
                                      pink: "#ec4899",
                                    }[entity.color] || "#6366f1",
                                }}
                              />
                              <span className="text-sm font-medium truncate">{entity.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {entity.attributes.length}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedRelationship && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      Relationship Details
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRelationship(selectedRelationship.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="relationship-type" className="text-xs text-foreground">
                      Relationship Type
                    </Label>
                    <Select
                      value={selectedRelationship.type}
                      onValueChange={(value) => handleRelationshipUpdate({ type: value as any })}
                    >
                      <SelectTrigger className="mt-1 bg-background text-foreground border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="association">Association</SelectItem>
                        <SelectItem value="composition">Composition</SelectItem>
                        <SelectItem value="aggregation">Aggregation</SelectItem>
                        <SelectItem value="generalization">Generalization</SelectItem>
                        <SelectItem value="dependency">Dependency</SelectItem>
                        <SelectItem value="one-to-one">One to One</SelectItem>
                        <SelectItem value="one-to-many">One to Many</SelectItem>
                        <SelectItem value="many-to-many">Many to Many</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="relationship-label" className="text-xs text-foreground">
                      Label
                    </Label>
                    <Input
                      id="relationship-label"
                      value={selectedRelationship.label || ""}
                      onChange={(e) => handleRelationshipUpdate({ label: e.target.value })}
                      className="mt-1 bg-background text-foreground border-border"
                      size={12}
                      placeholder="Relationship label"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="source-cardinality" className="text-xs text-foreground">
                        Source Cardinality
                      </Label>
                      <Select
                        value={selectedRelationship.sourceCardinality || "1"}
                        onValueChange={(value) => handleRelationshipUpdate({ sourceCardinality: value })}
                      >
                        <SelectTrigger className="mt-1 bg-background text-foreground border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="0..1">0..1</SelectItem>
                          <SelectItem value="1..*">1..*</SelectItem>
                          <SelectItem value="0..*">0..*</SelectItem>
                          <SelectItem value="*">*</SelectItem>
                          <SelectItem value="n">n</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="target-cardinality" className="text-xs text-foreground">
                        Target Cardinality
                      </Label>
                      <Select
                        value={selectedRelationship.targetCardinality || "*"}
                        onValueChange={(value) => handleRelationshipUpdate({ targetCardinality: value })}
                      >
                        <SelectTrigger className="mt-1 bg-background text-foreground border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="0..1">0..1</SelectItem>
                          <SelectItem value="1..*">1..*</SelectItem>
                          <SelectItem value="0..*">0..*</SelectItem>
                          <SelectItem value="*">*</SelectItem>
                          <SelectItem value="n">n</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedEntity && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-foreground flex items-center justify-between">
                    <span>Entity Details</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEntity(selectedEntity.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="entity-name" className="text-xs text-foreground">
                      Entity Name
                    </Label>
                    <Input
                      id="entity-name"
                      value={selectedEntity.name}
                      onChange={(e) => handleEntityNameChange(e.target.value)}
                      className="mt-1 bg-background text-foreground border-border"
                      size={12}
                    />
                  </div>

                  <Separator className="bg-border" />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-foreground">Attributes</Label>
                      <Button
                        onClick={() => onAddAttribute(selectedEntity.id)}
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs border-border text-foreground hover:bg-accent"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedEntity.attributes.map((attribute) => (
                        <div key={attribute.id} className="p-2 bg-muted border border-border rounded text-xs">
                          {editingAttribute === attribute.id ? (
                            <div className="space-y-2">
                              <Input
                                value={attribute.name}
                                onChange={(e) =>
                                  onUpdateAttribute(selectedEntity.id, attribute.id, {
                                    name: e.target.value,
                                  })
                                }
                                className="h-6 text-xs bg-background border-border"
                                placeholder="Attribute name"
                              />
                              <Select
                                value={attribute.type}
                                onValueChange={(value) =>
                                  onUpdateAttribute(selectedEntity.id, attribute.id, {
                                    type: value,
                                  })
                                }
                              >
                                <SelectTrigger className="h-6 text-xs bg-background border-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INTEGER">INTEGER</SelectItem>
                                  <SelectItem value="VARCHAR(255)">VARCHAR(255)</SelectItem>
                                  <SelectItem value="TEXT">TEXT</SelectItem>
                                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                  <SelectItem value="DATE">DATE</SelectItem>
                                  <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                                  <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                                  <SelectItem value="FLOAT">FLOAT</SelectItem>
                                  <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`pk-${attribute.id}`}
                                    checked={attribute.isPrimaryKey}
                                    onCheckedChange={(checked: boolean) =>
                                      onUpdateAttribute(selectedEntity.id, attribute.id, {
                                        isPrimaryKey: checked as boolean,
                                      })
                                    }
                                  />
                                  <Label htmlFor={`pk-${attribute.id}`} className="text-xs text-foreground">
                                    PK
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`fk-${attribute.id}`}
                                    checked={attribute.isForeignKey}
                                    onCheckedChange={(checked: boolean) =>
                                      onUpdateAttribute(selectedEntity.id, attribute.id, {
                                        isForeignKey: checked as boolean,
                                      })
                                    }
                                  />
                                  <Label htmlFor={`fk-${attribute.id}`} className="text-xs text-foreground">
                                    FK
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`req-${attribute.id}`}
                                    checked={attribute.isRequired}
                                    onCheckedChange={(checked: boolean) =>
                                      onUpdateAttribute(selectedEntity.id, attribute.id, {
                                        isRequired: checked as boolean,
                                      })
                                    }
                                  />
                                  <Label htmlFor={`req-${attribute.id}`} className="text-xs text-foreground">
                                    Required
                                  </Label>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => setEditingAttribute(null)}
                                  className="h-6 px-2 text-xs high-contrast-button"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingAttribute(null)}
                                  className="h-6 px-2 text-xs border-border"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {attribute.isPrimaryKey && <Key className="h-3 w-3 text-primary" />}
                                {attribute.isForeignKey && <Link className="h-3 w-3 text-primary" />}
                                <span className="font-medium text-foreground">{attribute.name}</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0 bg-muted text-foreground border-border"
                                >
                                  {attribute.type}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingAttribute(attribute.id)}
                                  className="h-5 w-5 p-0 text-foreground hover:bg-accent"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onDeleteAttribute(selectedEntity.id, attribute.id)}
                                  className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
