type DirectedEdgeWithNodeIds = {
  fromNodeId: string;
  toNodeId: string;
};

export const graphCircularValidate = (
  newDirectedEdge: DirectedEdgeWithNodeIds,
  existingDirectedEdges: DirectedEdgeWithNodeIds[]
) => {
  let searchNodeIdStack = [newDirectedEdge.fromNodeId];
  let searchNodeIdSet = new Set([newDirectedEdge.fromNodeId]);

  let finishedNodeIdSet: Set<string> = new Set();

  const fromNodeToNodeIdMappingJson = [
    newDirectedEdge,
    ...existingDirectedEdges,
  ].reduce((acc: { [key: string]: string[] }, edge) => {
    if (acc[edge.fromNodeId]) {
      acc[edge.fromNodeId].push(edge.toNodeId);
    } else {
      acc[edge.fromNodeId] = [edge.toNodeId];
    }
    return acc;
  }, {});

  while (true) {
    const targetNodeId = searchNodeIdStack.pop();

    if (targetNodeId) {
      const nextNodeIds = fromNodeToNodeIdMappingJson[targetNodeId];
      if (nextNodeIds === undefined || nextNodeIds.length === 0) {
        // 深さ優先で、最深まで行ってた場合
        finishedNodeIdSet.add(targetNodeId);
        searchNodeIdSet.delete(targetNodeId);
      } else {
        let foundNextNode = false;
        for (const nodeId of nextNodeIds) {
          if (searchNodeIdSet.has(nodeId)) {
            return {
              valid: false,
              hitNodeId: nodeId,
            };
          } else if (!finishedNodeIdSet.has(nodeId)) {
            searchNodeIdStack.push(targetNodeId);
            searchNodeIdStack.push(nodeId);
            searchNodeIdSet.add(nodeId);
            foundNextNode = true;
            break;
          }
        }
        if (!foundNextNode) {
          finishedNodeIdSet.add(targetNodeId);
          searchNodeIdSet.delete(targetNodeId);
        }
      }
    } else {
      break;
    }
  }
  return {
    valid: true,
  };
};
