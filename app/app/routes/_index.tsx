import type { V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import type { Connection } from "reactflow";
import { ControlButton } from "reactflow";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import { prisma } from "~/db.server";
import "reactflow/dist/style.css";

import { useCallback, useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import NodeForm from "~/components/NodeForm";
import { graphCircularValidate } from "~/services/validators/graphCircularValidate";
import type { action as directedEdgesAction } from "./directedEdges";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async () => {
  const nodes = await prisma.nodeData.findMany();
  const directedEdges = await prisma.directedEdgeData.findMany();
  return json({
    nodes,
    directedEdges,
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof directedEdgesAction>();

  const nodesToRender = data.nodes
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((node, i) => {
      return {
        id: node.id,
        position: { x: 80, y: 20 + 100 * i },
        data: { label: node.name + "\n" + node.id, name: node.name },
      };
    });

  const directedEdgesToRender = data.directedEdges.map((edge) => {
    return {
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      animated: true,
      markerEnd: {
        type: MarkerType.Arrow,
      },
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesToRender);
  const [edges, setEdges, onEdgesChange] = useEdgesState(directedEdgesToRender);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newFromNodeId = connection.source;
      const newToNodeId = connection.target;
      if (newFromNodeId === null || newToNodeId === null) {
        return;
      }

      const existingEdges = edges.flatMap((e) => {
        if (e.source === null || e.target === null) {
          return [];
        }

        return {
          fromNodeId: e.source,
          toNodeId: e.target,
        };
      });

      const { valid, hitNodeId } = graphCircularValidate(
        {
          fromNodeId: newFromNodeId,
          toNodeId: newToNodeId,
        },
        existingEdges
      );
      if (valid) {
        setEdges((eds) => {
          fetcher.submit(
            {
              fromNodeId: newFromNodeId,
              toNodeId: newToNodeId,
            },
            {
              method: "post",
              action: "/directedEdges",
            }
          );
          return addEdge(
            {
              id: "creating",
              ...connection,
              animated: true,
              markerEnd: {
                type: MarkerType.Arrow,
              },
            },
            eds
          );
        });
      } else {
        alert(`circular found nodeId: ${hitNodeId}`);
      }
    },
    [fetcher, edges, setEdges]
  );

  useEffect(() => {
    const featchResult = fetcher.data;
    if (!featchResult) {
      return;
    }
    if ("data" in featchResult) {
      const newEdgeData = featchResult.data;
      setEdges((eds) => {
        const edgesWithoutCreating = eds.filter((e) => {
          return e.id !== "creating";
        });
        return addEdge(
          {
            id: newEdgeData.id,
            source: newEdgeData.fromNodeId,
            target: newEdgeData.toNodeId,
            animated: true,
            markerEnd: {
              type: MarkerType.Arrow,
            },
          },
          edgesWithoutCreating
        );
      });
    } else {
      setEdges((eds) => {
        return eds.filter((e) => {
          return e.id !== "creating";
        });
      });
      if ("message" in featchResult) {
        alert(featchResult.message);
      }
    }
  }, [fetcher.data, setEdges]);

  const createNewNode = (node: any) => {
    const newNode = {
      id: node.id,
      position: { x: 20, y: 20 },
      data: { label: node.name + "\n" + node.id, name: node.name },
    };
    setNodes([...nodes, newNode]);
    nodes.push(newNode);
  };

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div style={{ width: "100vw", height: "100vh" }}>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Node</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <NodeForm
                updateCallback={(data) => {
                  createNewNode(data);
                  onClose();
                }}
              ></NodeForm>
            </ModalBody>
          </ModalContent>
        </Modal>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Controls>
            <ControlButton onClick={onOpen} title="action">
              <div>C</div>
            </ControlButton>
          </Controls>
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </main>
  );
}
