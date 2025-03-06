/**
 * This function processes a relational graph structure containing nodes and edges. 
 * It assigns a `row` property to each node based on its position
 * in the hierarchy, ensuring that nodes connected by edges are placed in sequential rows.
 * The function also ensures that no node is placed in a row equal to or above its connected nodes.
 * The final output is a transformed graph structure with nodes containing their assigned `row` properties.
 */

const addEdgeRowPropertiesToNodes = (treeData) => {
    const nodeMap = {};
    treeData.nodes.forEach((node) => {
        nodeMap[node.name] = { ...node, edges: [] };
    });

    // Populate edges for each node and filter edges
    treeData.edges.forEach((edge) => {
        const sourceNode = nodeMap[edge.source];
        sourceNode.edges.push(edge);
    });

    // Assign row property
    function assignRow(nodeName, rowNumber) {
        const node = nodeMap[nodeName];
        if (!node.row) {
            nodeMap[nodeName] = { ...node, row: `row${rowNumber}` };
            const nextNodes = treeData.edges.filter((edge) => edge.target === nodeName);
            nextNodes.forEach((nextNode) => {
                assignRow(nextNode.source, rowNumber + 1);
            });
        }
    }

    assignRow("lead_time", 1);

    let adjusted = true;
    while (adjusted) {
        adjusted = false;
        for (let i = 0; i < treeData.edges.length; i += 1) {
            const edge = treeData.edges[i];
            const sourceNode = nodeMap[edge.source];
            const targetNode = nodeMap[edge.target];
            if (sourceNode.row <= targetNode.row) {
                sourceNode.row = `row${parseInt(targetNode.row.substring(3), 10) + 1}`;
                adjusted = true;
                break;
            }
        }
    }

    const transformedNodes = Object.values(nodeMap);

    const transformedTreeData = {
        nodes: transformedNodes,
    };
    return transformedTreeData;
};

export default addEdgeRowPropertiesToNodes;
