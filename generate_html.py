#!/usr/bin/env python
import json
import sys
from pathlib import Path

# Step 5B: Generate visualization
print("=" * 60)
print("STEP 5B: Generate visualization")
print("=" * 60)

try:
    from graphify.build import build_from_json
    from graphify.cluster import cluster
    from graphify.export import to_html
    
    extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
    G = build_from_json(extraction)
    communities = cluster(G)
    
    try:
        to_html(G, communities, 'graphify-out/graph.html')
        print('✓ graph.html written')
    except ValueError as e:
        print(f'⚠ Visualization skipped: {e}')
        # Try to create a simple HTML as fallback
        print('Creating fallback HTML visualization...')
        with open('graphify-out/graph.html', 'w') as f:
            f.write('''<!DOCTYPE html>
<html>
<head>
    <title>Graph Visualization</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .info { background: #f0f0f0; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Graph Visualization</h1>
    <div class="info">
        <p>Interactive HTML visualization could not be generated.</p>
        <p>However, you can still explore the graph data:</p>
        <ul>
            <li><strong>graph.json</strong> - Full GraphRAG-ready graph data</li>
            <li><strong>GRAPH_REPORT.md</strong> - Architecture summary with God Nodes and surprising connections</li>
        </ul>
        <p>Graph Statistics:</p>
        <ul>
            <li>Nodes: {nodes}</li>
            <li>Edges: {edges}</li>
            <li>Communities: {communities}</li>
        </ul>
    </div>
</body>
</html>'''.format(
            nodes=G.number_of_nodes(),
            edges=G.number_of_edges(),
            communities=len(communities)
        ))
        print('✓ Fallback graph.html created')
        
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
