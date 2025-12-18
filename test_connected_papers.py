from connectedpapers import ConnectedPapersClient
import json

DEEPFRUITS_PAPER_ID = "9397e7acd062245d37350f5c05faf56e9cfae0d6"

try:
    client = ConnectedPapersClient(access_token="TEST_TOKEN")
    graph = client.get_graph_sync(DEEPFRUITS_PAPER_ID)
    
    g_json = graph.graph_json
    
    print("Graph Keys:", list(g_json.__dict__.keys()))
    
    if hasattr(g_json, 'nodes'):
        nodes = g_json.nodes
        print(f"\nNodes count: {len(nodes)}")
        print("Nodes Type:", type(nodes))
        
        if len(nodes) > 0:
            # Get the first item
            if isinstance(nodes, dict):
                first_key = list(nodes.keys())[0]
                node = nodes[first_key]
                print(f"Sample Node (Key: {first_key}):")
            else:
                node = nodes[0]
                print("Sample Node:")
                
            print("Sample Node Type:", type(node))
            if hasattr(node, '__dict__'):
                print("Sample Node Attributes:", node.__dict__)
            else:
                print("Sample Node:", node)

    if hasattr(g_json, 'edges'):
        edges = g_json.edges
        print(f"\nEdges count: {len(edges)}")
        print("Edges Type:", type(edges))
        
        if len(edges) > 0:
            if isinstance(edges, dict):
                first_key = list(edges.keys())[0]
                edge = edges[first_key]
                print(f"Sample Edge (Key: {first_key}):")
            else:
                edge = edges[0]
                print("Sample Edge:")
                
            print("Sample Edge Type:", type(edge))
            if hasattr(edge, '__dict__'):
                print("Sample Edge Attributes:", edge.__dict__)
            else:
                print("Sample Edge:", edge)

except Exception as e:
    import traceback
    traceback.print_exc()
