#!/usr/bin/env python
import json
import sys
from pathlib import Path

# Step 1: Ensure graphify is installed
print("=" * 60)
print("STEP 1: Verify graphify installation")
print("=" * 60)
try:
    import graphify
    from graphify.detect import detect
    from graphify.extract import collect_files, extract
    from graphify.cache import check_semantic_cache
    from graphify.build import build_from_json
    from graphify.cluster import cluster
    from graphify.analyze import god_nodes, surprising_connections
    from graphify.report import generate
    from graphify.export import to_html
    from networkx.readwrite import json_graph
    import networkx as nx
    print("✓ graphify imported successfully")
except ImportError as e:
    print(f"✗ Import failed: {e}")
    print("Installing graphifyy...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "graphifyy", "-q"])
    print("Retrying import...")
    import graphify
    from graphify.detect import detect
    from graphify.extract import collect_files, extract
    from graphify.cache import check_semantic_cache
    from graphify.build import build_from_json
    from graphify.cluster import cluster
    from graphify.analyze import god_nodes, surprising_connections
    from graphify.report import generate
    from graphify.export import to_html
    from networkx.readwrite import json_graph
    import networkx as nx
    print("✓ graphify installed and imported")

# Create output directory
Path('graphify-out').mkdir(exist_ok=True)
Path('graphify-out/.graphify_python').write_text(sys.executable)

# Step 2: Detect files
print("\n" + "=" * 60)
print("STEP 2: Detect files")
print("=" * 60)
result = detect(Path('.'))
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(result, indent=2))
total = result.get('total_files', 0)
words = result.get('total_words', 0)
print(f'Corpus: {total} files, ~{words} words')
for ftype, files in result.get('files', {}).items():
    if files:
        print(f'  {ftype}: {len(files)} files')

if total == 0:
    print("\n✗ No supported files found in current directory")
    sys.exit(1)

if words > 2000000 or total > 200:
    print(f"\n⚠ Warning: Large corpus detected ({total} files, {words} words)")
    print("Please specify a subfolder to run on instead.")
    sys.exit(1)

# Step 3A: Structural extraction
print("\n" + "=" * 60)
print("STEP 3A: Structural extraction (AST)")
print("=" * 60)
detect_data = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
code_files = []
for f in detect_data.get('files', {}).get('code', []):
    p = Path(f)
    code_files.extend(collect_files(p) if p.is_dir() else [p])

if code_files:
    result = extract(code_files)
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2))
    print(f'✓ AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
else:
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
    print('No code files - skipping AST extraction')

# Step 3B: Semantic extraction cache check
print("\n" + "=" * 60)
print("STEP 3B: Semantic cache check")
print("=" * 60)
all_files = [f for files in detect_data['files'].values() for f in files]
cached_nodes, cached_edges, cached_hyperedges, uncached = check_semantic_cache(all_files)

if cached_nodes or cached_edges:
    Path('graphify-out/.graphify_cached.json').write_text(json.dumps({'nodes': cached_nodes, 'edges': cached_edges, 'hyperedges': cached_hyperedges}))
    print(f'✓ Cached results found')
else:
    print('✓ No cached results')

Path('graphify-out/.graphify_uncached.txt').write_text('\n'.join(uncached))
print(f'Cache status: {len(all_files)-len(uncached)} hit, {len(uncached)} need extraction')

if uncached:
    print(f"\n⚠ {len(uncached)} uncached files detected")
    print("Note: Semantic extraction requires API calls. Skipping semantic extraction.")
    print("Using structural extraction (AST) only.")

# Step 3C: Merge extractions
print("\n" + "=" * 60)
print("STEP 3C: Merge extractions")
print("=" * 60)
all_nodes, all_edges, all_hyperedges = [], [], []

ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())
all_nodes.extend(ast.get('nodes', []))
all_edges.extend(ast.get('edges', []))

cached_path = Path('graphify-out/.graphify_cached.json')
if cached_path.exists():
    cached = json.loads(cached_path.read_text())
    all_nodes.extend(cached.get('nodes', []))
    all_edges.extend(cached.get('edges', []))
    all_hyperedges.extend(cached.get('hyperedges', []))

merged = {'nodes': all_nodes, 'edges': all_edges, 'hyperedges': all_hyperedges, 'input_tokens': 0, 'output_tokens': 0}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2))
print(f'✓ Merged: {len(all_nodes)} nodes, {len(all_edges)} edges')

# Step 4: Build graph and cluster
print("\n" + "=" * 60)
print("STEP 4: Build graph and cluster")
print("=" * 60)
extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
G = build_from_json(extraction)
communities = cluster(G)
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

graph_data = json_graph.node_link_data(G)
Path('graphify-out/graph.json').write_text(json.dumps(graph_data, indent=2))
Path('graphify-out/.graphify_analysis.json').write_text(json.dumps({
    'communities': {str(k): v for k, v in communities.items()},
    'cohesion': {},
    'god_nodes': gods,
    'surprises': surprises,
}, indent=2))
print(f'✓ Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities')
if gods:
    print(f'✓ God nodes: {[g["label"] for g in gods[:5]]}')

# Step 5A: Generate report
print("\n" + "=" * 60)
print("STEP 5A: Generate report")
print("=" * 60)
extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
gods = god_nodes(G)
surprises = surprising_connections(G, communities)

report = generate(G, communities, {}, {}, gods, surprises, extraction)
Path('graphify-out/GRAPH_REPORT.md').write_text(report)
print('✓ GRAPH_REPORT.md written')

# Step 5B: Generate visualization
print("\n" + "=" * 60)
print("STEP 5B: Generate visualization")
print("=" * 60)
extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
G = build_from_json(extraction)
communities = cluster(G)

try:
    to_html(G, communities, 'graphify-out/graph.html')
    print('✓ graph.html written')
except ValueError as e:
    print(f'⚠ Visualization skipped: {e}')

# Final summary
print("\n" + "=" * 60)
print("graphify complete")
print("=" * 60)
print("  graph.json      — GraphRAG-ready, queryable by MCP or CLI")
print("  graph.html      — interactive visualization (open in browser)")
print("  GRAPH_REPORT.md — plain-language architecture summary")

# Read and display God Nodes and Surprising Connections
print("\n" + "=" * 60)
print("REPORT SECTIONS")
print("=" * 60)
report_text = Path('graphify-out/GRAPH_REPORT.md').read_text()
print(report_text)
