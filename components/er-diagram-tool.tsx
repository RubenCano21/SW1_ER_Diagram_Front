"use client"

import {useCallback, useEffect, useMemo, useState} from "react"
import {
    addEdge,
    Background,
    BackgroundVariant,
    type Connection,
    ConnectionLineType,
    Controls,
    type Edge,
    type EdgeTypes,
    MiniMap,
    type Node,
    type NodeTypes,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {Badge} from "@/components/ui/badge"
import {Database, Sparkles} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import EntityNode from "./entity-node"
import RelationshipEdge from "./relationship-edge"
import ClassNode from "./class-node"
import Sidebar from "./sidebar"

export interface Attribute {
  id: string
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  isRequired: boolean
  visibility?: string
  isStatic?: boolean
}

export interface EntityData {
  id: string
  name: string
  attributes: Attribute[]
  color: string // Added color property to EntityData interface
}

export interface ClassData {
  id: string
  name: string
  color: string
  isAbstract: boolean
  isInterface: boolean
  attributes: Attribute[]
  methods: {
    id: string
    name: string
    returnType: string
    parameters: string
    visibility: string
    isStatic: boolean
    isAbstract: boolean
  }[]
}

export interface RelationshipData {
  id: string
  type: string
  label: string
  sourceCardinality: string
  targetCardinality: string
}

const entityColors = ["blue", "green", "purple", "orange", "red", "teal", "indigo", "pink"]

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

const nodeTypes: NodeTypes = {
  entity: EntityNode,
  class: ClassNode, // Added class node type
}

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
}

export default function ERDiagramTool() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [projectName, setProjectName] = useState("Untitled Project")
  const [isModified, setIsModified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [modelType, setModelType] = useState<"conceptual" | "logical" | "physical">("physical")
  const [diagramType, setDiagramType] = useState<"er" | "class">("er") // Added diagram type state

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const exportProject = useCallback(() => {
    setIsLoading(true)

    const projectData = {
      name: projectName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
      })),
    }

    const dataStr = JSON.stringify(projectData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${projectName.replace(/\s+/g, "_")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "✨ Project exported successfully",
        description: `${projectName} has been saved to your downloads.`,
      })
    }, 500)
  }, [projectName, nodes, edges, toast])

  const importProject = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsLoading(true)

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string)

          if (!projectData.nodes || !projectData.edges) {
            throw new Error("Invalid project format")
          }

          setTimeout(() => {
            setProjectName(projectData.name || "Imported Project")
            setNodes(projectData.nodes)
            setEdges(projectData.edges)
            setSelectedEntity(null)
            setSelectedEdge(null)
            setIsModified(false)
            setIsLoading(false)

            toast({
              title: "🎉 Project imported successfully",
              description: `${projectData.name || "Project"} is now ready to edit.`,
            })
          }, 300)
        } catch (error) {
          setIsLoading(false)
          toast({
            title: "❌ Import failed",
            description: "The file format is not valid or corrupted.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }

    input.click()
  }, [setNodes, setEdges, toast])

  const createNewProject = useCallback(() => {
    if (isModified) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to create a new project?")
      if (!confirmed) return
    }

    setIsLoading(true)

    setTimeout(() => {
      setProjectName("Untitled Project")
      setNodes([])
      setEdges([])
      setSelectedEntity(null)
      setSelectedEdge(null)
      setIsModified(false)
      setIsLoading(false)

      toast({
        title: "✨ New project created",
        description: "Ready to design your data model.",
      })
    }, 200)
  }, [isModified, setNodes, setEdges, toast])

  const shareProject = useCallback(() => {
    const projectData = {
      name: projectName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      nodes,
      edges,
    }

    const dataStr = JSON.stringify(projectData)
    const encodedData = btoa(dataStr)
    const shareUrl = `${window.location.origin}${window.location.pathname}?project=${encodedData}`

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast({
          title: "🔗 Share link copied",
          description: "Project link is ready to share with your team.",
        })
      })
      .catch(() => {
        toast({
          title: "🔗 Share link generated",
          description: "Copy the URL from your browser to share this project.",
        })
      })
  }, [projectName, nodes, edges, toast])

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: "relationship",
        data: {
          id: `edge-${Date.now()}`,
          type: "association",
          label: "relates to",
          sourceCardinality: "1",
          targetCardinality: "*",
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
      setIsModified(true)
    },
    [setEdges],
  )

  const checkCollision = useCallback(
    (newPosition: { x: number; y: number }, nodeId: string, nodeWidth = 250, nodeHeight = 200) => {
      const buffer = 20 // Minimum distance between nodes

      return nodes.some((node) => {
        if (node.id === nodeId) return false // Don't check collision with itself

        const nodePos = node.position
        const distance = Math.sqrt(Math.pow(newPosition.x - nodePos.x, 2) + Math.pow(newPosition.y - nodePos.y, 2))

        return distance < nodeWidth + buffer
      })
    },
    [nodes],
  )

  const findNonCollidingPosition = useCallback(
    (basePosition: { x: number; y: number }, nodeId: string) => {
      let position = { ...basePosition }
      let attempts = 0
      const maxAttempts = 50

      while (checkCollision(position, nodeId) && attempts < maxAttempts) {
        // Try positions in a spiral pattern
        const angle = attempts * 0.5 * Math.PI
        const radius = 50 + attempts * 10
        position = {
          x: basePosition.x + Math.cos(angle) * radius,
          y: basePosition.y + Math.sin(angle) * radius,
        }
        attempts++
      }

      return position
    },
    [checkCollision],
  )

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      const modifiedChanges = changes.map((change) => {
        if (change.type === "position" && change.position && change.dragging === false) {
          // When node is dropped, check for collision and adjust position if needed
          const nonCollidingPosition = findNonCollidingPosition(change.position, change.id)
          return {
            ...change,
            position: nonCollidingPosition,
          }
        }
        return change
      })

      onNodesChange(modifiedChanges)
      setIsModified(true)
    },
    [onNodesChange, findNonCollidingPosition],
  )

  const addEntityCallback = useCallback(() => {
    const colorIndex = nodes.length % entityColors.length
    const assignedColor = entityColors[colorIndex]

    const basePosition = { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 }
    const position = findNonCollidingPosition(basePosition, `temp-${Date.now()}`)

    if (diagramType === "class") {
      const newClass: Node = {
        id: `class-${Date.now()}`,
        type: "class",
        position,
        data: {
          id: `class-${Date.now()}`,
          name: "NewClass",
          color: assignedColor,
          isAbstract: false,
          isInterface: false,
          attributes: [
            {
              id: `attr-${Date.now()}`,
              name: "id",
              type: "int",
              visibility: "private",
              isStatic: false,
            },
          ],
          methods: [
            {
              id: `method-${Date.now()}`,
              name: "getId",
              returnType: "int",
              parameters: "",
              visibility: "public",
              isStatic: false,
              isAbstract: false,
            },
          ],
        },
      }
      setNodes((nds) => [...nds, newClass])
      toast({
        title: "🎯 Class added",
        description: `New class with ${assignedColor} theme created.`,
      })
    } else {
      const newEntity: Node = {
        id: `entity-${Date.now()}`,
        type: "entity",
        position,
        data: {
          id: `entity-${Date.now()}`,
          name: "New Entity",
          color: assignedColor,
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
      setNodes((nds) => [...nds, newEntity])
      toast({
        title: "🎯 Entity added",
        description: `New entity with ${assignedColor} theme created.`,
      })
    }
    setIsModified(true)
  }, [setNodes, nodes.length, toast, diagramType, findNonCollidingPosition])

  const updateEntity = useCallback(
    (entityId: string, updatedData: Partial<EntityData>) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === entityId ? { ...node, data: { ...node.data, ...updatedData } } : node)),
      )
      setIsModified(true)
    },
    [setNodes],
  )

  const deleteEntity = useCallback(
    (entityId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== entityId))
      setEdges((eds) => eds.filter((edge) => edge.source !== entityId && edge.target !== entityId))
      if (selectedEntity === entityId) {
        setSelectedEntity(null)
      }
      setIsModified(true)
    },
    [setNodes, setEdges, selectedEntity],
  )

    const addAttribute = useCallback(
        (entityId: string) => {
            const newAttribute: Attribute = {
                id: `attr-${Date.now()}`,
                name: "new_attribute",
                type: "VARCHAR(255)",
                isPrimaryKey: false,
                isForeignKey: false,
                isRequired: false,
            }

            const node = nodes.find((n) => n.id === entityId)
            if (!node) return

            const currentAttributes = ((node.data as unknown as EntityData)?.attributes ?? []) as Attribute[]

            updateEntity(entityId, {
                attributes: [...currentAttributes, newAttribute],
            })
        },
        [nodes, updateEntity],
    )

  const updateAttribute = useCallback(
    (entityId: string, attributeId: string, updatedAttribute: Partial<Attribute>) => {
      const entity = nodes.find((n) => n.id === entityId)
      if (!entity) return

        const updatedAttributes = (entity.data as unknown as EntityData).attributes.map((attr: Attribute) =>
        attr.id === attributeId ? { ...attr, ...updatedAttribute } : attr,
      )

      updateEntity(entityId, { attributes: updatedAttributes })
    },
    [nodes, updateEntity],
  )

  const deleteAttribute = useCallback(
    (entityId: string, attributeId: string) => {
      const entity = nodes.find((n) => n.id === entityId)
      if (!entity) return

        const updatedAttributes = (entity.data as unknown as EntityData).attributes.filter((attr: Attribute) => attr.id !== attributeId)

      updateEntity(entityId, { attributes: updatedAttributes })
    },
    [nodes, updateEntity],
  )

  const updateRelationship = useCallback(
    (edgeId: string, updatedData: Partial<RelationshipData>) => {
      setEdges((eds) =>
        eds.map((edge) => (edge.id === edgeId ? { ...edge, data: { ...edge.data, ...updatedData } } : edge)),
      )
      setIsModified(true)
    },
    [setEdges],
  )

  const deleteRelationship = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
      if (selectedEdge === edgeId) {
        setSelectedEdge(null)
      }
      setIsModified(true)
    },
    [setEdges, selectedEdge],
  )

  const selectedEntityData = useMemo(() => {
    if (!selectedEntity) return null
    return nodes.find((node) => node.id === selectedEntity)?.data || null
  }, [selectedEntity, nodes])

  const selectedRelationshipData = useMemo(() => {
    if (!selectedEdge) return null
    return edges.find((edge) => edge.id === selectedEdge)?.data || null
  }, [selectedEdge, edges])

  return (
    <div className="flex h-screen bg-background">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-6 py-4 shadow-lg">
            <Sparkles className="h-5 w-5 text-accent animate-spin" />
            <span className="text-sm font-medium text-foreground">Processing...</span>
          </div>
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAddEntity={addEntityCallback}
        selectedEntity={selectedEntityData as EntityData | null}
        selectedRelationship={selectedRelationshipData as RelationshipData | null}
        onUpdateEntity={updateEntity}
        onUpdateRelationship={updateRelationship}
        onAddAttribute={addAttribute}
        onUpdateAttribute={updateAttribute}
        onDeleteAttribute={deleteAttribute}
        onDeleteEntity={deleteEntity}
        onDeleteRelationship={deleteRelationship}
        entities={nodes.map((node) => node.data as unknown as EntityData).filter((data) => data.name)} // Extract entity data from nodes// Extract entity data from nodes
        onSelectEntity={(entityId: string) => {
          setSelectedEntity(entityId)
          setSelectedEdge(null)
          const selectedNode = nodes.find((node) => node.id === entityId)
          if (selectedNode) {
            // Focus on the selected node by updating the viewport
            const reactFlowInstance = document.querySelector(".react-flow")
            if (reactFlowInstance) {
              // Trigger a gentle animation to the selected node
              console.log("[v0] Focusing on entity:", selectedNode.data.name)
            }
          }
        }}
        selectedEntityId={selectedEntity}
      />

      <div className="flex-1 relative">
        <header className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-md border-b border-border shadow-sm header">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                  <Database className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">ER Diagram Tool</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{projectName}</span>
                    {isModified && <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Diagram:</span>
                  <select
                    value={diagramType}
                    onChange={(e) => setDiagramType(e.target.value as "er" | "class")}
                    className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                  >
                    <option value="er">ER Diagram</option>
                    <option value="class">Class Diagram</option>
                  </select>
                </div>

                {diagramType === "er" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Model:</span>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value as "conceptual" | "logical" | "physical")}
                      className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                    >
                      <option value="conceptual">Conceptual</option>
                      <option value="logical">Logical</option>
                      <option value="physical">Physical</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                  <Badge
                    variant="outline"
                    className="text-xs bg-card/50 text-foreground border-border hover:bg-accent/10 transition-colors"
                  >
                    {nodes.length} {diagramType === "class" ? "Classes" : "Entities"}{" "}
                    {/* Dynamic label based on diagram type */}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-card/50 text-foreground border-border hover:bg-accent/10 transition-colors"
                  >
                    {edges.length} Relations
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="h-full pt-20 fade-in-up">
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                onUpdateAttribute: (attributeId: string, updatedAttribute: Partial<Attribute>) =>
                  updateAttribute(node.id, attributeId, updatedAttribute),
                modelType,
              },
            }))}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => {
              setSelectedEntity(node.id)
              setSelectedEdge(null)
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdge(edge.id)
              setSelectedEntity(null)
            }}
            onPaneClick={() => {
              setSelectedEntity(null)
              setSelectedEdge(null)
            }}
            fitView
            className="bg-background custom-scrollbar"
            connectionLineType={ConnectionLineType.SmoothStep}
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: "relationship",
              animated: false,
              style: { strokeWidth: 2 },
            }}
            panOnScroll={true}
            selectionOnDrag={true}
            panOnDrag={[1, 2]}
            selectNodesOnDrag={false}
          >
              <Background color="var(--muted-foreground)" gap={20} size={1} variant={"dots" as BackgroundVariant} />
            <Controls className="bg-card/90 backdrop-blur-sm border-border shadow-lg" />
            <MiniMap
              className="bg-card/90 backdrop-blur-sm border-border shadow-lg"
              nodeColor={(node) => {
                const colors = {
                  blue: "#3b82f6",
                  green: "#10b981",
                  purple: "#8b5cf6",
                  orange: "#f97316",
                  red: "#ef4444",
                  teal: "#14b8a6",
                  indigo: "#6366f1",
                  pink: "#ec4899",
                }
                return colors[node.data?.color as keyof typeof colors] || "#6366f1"
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
