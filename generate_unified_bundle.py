import json
import os
import csv
import hashlib

BUNDLE_DIR = "public/credit_case_ai_bundle"

def generate_id(name):
    return f"m_{hashlib.md5(name.encode('utf-8')).hexdigest()[:8]}"

def load_tsv(filename):
    path = os.path.join(BUNDLE_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: {path} not found")
        return []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        return list(reader)

def load_json(filename):
    path = os.path.join(BUNDLE_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: {path} not found")
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_text(filename):
    path = os.path.join(BUNDLE_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: {path} not found")
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def generate_unified_bundle():
    # 1. Load Raw Data
    nodes_data = load_tsv("credit_case_nodes_ai.tsv")
    nodes_info = load_tsv("credit_case_nodes_ai_info.tsv")
    edges_data = load_tsv("credit_case_edges_ai.tsv")
    case_record = load_json("case_record.json")
    material_priority = load_json("material_priority.json")
    annotations = load_json("case_annotations.json")
    ftree_content = load_text("credit_case_ai_fact_graph.ftree")

    # 2. Process Nodes (Facts)
    # Merge node data and info
    nodes_map = {}
    
    # Initialize with basic node data
    for node in nodes_data:
        fact_id = node.get('fact_id')
        if fact_id:
            nodes_map[fact_id] = node.copy()
            # Ensure extracted_facts list exists
            nodes_map[fact_id]['related_materials'] = []

    # Merge info data
    for info in nodes_info:
        fact_id = info.get('fact_id')
        if fact_id and fact_id in nodes_map:
            nodes_map[fact_id].update(info)

    # 3. Process Materials
    # Extract materials from case_record and link to facts
    materials = []
    
    # Assuming case_record has a structure we can extract materials from
    # Or we construct materials list from the 'primary_source' / 'secondary_source' in nodes
    
    # Let's look at material_priority to see defined materials
    material_lookup = {}
    
    # Handle both list and dict format for material_priority
    materials_list = []
    if isinstance(material_priority, list):
        materials_list = material_priority
    elif isinstance(material_priority, dict) and 'materials' in material_priority:
        materials_list = material_priority['materials']
        
    for m in materials_list:
        m_name = m.get('name')
        if m_name:
            material_lookup[m_name] = {
                "id": m.get('id', generate_id(m_name)),
                "name": m_name,
                "priority": m.get('priority', 0),
                "difficulty": m.get('difficulty', 1),
                "reason": m.get('reason', ''),
                "type": m.get('type', 'unknown'),
                "associated_facts": []
            }
    
    # Link facts to materials
    for fact_id, node in nodes_map.items():
        sources = []
        if node.get('primary_source'):
            sources.extend([s.strip() for s in node['primary_source'].split(',') if s.strip()])
        if node.get('secondary_source'):
            sources.extend([s.strip() for s in node['secondary_source'].split(',') if s.strip()])
            
        for source in sources:
            if source not in material_lookup:
                material_lookup[source] = {
                    "id": generate_id(source),
                    "name": source,
                    "priority": 99, # Default low priority
                    "difficulty": 3, # Default medium difficulty
                    "reason": "Automatically extracted from node data",
                    "type": "unknown",
                    "associated_facts": []
                }
            material_lookup[source]['associated_facts'].append(fact_id)
            
            # Add to node's related materials
            if source not in node['related_materials']:
                node['related_materials'].append(source)

    materials = list(material_lookup.values())

    # 4. Process Edges
    # edges_data is already a list of relationships
    # We might want to enrich it or just keep it as is
    
    # 5. Construct Final Object
    unified_bundle = {
        "meta": {
            "version": "1.0",
            "generated_at": "2025-12-19"
        },
        "materials": materials,
        "nodes": list(nodes_map.values()), # Facts
        "edges": edges_data, # Fact relationships
        "edge_details": edges_data, # Currently same as edges, but could be different view
        "rendering": {
            "ftree": ftree_content
        },
        "raw_record": case_record,
        "annotations": annotations
    }
    
    return unified_bundle

if __name__ == "__main__":
    bundle = generate_unified_bundle()
    
    # Print summary
    print(f"Generated Unified Bundle:")
    print(f"Materials: {len(bundle['materials'])}")
    print(f"Nodes (Facts): {len(bundle['nodes'])}")
    print(f"Edges: {len(bundle['edges'])}")
    print(f"Has FTree: {bool(bundle['rendering']['ftree'])}")
    
    # Save to file
    with open("unified_bundle_structure.json", "w", encoding='utf-8') as f:
        json.dump(bundle, f, indent=2, ensure_ascii=False)
    print("Saved to unified_bundle_structure.json")
