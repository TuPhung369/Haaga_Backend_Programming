import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@mui/material";
import dagre from "dagre";

// Custom node for entities (rectangles)
const EntityNode = ({ data }: { data: { label: string } }) => (
  <div
    style={{
      padding: "10px 20px",
      border: "2px solid #1e3a8a",
      borderRadius: "5px",
      background: "#f8fafc",
      fontWeight: "bold",
      color: "#1e3a8a"
    }}
  >
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    {data.label}
  </div>
);

// Custom node for relationships (diamonds)
const RelationshipNode = ({ data }: { data: { label: string } }) => (
  <div
    style={{
      padding: "5px 15px",
      border: "2px solid #7c3aed",
      background: "#e3e3e3",
      transform: "rotate(45deg)",
      fontWeight: "bold",
      color: "#7c3aed"
    }}
  >
    <Handle
      type="target"
      position={Position.Top}
      id="top"
      style={{ transform: "rotate(-45deg)" }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom"
      style={{ transform: "rotate(-45deg)" }}
    />
    <span style={{ transform: "rotate(-45deg)", display: "block" }}>
      {data.label}
    </span>
  </div>
);

// Custom node for decision (diamond)
const DecisionNode = ({ data }: { data: { label: string } }) => (
  <div
    style={{
      padding: "15px",
      border: "2px solid #0ea5e9",
      borderRadius: "2px",
      background: "#f0f9ff",
      width: "100px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      color: "#0c4a6e",
      transform: "rotate(0deg)"
    }}
  >
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Right} id="right" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="source" position={Position.Left} id="left" />
    <div>{data.label}</div>
  </div>
);

// Custom node for tree nodes (circles)
const TreeNode = ({ data }: { data: { label: string } }) => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "#bae6fd",
      border: "2px solid #1890ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      color: "#1e293b"
    }}
  >
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    {data.label}
  </div>
);

const nodeTypes = {
  entity: EntityNode,
  relationship: RelationshipNode,
  treeNode: TreeNode,
  decision: DecisionNode,
  default: EntityNode
};

// Auto-layout function using dagre
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75, // Adjust for node width
        y: nodeWithPosition.y - 25 // Adjust for node height
      }
    };
  });

  // Add source and target handles to edges if they don't have them
  const layoutedEdges = edges.map((edge) => {
    // If edge doesn't have sourceHandle or targetHandle set
    return {
      ...edge,
      sourceHandle: edge.sourceHandle || "bottom", // Default to bottom handle for source
      targetHandle: edge.targetHandle || "top" // Default to top handle for target
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

interface FlowDiagramProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

const FlowDiagram: React.FC<FlowDiagramProps> = ({
  initialNodes,
  initialEdges
}) => {
  const [isEditable, setIsEditable] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Process initialEdges to add required handles if missing
  const processedInitialEdges = React.useMemo(() => {
    return initialEdges.map((edge) => ({
      ...edge,
      sourceHandle: edge.sourceHandle || "bottom",
      targetHandle: edge.targetHandle || "top"
    }));
  }, [initialEdges]);

  // Apply auto-layout on initial render
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      processedInitialEdges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, processedInitialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newNode = {
      id: `${nodes.length + 1}`,
      type: "entity", // Default to entity type
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: `Node ${nodes.length + 1}` }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div style={{ width: "100%", height: "400px", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? onNodesChange : undefined}
        onEdgesChange={isEditable ? onEdgesChange : undefined}
        onConnect={isEditable ? onConnect : undefined}
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
        <Button
          variant="contained"
          onClick={() => setIsEditable((prev) => !prev)}
          style={{ marginRight: "10px" }}
        >
          {isEditable ? "Switch to Read-Only" : "Edit Diagram"}
        </Button>
        {isEditable && (
          <Button variant="contained" onClick={addNode}>
            Add Node
          </Button>
        )}
      </div>
    </div>
  );
};

export default FlowDiagram;
