import type { ImpactTree, Node, Relationship, Measurement, TreeData } from '@/types';

/**
 * Complete tree state for export operations
 */
export interface TreeState {
  tree: ImpactTree;
  nodes: Map<string, Node>;
  relationships: Map<string, Relationship>;
  measurements: Map<string, Measurement>;
}

/**
 * Export tree data as JSON file
 */
export function exportAsJSON({ tree, nodes, relationships, measurements }: TreeState): void {
  const data: TreeData = {
    tree,
    nodes: Array.from(nodes.values()),
    relationships: Array.from(relationships.values()),
    measurements: Array.from(measurements.values()),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${tree.name.replace(/\s+/g, "_")}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Export tree visualization as PNG image
 */
export async function exportAsPNG(tree: ImpactTree, canvasElement: SVGSVGElement | null): Promise<void> {
  if (!canvasElement) {
    throw new Error('Canvas element not available for PNG export');
  }

  try {
    // Get the SVG dimensions
    const bbox = canvasElement.getBBox();
    const width = Math.max(bbox.width + bbox.x, canvasElement.clientWidth || 800);
    const height = Math.max(bbox.height + bbox.y, canvasElement.clientHeight || 600);

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(canvasElement);

    // Create SVG blob
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create canvas and load SVG as image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas size with higher resolution
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Scale context for higher resolution
    ctx.scale(scale, scale);

    // Load SVG as image and draw to canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Fill background with white
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw the SVG image
          ctx.drawImage(img, 0, 0, width, height);

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load SVG as image'));
      };

      img.src = svgUrl;
    });

    // Clean up the SVG URL
    URL.revokeObjectURL(svgUrl);

    // Convert canvas to PNG blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to generate PNG blob');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tree.name.replace(/\s+/g, "_")}.png`;
      link.click();

      URL.revokeObjectURL(url);
    }, 'image/png');

  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('Failed to export as PNG');
  }
}

/**
 * Export tree as self-contained HTML page
 */
export function exportAsHTML({ tree, nodes, relationships, measurements }: TreeState): void {
  // Generate SVG content for the tree
  const svgContent = generateTreeSVG(nodes, relationships);

  // Generate HTML content
  const htmlContent = generateHTMLPage(tree, svgContent, nodes, relationships, measurements);

  // Create and download HTML file
  const htmlBlob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(htmlBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${tree.name.replace(/\s+/g, "_")}.html`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Generate SVG representation of the tree
 */
function generateTreeSVG(nodes: Map<string, Node>, relationships: Map<string, Relationship>): string {
  const nodeArray = Array.from(nodes.values());
  const relationshipArray = Array.from(relationships.values());

  // Calculate visual bounds accounting for actual node sizes
  // All nodes are 150px wide and 50px tall, positioned at their top-left corner
  const nodeBounds = nodeArray.map(node => ({
    left: node.position_x,
    right: node.position_x + 150,
    top: node.position_y,
    bottom: node.position_y + 50
  }));

  const minX = Math.min(...nodeBounds.map(b => b.left));
  const maxX = Math.max(...nodeBounds.map(b => b.right));
  const minY = Math.min(...nodeBounds.map(b => b.top));
  const maxY = Math.max(...nodeBounds.map(b => b.bottom));

  const padding = 50;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  // Calculate offset to translate coordinates to start from 0,0
  const offsetX = minX - padding;
  const offsetY = minY - padding;

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  // Apply translation to move all content to positive coordinates
  svg += `<g transform="translate(${-offsetX}, ${-offsetY})">`;

  // Add relationships (arrows)
  relationshipArray.forEach(rel => {
    const sourceNode = nodes.get(rel.source_node_id);
    const targetNode = nodes.get(rel.target_node_id);

    if (sourceNode && targetNode) {
      const x1 = sourceNode.position_x + 75; // Approximate center of node
      const y1 = sourceNode.position_y + 25;
      const x2 = targetNode.position_x + 75;
      const y2 = targetNode.position_y + 25;

      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${rel.color}" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }
  });

  // Add arrow marker
  svg += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#666"/></marker></defs>`;

  // Add nodes
  nodeArray.forEach(node => {
    const shape = node.shape === 'ellipse' ? 'ellipse' : 'rect';
    const attrs = shape === 'ellipse'
      ? `cx="${node.position_x + 75}" cy="${node.position_y + 25}" rx="75" ry="25"`
      : `x="${node.position_x}" y="${node.position_y}" width="150" height="50" rx="5"`;

    svg += `<${shape} ${attrs} fill="${node.color}" stroke="#333" stroke-width="1"/>`;
    svg += `<text x="${node.position_x + 75}" y="${node.position_y + 32}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#000">${node.name}</text>`;
  });

  svg += '</g></svg>';
  return svg;
}

/**
 * Generate complete HTML page with embedded tree visualization
 */
function generateHTMLPage(
  tree: ImpactTree,
  svgContent: string,
  nodes: Map<string, Node>,
  relationships: Map<string, Relationship>,
  measurements: Map<string, Measurement>
): string {
  const nodeList = Array.from(nodes.values());
  const relationshipList = Array.from(relationships.values());
  const measurementList = Array.from(measurements.values());

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tree.name} - Impact Tree</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 20px;
        }
        .tree-visualization {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
            overflow: auto;
            min-height: 400px;
            max-width: 100%;
        }
        .tree-visualization svg {
            min-width: 100%;
            height: auto;
            display: block;
        }
        .tree-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 15px;
        }
        .info-section h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 16px;
        }
        .info-item {
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-item strong {
            color: #6b7280;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat {
            background: #eff6ff;
            padding: 10px 15px;
            border-radius: 4px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .stat-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${tree.name}</h1>
            <p>${tree.description}</p>
            <p><small>Exported: ${new Date().toLocaleDateString()} | Owner: ${tree.owner}</small></p>
        </div>

        <div class="content">
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">${nodeList.length}</div>
                    <div class="stat-label">Nodes</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${relationshipList.length}</div>
                    <div class="stat-label">Relationships</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${measurementList.length}</div>
                    <div class="stat-label">Measurements</div>
                </div>
            </div>

            <div class="tree-visualization">
                <h3>Tree Visualization</h3>
                ${svgContent}
            </div>

            <div class="tree-info">
                <div class="info-section">
                    <h3>Nodes</h3>
                    ${nodeList.map(node => `
                        <div class="info-item">
                            <strong>${node.name}</strong> (${node.node_type.replace('_', ' ')})
                            <br><small>${node.description}</small>
                        </div>
                    `).join('')}
                </div>

                <div class="info-section">
                    <h3>Relationships</h3>
                    ${relationshipList.map(rel => {
                        const source = nodes.get(rel.source_node_id);
                        const target = nodes.get(rel.target_node_id);
                        return `
                            <div class="info-item">
                                <strong>${source?.name || 'Unknown'}</strong> → <strong>${target?.name || 'Unknown'}</strong>
                                <br><small>${rel.relationship_type.replace('_', ' ')}</small>
                            </div>
                        `;
                    }).join('')}
                </div>

                ${measurementList.length > 0 ? `
                    <div class="info-section">
                        <h3>Measurements</h3>
                        ${measurementList.map(measurement => {
                            const node = nodes.get(measurement.node_id);
                            return `
                                <div class="info-item">
                                    <strong>${node?.name || 'Unknown'}</strong>: ${measurement.metric_name}
                                    <br><small>Expected: ${measurement.expected_value} | Actual: ${measurement.actual_value}</small>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
}