"use client"
import { type EdgeProps, getBezierPath, getSmoothStepPath, getStraightPath } from "@xyflow/react"
import type {RelationshipData} from "./er-diagram-tool"

interface RelationshipEdgeProps extends EdgeProps {
  data?: RelationshipData & Record<string, unknown>
}

export default function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: RelationshipEdgeProps) {
  const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2))
  const isClose = distance < 150

  let edgePath, labelX, labelY

  if (isClose) {
    // Use straight path for close entities
    ;[edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    })
  } else if (Math.abs(sourceX - targetX) > Math.abs(sourceY - targetY)) {
    // Use smooth step for horizontal connections
    ;[edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    })
  } else {
    // Use bezier for diagonal connections
    ;[edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.2,
    })
  }

  const getMarkerEnd = () => {
    switch (data?.type) {
      case "association":
        return "url(#association)"
      case "composition":
        return "url(#composition)"
      case "aggregation":
        return "url(#aggregation)"
      case "generalization":
        return "url(#generalization)"
      case "dependency":
        return "url(#dependency)"
      case "one-to-one":
        return "url(#one-to-one)"
      case "one-to-many":
        return "url(#one-to-many)"
      case "many-to-many":
        return "url(#many-to-many)"
      default:
        return "url(#association)"
    }
  }

  const getStrokeStyle = () => {
    switch (data?.type) {
      case "dependency":
        return "6,3" // línea punteada más visible
      case "generalization":
        return "none"
      default:
        return "none"
    }
  }

  const getStrokeWidth = () => {
    if (selected) return "4" // Increased stroke width for better visibility
    switch (data?.type) {
      case "composition":
      case "aggregation":
        return "3" // Increased from 2.5 to 3 for better contrast
      case "generalization":
        return "3" // Increased from 2 to 3 for better contrast
      default:
        return "3" // Increased from 2 to 3 for better contrast
    }
  }

  const getStrokeColor = () => {
    if (selected) return "#000000" // Black for selected
    return "#000000" // Black for all relationship lines
  }

  return (
    <>
      <defs>
        <marker
          id="association"
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M2,2 L2,12 L12,7 z" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth="1" />
        </marker>

        <marker
          id="composition"
          markerWidth="18"
          markerHeight="14"
          refX="16"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M2,7 L9,2 L16,7 L9,12 z"
            fill="hsl(var(--destructive))"
            stroke="hsl(var(--destructive))"
            strokeWidth="1.5"
          />
        </marker>

        <marker
          id="aggregation"
          markerWidth="18"
          markerHeight="14"
          refX="16"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M2,7 L9,2 L16,7 L9,12 z"
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </marker>

        <marker
          id="generalization"
          markerWidth="16"
          markerHeight="14"
          refX="14"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M2,2 L14,7 L2,12 z"
            fill="hsl(var(--background))"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth="2"
          />
        </marker>

        <marker
          id="dependency"
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M2,2 L2,12 L12,7 z" fill="hsl(var(--muted-foreground))" />
        </marker>

        <marker
          id="one-to-one"
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M2,2 L2,12 L12,7 z" fill="hsl(var(--primary))" />
          <text x="16" y="7" className="text-xs fill-primary" textAnchor="start" dominantBaseline="middle">
            1
          </text>
        </marker>

        <marker
          id="one-to-many"
          markerWidth="20"
          markerHeight="14"
          refX="12"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M2,2 L2,12 L12,7 z" fill="hsl(var(--primary))" />
          <text x="16" y="7" className="text-xs fill-primary font-bold" textAnchor="start" dominantBaseline="middle">
            ∞
          </text>
        </marker>

        <marker
          id="many-to-many"
          markerWidth="24"
          markerHeight="14"
          refX="12"
          refY="7"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <circle cx="6" cy="7" r="3" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          <circle cx="18" cy="7" r="3" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        </marker>
      </defs>

      <path
        id={id}
        className={`relationship-edge ${selected ? "selected" : ""}`}
        d={edgePath}
        markerEnd={getMarkerEnd()}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        strokeDasharray={getStrokeStyle()}
        style={{
          filter: selected ? "drop-shadow(0 0 6px hsl(var(--ring)))" : "none",
        }}
      />

      {data?.sourceCardinality && (
        <g>
          <text
            x={sourceX + (labelX - sourceX) * 0.15}
            y={sourceY + (labelY - sourceY) * 0.15}
            className="text-xs fill-black font-bold"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ textShadow: "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white" }}
          >
            {data.sourceCardinality}
          </text>
        </g>
      )}

      {data?.targetCardinality && (
        <g>
          <text
            x={targetX + (labelX - targetX) * 0.15}
            y={targetY + (labelY - targetY) * 0.15}
            className="text-xs fill-black font-bold"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ textShadow: "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white" }}
          >
            {data.targetCardinality}
          </text>
        </g>
      )}

      {data?.label && (
        <g>
          <rect
            x={labelX - data.label.length * 3}
            y={labelY - 10}
            width={data.label.length * 6}
            height="20"
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            rx="6"
          />
          <text
            x={labelX}
            y={labelY}
            className="text-xs fill-foreground font-medium"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {data.label}
          </text>
        </g>
      )}
    </>
  )
}
