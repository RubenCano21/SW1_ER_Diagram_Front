// components/er-diagram-tool.tsx
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
import {Database, Download, Plus, Share2, Sparkles, Upload, Save, FolderOpen, Code2, Settings} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import EntityNode from "./entity-node"
import RelationshipEdge from "./relationship-edge"
import ClassNode from "./class-node"
import Sidebar from "./sidebar"
import {Button} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  color: string
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

// Configuración de persistencia local
const STORAGE_KEYS = {
  PROJECTS: 'erd_projects',
  CURRENT_PROJECT: 'erd_current_project',
  SETTINGS: 'erd_settings'
}

const entityColors = ["blue", "green", "purple", "orange", "red", "teal", "indigo", "pink"]

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

const nodeTypes: NodeTypes = {
  entity: EntityNode,
  class: ClassNode,
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
  const [projectName, setProjectName] = useState("Nuevo Proyecto")
  const [isModified, setIsModified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [modelType, setModelType] = useState<"conceptual" | "logical" | "physical">("physical")
  const [diagramType, setDiagramType] = useState<"er" | "class">("er")

  // Estados para manejo de proyectos
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [savedProjects, setSavedProjects] = useState<any[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showCodeGenDialog, setShowCodeGenDialog] = useState(false)
  const [saveAsName, setSaveAsName] = useState("")
  const [projectToLoad, setProjectToLoad] = useState<string>("")

  // Estados para generación de código
  const [codeGenSettings, setCodeGenSettings] = useState({
    projectName: "",
    packageName: "com.example.project",
    framework: "spring-boot",
    javaVersion: "17"
  })

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  // Cargar proyectos guardados al inicializar
  useEffect(() => {
    loadSavedProjects()
    loadCurrentProject()
  }, [])

  // Auto-guardar cada 30 segundos si hay cambios
  useEffect(() => {
    if (isModified && currentProjectId) {
      const autoSaveInterval = setInterval(() => {
        autoSaveProject()
      }, 30000) // 30 segundos

      return () => clearInterval(autoSaveInterval)
    }
  }, [isModified, currentProjectId, nodes, edges, projectName])

  const loadSavedProjects = () => {
    try {
      const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS)
      if (projects) {
        setSavedProjects(JSON.parse(projects))
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadCurrentProject = () => {
    try {
      const currentProject = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT)
      if (currentProject) {
        const project = JSON.parse(currentProject)
        setCurrentProjectId(project.id)
        setProjectName(project.name)
        setNodes(project.nodes || [])
        setEdges(project.edges || [])
        setModelType(project.modelType || "physical")
        setDiagramType(project.diagramType || "er")
        setIsModified(false)
      }
    } catch (error) {
      console.error('Error loading current project:', error)
    }
  }

  const autoSaveProject = useCallback(() => {
    if (!currentProjectId || !isModified) return

    const projectData = {
      id: currentProjectId,
      name: projectName,
      modelType,
      diagramType,
      lastModified: new Date().toISOString(),
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

    try {
      // Guardar proyecto actual
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(projectData))
      
      // Actualizar en la lista de proyectos
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]')
      const updatedProjects = projects.map((p: any) => 
        p.id === currentProjectId ? projectData : p
      )
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects))
      setSavedProjects(updatedProjects)
      
      setIsModified(false)
      
      toast({
        title: "💾 Auto-guardado completado",
        description: "El proyecto se guardó automáticamente",
      })
    } catch (error) {
      console.error('Error auto-saving project:', error)
    }
  }, [currentProjectId, isModified, projectName, modelType, diagramType, nodes, edges, toast])

  const saveProject = useCallback((name: string, saveAs: boolean = false) => {
    const projectId = saveAs || !currentProjectId ? `project-${Date.now()}` : currentProjectId
    const projectData = {
      id: projectId,
      name: name,
      modelType,
      diagramType,
      createdAt: !currentProjectId ? new Date().toISOString() : undefined,
      lastModified: new Date().toISOString(),
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

    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]')
      let updatedProjects

      if (saveAs || !currentProjectId) {
        // Nuevo proyecto o guardar como
        updatedProjects = [...projects, projectData]
      } else {
        // Actualizar proyecto existente
        updatedProjects = projects.map((p: any) => p.id === projectId ? projectData : p)
      }

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects))
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(projectData))
      
      setSavedProjects(updatedProjects)
      setCurrentProjectId(projectId)
      setProjectName(name)
      setIsModified(false)
      setShowSaveDialog(false)

      toast({
        title: "💾 Proyecto guardado",
        description: `"${name}" se guardó correctamente en el navegador`,
      })
    } catch (error) {
      console.error('Error saving project:', error)
      toast({
        title: "❌ Error al guardar",
        description: "No se pudo guardar el proyecto",
        variant: "destructive",
      })
    }
  }, [currentProjectId, projectName, modelType, diagramType, nodes, edges, toast])

  const loadProject = useCallback((projectId: string) => {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]')
      const project = projects.find((p: any) => p.id === projectId)
      
      if (project) {
        setCurrentProjectId(project.id)
        setProjectName(project.name)
        setNodes(project.nodes || [])
        setEdges(project.edges || [])
        setModelType(project.modelType || "physical")
        setDiagramType(project.diagramType || "er")
        setSelectedEntity(null)
        setSelectedEdge(null)
        setIsModified(false)
        setShowLoadDialog(false)

        // Guardar como proyecto actual
        localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(project))

        toast({
          title: "📂 Proyecto cargado",
          description: `"${project.name}" se cargó correctamente`,
        })
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast({
        title: "❌ Error al cargar",
        description: "No se pudo cargar el proyecto",
        variant: "destructive",
      })
    }
  }, [setNodes, setEdges, toast])

  const deleteProject = useCallback((projectId: string) => {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]')
      const updatedProjects = projects.filter((p: any) => p.id !== projectId)
      
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects))
      setSavedProjects(updatedProjects)

      if (currentProjectId === projectId) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
        createNewProject()
      }

      toast({
        title: "🗑️ Proyecto eliminado",
        description: "El proyecto se eliminó correctamente",
      })
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }, [currentProjectId])

  // Función para generar código Java
  const generateJavaCode = useCallback(async () => {
    if (nodes.length === 0) {
      toast({
        title: "❌ Sin entidades",
        description: "Necesitas al menos una entidad para generar código",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Preparar datos para el backend
      const erdJson = {
        projectName: codeGenSettings.projectName || projectName,
        packageName: codeGenSettings.packageName,
        framework: codeGenSettings.framework,
        javaVersion: codeGenSettings.javaVersion,
        entities: nodes.map(node => {
          const entityData = node.data as unknown as EntityData
          return {
            name: entityData.name,
            attributes: entityData.attributes.map(attr => ({
              name: attr.name,
              type: mapDataTypeToJava(attr.type),
              primary: attr.isPrimaryKey,
              foreignKey: attr.isForeignKey ? `${attr.name.replace('_id', '').replace('Id', '')}.id` : null,
              nullable: !attr.isRequired,
              unique: attr.name === 'email' || attr.name.toLowerCase().includes('email')
            }))
          }
        }),
        relationships: edges.map(edge => {
          const relationshipData = edge.data as unknown as RelationshipData
          const sourceNode = nodes.find(n => n.id === edge.source)
          const targetNode = nodes.find(n => n.id === edge.target)
          
          return {
            from: (sourceNode?.data as unknown as EntityData)?.name,
            to: (targetNode?.data as unknown as EntityData)?.name,
            type: mapRelationshipType(relationshipData.type),
            sourceCardinality: relationshipData.sourceCardinality,
            targetCardinality: relationshipData.targetCardinality
          }
        })
      }

      const requestPayload = {
        erdJson: JSON.stringify(erdJson),
        projectName: codeGenSettings.projectName || projectName
      }
      // Llamar al backend
      const response = await fetch(`${API_BASE_URL}/generator/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          erdJson: JSON.stringify(erdJson),
          projectName: codeGenSettings.projectName || projectName
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Obtener el archivo ZIP
      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${codeGenSettings.projectName || projectName}.zip`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Descargar el archivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setShowCodeGenDialog(false)
      setIsLoading(false)

      toast({
        title: "🚀 Código generado exitosamente",
        description: `Proyecto "${filename}" descargado en tu carpeta de Descargas`,
      })

    } catch (error) {
      setIsLoading(false)
      console.error('Error generating code:', error)
      
      let errorMessage = 'Error desconocido al generar el código'
      
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorMessage = 'Datos del diagrama inválidos. Revisa las entidades y relaciones.'
        } else if (error.message.includes('500')) {
          errorMessage = 'Error interno del servidor. Intenta nuevamente.'
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'No se puede conectar al servidor. Verifica que esté ejecutándose.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "❌ Error al generar código",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [nodes, edges, projectName, codeGenSettings, API_BASE_URL, toast])

  // Funciones auxiliares para mapear tipos de datos
  const mapDataTypeToJava = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'INTEGER': 'Long',
      'VARCHAR': 'String',
      'TEXT': 'String',
      'BOOLEAN': 'Boolean',
      'DATE': 'LocalDate',
      'DATETIME': 'LocalDateTime',
      'DECIMAL': 'BigDecimal',
      'FLOAT': 'Double'
    }
    return typeMap[type.toUpperCase()] || 'String'
  }

  const mapRelationshipType = (type: string) => {
    const relationMap: { [key: string]: string } = {
      'uno a uno': 'OneToOne',
      'uno a muchos': 'OneToMany',
      'muchos a uno': 'ManyToOne',
      'muchos a muchos': 'ManyToMany'
    }
    return relationMap[type.toLowerCase()] || 'OneToMany'
  }

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const exportProject = useCallback(() => {
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

    toast({
      title: "✨ Proyecto exportado",
      description: `${projectName} se guardó como archivo JSON`,
    })
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
            throw new Error("Formato de archivo no válido")
          }

          setTimeout(() => {
            setProjectName(projectData.name || "Proyecto Importado")
            setNodes(projectData.nodes)
            setEdges(projectData.edges)
            setSelectedEntity(null)
            setSelectedEdge(null)
            setIsModified(true)
            setCurrentProjectId(null)
            setIsLoading(false)

            toast({
              title: "🎉 Proyecto importado",
              description: `${projectData.name || "Project"} listo para editar`,
            })
          }, 300)
        } catch (error) {
          setIsLoading(false)
          toast({
            title: "❌ Importación fallida",
            description: "El formato del archivo no es válido",
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
      const confirmed = window.confirm("Tienes cambios sin guardar. ¿Quieres crear un nuevo proyecto?")
      if (!confirmed) return
    }

    setIsLoading(true)

    setTimeout(() => {
      setProjectName("Nuevo proyecto")
      setNodes([])
      setEdges([])
      setSelectedEntity(null)
      setSelectedEdge(null)
      setIsModified(false)
      setCurrentProjectId(null)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
      setIsLoading(false)

      toast({
        title: "✨ Nuevo proyecto creado",
        description: "Listo para diseñar tu modelo de datos",
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
          title: "🔗 Enlace copiado",
          description: "El enlace del proyecto está listo para compartir",
        })
      })
      .catch(() => {
        toast({
          title: "🔗 Enlace generado",
          description: "Copia la URL de tu navegador para compartir",
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
          type: "asociación",
          label: "relaciona con",
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
      const buffer = 20

      return nodes.some((node) => {
        if (node.id === nodeId) return false

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
        title: "🎯 Nueva Clase",
        description: `Nueva clase con tema ${assignedColor} creada`,
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
        title: "🎯 Entidad agregada",
        description: `Nueva entidad con tema ${assignedColor} creada`,
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
            <span className="text-sm font-medium text-foreground">Procesando...</span>
          </div>
        </div>
      )}

      {/* Dialog para guardar proyecto */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Proyecto</DialogTitle>
            <DialogDescription>
              Ingresa un nombre para guardar tu proyecto localmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nombre del proyecto</Label>
              <Input
                id="projectName"
                value={saveAsName || projectName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Mi Proyecto ER"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => saveProject(saveAsName || projectName, !!saveAsName)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para cargar proyecto */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Proyecto</DialogTitle>
            <DialogDescription>
              Selecciona un proyecto guardado para continuar trabajando
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {savedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay proyectos guardados
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      projectToLoad === project.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setProjectToLoad(project.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.nodes?.length || 0} entidades • {project.edges?.length || 0} relaciones
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project.lastModified ? 
                            `Modificado: ${new Date(project.lastModified).toLocaleDateString()}` :
                            `Creado: ${new Date(project.createdAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`¿Eliminar el proyecto "${project.name}"?`)) {
                            deleteProject(project.id)
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => loadProject(projectToLoad)} 
              disabled={!projectToLoad}
            >
              Cargar Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para generación de código */}
      <Dialog open={showCodeGenDialog} onOpenChange={setShowCodeGenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Código Java</DialogTitle>
            <DialogDescription>
              Configura los parámetros para generar tu proyecto Spring Boot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codeProjectName">Nombre del proyecto</Label>
              <Input
                id="codeProjectName"
                value={codeGenSettings.projectName || projectName}
                onChange={(e) => setCodeGenSettings(prev => ({...prev, projectName: e.target.value}))}
                placeholder="mi-proyecto-spring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageName">Nombre del paquete</Label>
              <Input
                id="packageName"
                value={codeGenSettings.packageName}
                onChange={(e) => setCodeGenSettings(prev => ({...prev, packageName: e.target.value}))}
                placeholder="com.example.project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select 
                value={codeGenSettings.framework} 
                onValueChange={(value) => setCodeGenSettings(prev => ({...prev, framework: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring-boot">Spring Boot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="javaVersion">Versión de Java</Label>
              <Select 
                value={codeGenSettings.javaVersion} 
                onValueChange={(value) => setCodeGenSettings(prev => ({...prev, javaVersion: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Java 11</SelectItem>
                  <SelectItem value="17">Java 17</SelectItem>
                  <SelectItem value="21">Java 21</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Se generarán:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {nodes.length} Entidades con JPA</li>
                <li>• {nodes.length} DTOs</li>
                <li>• {nodes.length} Repositorios</li>
                <li>• {nodes.length} Servicios</li>
                <li>• {nodes.length} Controladores REST</li>
                <li>• Mappers con MapStruct</li>
                <li>• Configuración completa del proyecto</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeGenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={generateJavaCode} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Code2 className="h-4 w-4 mr-2" />
                  Generar Código
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        entities={nodes.map((node) => node.data as unknown as EntityData).filter((data) => data.name)}
        onSelectEntity={(entityId: string) => {
          setSelectedEntity(entityId)
          setSelectedEdge(null)
          const selectedNode = nodes.find((node) => node.id === entityId)
          if (selectedNode) {
            console.log("[v0] Focusing on entity:", selectedNode.data.name)
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
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">ER Diagrama</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{projectName}</span>
                    {isModified && <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />}
                    {currentProjectId && <span className="text-xs text-muted-foreground">• Guardado</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewProject}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSaveAsName("")
                    setShowSaveDialog(true)
                  }}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoadDialog(true)}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <FolderOpen className="h-4 w-4" />
                  Cargar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={importProject}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportProject}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCodeGenSettings(prev => ({
                      ...prev,
                      projectName: projectName
                    }))
                    setShowCodeGenDialog(true)
                  }}
                  className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                  disabled={nodes.length === 0}
                >
                  <Code2 className="h-4 w-4" />
                  Generar Java
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareProject}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Diagrama:</span>
                  <select
                    value={diagramType}
                    onChange={(e) => setDiagramType(e.target.value as "er" | "class")}
                    className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                  >
                    <option value="er">ER Diagrama</option>
                    <option value="class">Diagrama de Clases</option>
                  </select>
                </div>

                {diagramType === "er" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Modelo:</span>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value as "conceptual" | "logical" | "physical")}
                      className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                    >
                      <option value="conceptual">Conceptual</option>
                      <option value="logical">Lógico</option>
                      <option value="physical">Físico</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                  <Badge
                    variant="outline"
                    className="text-xs bg-card/50 text-foreground border-border hover:bg-accent/10 transition-colors"
                  >
                    {nodes.length} {diagramType === "class" ? "Classes" : "Entities"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-card/50 text-foreground border-border hover:bg-accent/10 transition-colors"
                  >
                    {edges.length} Relaciones
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