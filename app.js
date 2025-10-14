// Impact Tree Builder Application
class ImpactTreeApp {
    constructor() {
        // Application state
        this.currentTree = null;
        this.nodes = new Map();
        this.relationships = new Map();
        this.measurements = new Map();
        this.selectedNode = null;
        this.selectedRelationship = null;
        this.mode = 'select'; // 'select', 'add-node', 'connect'
        this.selectedNodeType = null;
        this.connectionStart = null;
        this.dragState = { isDragging: false, dragNode: null, startX: 0, startY: 0 };
        this.viewBox = { x: 0, y: 0, width: 1200, height: 800, scale: 1 };
        
        // Initialize DOM elements
        this.canvas = document.getElementById('impactCanvas');
        this.nodesGroup = document.getElementById('nodesGroup');
        this.relationshipsGroup = document.getElementById('relationshipsGroup');
        
        // Initialize application
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.render();
        this.updateStats();
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Tool buttons
        document.querySelectorAll('[data-node-type]').forEach(btn => {
            btn.addEventListener('click', this.selectNodeType.bind(this));
        });
        
        document.getElementById('connectMode').addEventListener('click', () => {
            this.setMode('connect');
        });
        
        // Toolbar buttons
        document.getElementById('newTreeBtn').addEventListener('click', this.newTree.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveTree.bind(this));
        document.getElementById('loadBtn').addEventListener('click', this.loadTree.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportTree.bind(this));
        document.getElementById('helpBtn').addEventListener('click', this.showHelp.bind(this));
        
        // Canvas controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('resetView').addEventListener('click', this.resetView.bind(this));
        document.getElementById('centerView').addEventListener('click', this.centerView.bind(this));
        
        // Modal events
        this.setupModalEvents();
        
        // Tree info updates
        document.getElementById('treeName').addEventListener('input', this.updateTreeInfo.bind(this));
        document.getElementById('treeDescription').addEventListener('input', this.updateTreeInfo.bind(this));
    }

    setupModalEvents() {
        // Node modal
        document.getElementById('closeNodeModal').addEventListener('click', () => this.closeModal('nodeModal'));
        document.getElementById('cancelNodeEdit').addEventListener('click', () => this.closeModal('nodeModal'));
        document.getElementById('saveNode').addEventListener('click', this.saveNodeEdit.bind(this));
        document.getElementById('deleteNode').addEventListener('click', this.deleteSelectedNode.bind(this));
        
        // Measurement modal
        document.getElementById('closeMeasurementModal').addEventListener('click', () => this.closeModal('measurementModal'));
        document.getElementById('cancelMeasurement').addEventListener('click', () => this.closeModal('measurementModal'));
        document.getElementById('saveMeasurement').addEventListener('click', this.saveMeasurement.bind(this));
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    loadSampleData() {
        // Load the customer support chatbot example
        this.currentTree = {
            id: 'tree_001',
            name: 'Customer Support AI Chatbot Impact Analysis',
            description: 'Impact intelligence network for AI customer support chatbot initiative',
            created_date: '2025-01-01',
            updated_date: '2025-10-14',
            owner: 'Product Team'
        };
        
        // Sample nodes
        const sampleNodes = [
            {
                id: 'node_001',
                name: 'Customer Support Cost Reduction',
                description: 'Overall reduction in customer support operational costs',
                node_type: 'business_metric',
                level: 1,
                position_x: 400,
                position_y: 100,
                color: '#2E7D32',
                shape: 'rectangle'
            },
            {
                id: 'node_002',
                name: 'Call Volume Reduction',
                description: 'Reduction in customer service calls adjusted for business growth',
                node_type: 'product_metric',
                level: 2,
                position_x: 200,
                position_y: 250,
                color: '#1976D2',
                shape: 'rectangle'
            },
            {
                id: 'node_003',
                name: 'Customer Satisfaction Score',
                description: 'Overall customer satisfaction with support experience',
                node_type: 'product_metric',
                level: 2,
                position_x: 600,
                position_y: 250,
                color: '#1976D2',
                shape: 'rectangle'
            },
            {
                id: 'node_004',
                name: 'Virtual Assistant Capture Rate',
                description: 'Number of satisfactory chatbot sessions per hour during peak hours',
                node_type: 'initiative',
                level: 3,
                position_x: 100,
                position_y: 400,
                color: '#FF6F00',
                shape: 'ellipse'
            },
            {
                id: 'node_005',
                name: 'Resolution Success Rate',
                description: 'Percentage of customer queries successfully resolved by chatbot',
                node_type: 'initiative',
                level: 3,
                position_x: 300,
                position_y: 400,
                color: '#FF6F00',
                shape: 'ellipse'
            },
            {
                id: 'node_006',
                name: 'Average Response Time',
                description: 'Average time for chatbot to provide initial response to customer',
                node_type: 'initiative',
                level: 3,
                position_x: 500,
                position_y: 400,
                color: '#FF6F00',
                shape: 'ellipse'
            },
            {
                id: 'node_007',
                name: 'Escalation Rate',
                description: 'Percentage of chatbot conversations that require human escalation',
                node_type: 'initiative',
                level: 3,
                position_x: 700,
                position_y: 400,
                color: '#D32F2F',
                shape: 'ellipse'
            }
        ];
        
        // Sample relationships
        const sampleRelationships = [
            {
                id: 'rel_001',
                source_node_id: 'node_002',
                target_node_id: 'node_001',
                relationship_type: 'desirable_effect',
                color: '#4CAF50',
                strength: 0.8
            },
            {
                id: 'rel_002',
                source_node_id: 'node_003',
                target_node_id: 'node_001',
                relationship_type: 'desirable_effect',
                color: '#4CAF50',
                strength: 0.6
            },
            {
                id: 'rel_003',
                source_node_id: 'node_004',
                target_node_id: 'node_002',
                relationship_type: 'desirable_effect',
                color: '#4CAF50',
                strength: 0.9
            },
            {
                id: 'rel_004',
                source_node_id: 'node_005',
                target_node_id: 'node_002',
                relationship_type: 'desirable_effect',
                color: '#4CAF50',
                strength: 0.85
            },
            {
                id: 'rel_005',
                source_node_id: 'node_006',
                target_node_id: 'node_003',
                relationship_type: 'desirable_effect',
                color: '#4CAF50',
                strength: 0.7
            },
            {
                id: 'rel_006',
                source_node_id: 'node_007',
                target_node_id: 'node_002',
                relationship_type: 'undesirable_effect',
                color: '#F44336',
                strength: 0.6
            },
            {
                id: 'rel_007',
                source_node_id: 'node_007',
                target_node_id: 'node_003',
                relationship_type: 'undesirable_effect',
                color: '#F44336',
                strength: 0.4
            }
        ];
        
        // Sample measurements
        const sampleMeasurements = [
            {
                id: 'meas_001',
                node_id: 'node_004',
                metric_name: 'Satisfactory Sessions per Hour',
                expected_value: 2350,
                actual_value: 1654,
                measurement_date: '2025-10-01',
                impact_type: 'proximate'
            },
            {
                id: 'meas_002',
                node_id: 'node_005',
                metric_name: 'Resolution Success Rate',
                expected_value: 75.0,
                actual_value: 68.2,
                measurement_date: '2025-10-01',
                impact_type: 'proximate'
            },
            {
                id: 'meas_003',
                node_id: 'node_002',
                metric_name: 'Call Volume Change (%)',
                expected_value: -2.0,
                actual_value: -1.6,
                measurement_date: '2025-10-01',
                impact_type: 'downstream'
            },
            {
                id: 'meas_004',
                node_id: 'node_001',
                metric_name: 'Support Cost Reduction (%)',
                expected_value: -5.0,
                actual_value: -2.8,
                measurement_date: '2025-10-01',
                impact_type: 'downstream'
            }
        ];
        
        // Load data into maps
        sampleNodes.forEach(node => this.nodes.set(node.id, node));
        sampleRelationships.forEach(rel => this.relationships.set(rel.id, rel));
        sampleMeasurements.forEach(meas => this.measurements.set(meas.id, meas));
        
        // Update UI
        document.getElementById('treeName').value = this.currentTree.name;
        document.getElementById('treeDescription').value = this.currentTree.description;
    }

    render() {
        this.renderNodes();
        this.renderRelationships();
        this.hideInstructions();
    }

    renderNodes() {
        this.nodesGroup.innerHTML = '';
        
        this.nodes.forEach(node => {
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.classList.add('node');
            nodeGroup.setAttribute('data-node-id', node.id);
            nodeGroup.setAttribute('transform', `translate(${node.position_x}, ${node.position_y})`);
            
            let nodeBody;
            if (node.shape === 'ellipse') {
                nodeBody = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                nodeBody.setAttribute('cx', 0);
                nodeBody.setAttribute('cy', 0);
                nodeBody.setAttribute('rx', 60);
                nodeBody.setAttribute('ry', 35);
            } else {
                nodeBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                nodeBody.setAttribute('x', -75);
                nodeBody.setAttribute('y', -25);
                nodeBody.setAttribute('width', 150);
                nodeBody.setAttribute('height', 50);
                nodeBody.setAttribute('rx', 8);
            }
            
            nodeBody.classList.add('node-body');
            nodeBody.setAttribute('fill', node.color);
            nodeBody.setAttribute('stroke', '#fff');
            nodeBody.setAttribute('stroke-width', 1);
            
            const nodeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nodeText.classList.add('node-text');
            nodeText.setAttribute('x', 0);
            nodeText.setAttribute('y', 0);
            nodeText.textContent = this.truncateText(node.name, 20);
            
            nodeGroup.appendChild(nodeBody);
            nodeGroup.appendChild(nodeText);
            
            // Add measurement indicator if measurements exist
            const nodeMeasurements = Array.from(this.measurements.values()).filter(m => m.node_id === node.id);
            if (nodeMeasurements.length > 0) {
                const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                indicator.setAttribute('cx', node.shape === 'ellipse' ? 45 : 60);
                indicator.setAttribute('cy', node.shape === 'ellipse' ? -25 : -15);
                indicator.setAttribute('r', 4);
                
                // Calculate performance
                const performance = this.calculatePerformance(nodeMeasurements);
                indicator.setAttribute('fill', performance >= 0.8 ? '#4CAF50' : '#F44336');
                
                nodeGroup.appendChild(indicator);
            }
            
            this.nodesGroup.appendChild(nodeGroup);
        });
    }

    renderRelationships() {
        this.relationshipsGroup.innerHTML = '';
        
        this.relationships.forEach(rel => {
            const sourceNode = this.nodes.get(rel.source_node_id);
            const targetNode = this.nodes.get(rel.target_node_id);
            
            if (!sourceNode || !targetNode) return;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('relationship');
            line.setAttribute('data-relationship-id', rel.id);
            line.setAttribute('x1', sourceNode.position_x);
            line.setAttribute('y1', sourceNode.position_y);
            line.setAttribute('x2', targetNode.position_x);
            line.setAttribute('y2', targetNode.position_y);
            line.setAttribute('stroke', rel.color);
            line.setAttribute('stroke-width', 2);
            
            // Add arrowhead based on relationship type
            if (rel.relationship_type === 'desirable_effect') {
                line.setAttribute('marker-end', 'url(#arrowhead-green)');
            } else if (rel.relationship_type === 'undesirable_effect') {
                line.setAttribute('marker-end', 'url(#arrowhead-red)');
            } else {
                line.setAttribute('marker-end', 'url(#arrowhead-blue)');
            }
            
            this.relationshipsGroup.appendChild(line);
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to SVG coordinates
        const svgPoint = this.canvas.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;
        const ctm = this.canvas.getScreenCTM();
        const svgCoords = svgPoint.matrixTransform(ctm.inverse());
        
        if (this.mode === 'add-node' && this.selectedNodeType) {
            this.addNode(svgCoords.x, svgCoords.y);
        } else if (this.mode === 'connect' && e.target.closest('.node')) {
            this.handleNodeConnection(e.target.closest('.node'));
        } else {
            // Handle node/relationship selection
            const clickedNode = e.target.closest('.node');
            const clickedRelationship = e.target.closest('.relationship');
            
            if (clickedNode) {
                this.selectNode(clickedNode.getAttribute('data-node-id'));
            } else if (clickedRelationship) {
                this.selectRelationship(clickedRelationship.getAttribute('data-relationship-id'));
            } else {
                this.clearSelection();
            }
        }
    }

    handleMouseDown(e) {
        const clickedNode = e.target.closest('.node');
        if (clickedNode && this.mode === 'select') {
            this.dragState.isDragging = true;
            this.dragState.dragNode = clickedNode;
            this.dragState.startX = e.clientX;
            this.dragState.startY = e.clientY;
            clickedNode.classList.add('dragging');
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (this.dragState.isDragging && this.dragState.dragNode) {
            const deltaX = e.clientX - this.dragState.startX;
            const deltaY = e.clientY - this.dragState.startY;
            
            const nodeId = this.dragState.dragNode.getAttribute('data-node-id');
            const node = this.nodes.get(nodeId);
            
            node.position_x += deltaX;
            node.position_y += deltaY;
            
            this.dragState.startX = e.clientX;
            this.dragState.startY = e.clientY;
            
            this.render();
        }
    }

    handleMouseUp(e) {
        if (this.dragState.isDragging) {
            this.dragState.dragNode.classList.remove('dragging');
            this.dragState.isDragging = false;
            this.dragState.dragNode = null;
        }
    }

    selectNodeType(e) {
        // Clear previous selection
        document.querySelectorAll('[data-node-type]').forEach(btn => btn.classList.remove('active'));
        document.getElementById('connectMode').classList.remove('active');
        
        // Set new selection
        e.target.closest('button').classList.add('active');
        this.selectedNodeType = e.target.closest('button').getAttribute('data-node-type');
        this.setMode('add-node');
    }

    setMode(mode) {
        this.mode = mode;
        this.connectionStart = null;
        
        if (mode === 'connect') {
            document.getElementById('connectMode').classList.add('active');
            document.querySelectorAll('[data-node-type]').forEach(btn => btn.classList.remove('active'));
            this.canvas.style.cursor = 'crosshair';
        } else if (mode === 'add-node') {
            this.canvas.style.cursor = 'copy';
        } else {
            this.canvas.style.cursor = 'default';
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        }
    }

    addNode(x, y) {
        const nodeId = 'node_' + Date.now();
        const nodeType = this.selectedNodeType;
        
        let color, shape, level;
        switch (nodeType) {
            case 'business_metric':
                color = '#2E7D32';
                shape = 'rectangle';
                level = 1;
                break;
            case 'product_metric':
                color = '#1976D2';
                shape = 'rectangle';
                level = 2;
                break;
            case 'initiative_positive':
                color = '#FF6F00';
                shape = 'ellipse';
                level = 3;
                break;
            case 'initiative_negative':
                color = '#D32F2F';
                shape = 'ellipse';
                level = 3;
                break;
        }
        
        const newNode = {
            id: nodeId,
            name: 'New Node',
            description: '',
            node_type: nodeType.replace('_positive', '').replace('_negative', ''),
            level: level,
            position_x: x,
            position_y: y,
            color: color,
            shape: shape
        };
        
        this.nodes.set(nodeId, newNode);
        this.render();
        this.updateStats();
        
        // Open edit modal
        this.selectNode(nodeId);
        this.editSelectedNode();
    }

    handleNodeConnection(nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        
        if (!this.connectionStart) {
            this.connectionStart = nodeId;
            nodeElement.style.outline = '3px solid var(--color-primary)';
        } else if (this.connectionStart !== nodeId) {
            this.createRelationship(this.connectionStart, nodeId);
            this.clearConnectionState();
        }
    }

    createRelationship(sourceId, targetId) {
        const relationshipType = document.querySelector('input[name="relationshipType"]:checked').value;
        const relId = 'rel_' + Date.now();
        
        let color;
        switch (relationshipType) {
            case 'desirable_effect':
                color = '#4CAF50';
                break;
            case 'undesirable_effect':
                color = '#F44336';
                break;
            case 'rollup':
                color = '#2196F3';
                break;
        }
        
        const newRelationship = {
            id: relId,
            source_node_id: sourceId,
            target_node_id: targetId,
            relationship_type: relationshipType,
            color: color,
            strength: 0.5
        };
        
        this.relationships.set(relId, newRelationship);
        this.render();
        this.updateStats();
    }

    clearConnectionState() {
        this.connectionStart = null;
        document.querySelectorAll('.node').forEach(node => {
            node.style.outline = '';
        });
    }

    selectNode(nodeId) {
        this.clearSelection();
        this.selectedNode = nodeId;
        
        // Visual feedback
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }
        
        this.updatePropertiesPanel();
        this.updateMeasurementsPanel();
    }

    selectRelationship(relationshipId) {
        this.clearSelection();
        this.selectedRelationship = relationshipId;
        
        // Visual feedback
        const relElement = document.querySelector(`[data-relationship-id="${relationshipId}"]`);
        if (relElement) {
            relElement.classList.add('selected');
        }
        
        this.updatePropertiesPanel();
    }

    clearSelection() {
        this.selectedNode = null;
        this.selectedRelationship = null;
        
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('selected');
        });
        
        document.querySelectorAll('.relationship').forEach(rel => {
            rel.classList.remove('selected');
        });
        
        this.updatePropertiesPanel();
        this.updateMeasurementsPanel();
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        
        if (this.selectedNode) {
            const node = this.nodes.get(this.selectedNode);
            panel.innerHTML = `
                <div class="properties-form">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-control" value="${node.name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" rows="3" readonly>${node.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <input type="text" class="form-control" value="${this.getNodeTypeLabel(node.node_type)}" readonly>
                    </div>
                    <div class="form-group">
                        <button class="btn btn--primary btn--full-width" onclick="app.editSelectedNode()">Edit Node</button>
                    </div>
                    <div class="form-group">
                        <button class="btn btn--secondary btn--full-width" onclick="app.showAddMeasurement()">Add Measurement</button>
                    </div>
                </div>
            `;
        } else if (this.selectedRelationship) {
            const rel = this.relationships.get(this.selectedRelationship);
            const sourceNode = this.nodes.get(rel.source_node_id);
            const targetNode = this.nodes.get(rel.target_node_id);
            
            panel.innerHTML = `
                <div class="properties-form">
                    <div class="form-group">
                        <label class="form-label">From</label>
                        <input type="text" class="form-control" value="${sourceNode.name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">To</label>
                        <input type="text" class="form-control" value="${targetNode.name}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <input type="text" class="form-control" value="${rel.relationship_type.replace('_', ' ')}" readonly>
                    </div>
                    <div class="form-group">
                        <button class="btn btn--outline btn--full-width" onclick="app.deleteSelectedRelationship()">Delete Relationship</button>
                    </div>
                </div>
            `;
        } else {
            panel.innerHTML = '<div class="no-selection"><p>Select a node or relationship to view properties</p></div>';
        }
    }

    updateMeasurementsPanel() {
        const panel = document.getElementById('measurementsPanel');
        
        if (this.selectedNode) {
            const nodeMeasurements = Array.from(this.measurements.values()).filter(m => m.node_id === this.selectedNode);
            
            if (nodeMeasurements.length > 0) {
                const measurementsHtml = nodeMeasurements.map(measurement => {
                    const performance = this.calculateMeasurementPerformance(measurement);
                    const indicatorClass = performance >= 0.8 ? 'good' : 'poor';
                    
                    return `
                        <div class="measurement-item">
                            <div class="measurement-header">
                                <span class="measurement-name">${measurement.metric_name}</span>
                                <span class="performance-indicator ${indicatorClass}"></span>
                            </div>
                            <div class="measurement-values">
                                <div class="measurement-value">
                                    <span class="measurement-label">Expected</span>
                                    <span>${measurement.expected_value}</span>
                                </div>
                                <div class="measurement-value">
                                    <span class="measurement-label">Actual</span>
                                    <span>${measurement.actual_value}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                panel.innerHTML = `
                    <div class="measurements-list">
                        ${measurementsHtml}
                    </div>
                `;
            } else {
                panel.innerHTML = '<div class="no-selection"><p>No measurements for this node</p></div>';
            }
        } else {
            panel.innerHTML = '<div class="no-selection"><p>Select a node to view measurements</p></div>';
        }
    }

    editSelectedNode() {
        if (!this.selectedNode) return;
        
        const node = this.nodes.get(this.selectedNode);
        
        document.getElementById('nodeName').value = node.name;
        document.getElementById('nodeDescription').value = node.description;
        document.getElementById('nodeType').value = node.node_type;
        
        this.showModal('nodeModal');
    }

    saveNodeEdit() {
        if (!this.selectedNode) return;
        
        const node = this.nodes.get(this.selectedNode);
        node.name = document.getElementById('nodeName').value;
        node.description = document.getElementById('nodeDescription').value;
        node.node_type = document.getElementById('nodeType').value;
        
        // Update color based on type
        switch (node.node_type) {
            case 'business_metric':
                node.color = '#2E7D32';
                node.shape = 'rectangle';
                node.level = 1;
                break;
            case 'product_metric':
                node.color = '#1976D2';
                node.shape = 'rectangle';
                node.level = 2;
                break;
            case 'initiative':
                node.color = '#FF6F00';
                node.shape = 'ellipse';
                node.level = 3;
                break;
        }
        
        this.render();
        this.updatePropertiesPanel();
        this.closeModal('nodeModal');
    }

    deleteSelectedNode() {
        if (!this.selectedNode) return;
        
        // Delete related relationships
        const relatedRelationships = Array.from(this.relationships.entries()).filter(
            ([id, rel]) => rel.source_node_id === this.selectedNode || rel.target_node_id === this.selectedNode
        );
        
        relatedRelationships.forEach(([id]) => this.relationships.delete(id));
        
        // Delete related measurements
        const relatedMeasurements = Array.from(this.measurements.entries()).filter(
            ([id, meas]) => meas.node_id === this.selectedNode
        );
        
        relatedMeasurements.forEach(([id]) => this.measurements.delete(id));
        
        // Delete the node
        this.nodes.delete(this.selectedNode);
        
        this.clearSelection();
        this.render();
        this.updateStats();
        this.closeModal('nodeModal');
    }

    deleteSelectedRelationship() {
        if (!this.selectedRelationship) return;
        
        this.relationships.delete(this.selectedRelationship);
        this.clearSelection();
        this.render();
        this.updateStats();
    }

    showAddMeasurement() {
        if (!this.selectedNode) return;
        
        // Clear form
        document.getElementById('metricName').value = '';
        document.getElementById('expectedValue').value = '';
        document.getElementById('actualValue').value = '';
        document.getElementById('impactType').value = 'proximate';
        document.getElementById('measurementPeriod').value = 'monthly';
        
        this.showModal('measurementModal');
    }

    saveMeasurement() {
        if (!this.selectedNode) return;
        
        const measurementId = 'meas_' + Date.now();
        const newMeasurement = {
            id: measurementId,
            node_id: this.selectedNode,
            metric_name: document.getElementById('metricName').value,
            expected_value: parseFloat(document.getElementById('expectedValue').value),
            actual_value: parseFloat(document.getElementById('actualValue').value),
            measurement_date: new Date().toISOString().split('T')[0],
            measurement_period: document.getElementById('measurementPeriod').value,
            impact_type: document.getElementById('impactType').value
        };
        
        this.measurements.set(measurementId, newMeasurement);
        this.render();
        this.updateMeasurementsPanel();
        this.updateStats();
        this.closeModal('measurementModal');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    newTree() {
        this.currentTree = {
            id: 'tree_' + Date.now(),
            name: 'New Impact Tree',
            description: '',
            created_date: new Date().toISOString().split('T')[0],
            updated_date: new Date().toISOString().split('T')[0],
            owner: 'User'
        };
        
        this.nodes.clear();
        this.relationships.clear();
        this.measurements.clear();
        this.clearSelection();
        
        document.getElementById('treeName').value = this.currentTree.name;
        document.getElementById('treeDescription').value = this.currentTree.description;
        
        this.render();
        this.updateStats();
        this.showInstructions();
    }

    saveTree() {
        const treeData = {
            tree: this.currentTree,
            nodes: Array.from(this.nodes.values()),
            relationships: Array.from(this.relationships.values()),
            measurements: Array.from(this.measurements.values())
        };
        
        // Save to browser's memory (simulated save)
        window.savedTreeData = treeData;
        alert('Tree saved successfully!');
    }

    loadTree() {
        if (window.savedTreeData) {
            const data = window.savedTreeData;
            
            this.currentTree = data.tree;
            this.nodes.clear();
            this.relationships.clear();
            this.measurements.clear();
            
            data.nodes.forEach(node => this.nodes.set(node.id, node));
            data.relationships.forEach(rel => this.relationships.set(rel.id, rel));
            data.measurements.forEach(meas => this.measurements.set(meas.id, meas));
            
            document.getElementById('treeName').value = this.currentTree.name;
            document.getElementById('treeDescription').value = this.currentTree.description;
            
            this.render();
            this.updateStats();
            alert('Tree loaded successfully!');
        } else {
            alert('No saved tree found!');
        }
    }

    exportTree() {
        const treeData = {
            tree: this.currentTree,
            nodes: Array.from(this.nodes.values()),
            relationships: Array.from(this.relationships.values()),
            measurements: Array.from(this.measurements.values())
        };
        
        const dataStr = JSON.stringify(treeData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentTree.name.replace(/\s+/g, '_')}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    updateTreeInfo() {
        if (this.currentTree) {
            this.currentTree.name = document.getElementById('treeName').value;
            this.currentTree.description = document.getElementById('treeDescription').value;
            this.currentTree.updated_date = new Date().toISOString().split('T')[0];
        }
    }

    updateStats() {
        document.getElementById('totalNodes').textContent = this.nodes.size;
        document.getElementById('totalRelationships').textContent = this.relationships.size;
        
        const measuredNodes = new Set();
        this.measurements.forEach(meas => measuredNodes.add(meas.node_id));
        document.getElementById('measuredNodes').textContent = measuredNodes.size;
    }

    zoom(factor) {
        this.viewBox.scale *= factor;
        this.updateViewBox();
    }

    resetView() {
        this.viewBox = { x: 0, y: 0, width: 1200, height: 800, scale: 1 };
        this.updateViewBox();
    }

    centerView() {
        if (this.nodes.size === 0) return;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.position_x);
            maxX = Math.max(maxX, node.position_x);
            minY = Math.min(minY, node.position_y);
            maxY = Math.max(maxY, node.position_y);
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        this.viewBox.x = centerX - this.viewBox.width / 2;
        this.viewBox.y = centerY - this.viewBox.height / 2;
        
        this.updateViewBox();
    }

    updateViewBox() {
        this.canvas.setAttribute('viewBox', 
            `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width / this.viewBox.scale} ${this.viewBox.height / this.viewBox.scale}`
        );
    }

    hideInstructions() {
        const instructions = document.getElementById('canvasInstructions');
        if (this.nodes.size > 0) {
            instructions.style.display = 'none';
        }
    }

    showInstructions() {
        const instructions = document.getElementById('canvasInstructions');
        instructions.style.display = 'block';
    }

    showHelp() {
        alert(`Impact Tree Builder Help:

1. Use the left sidebar to add different types of nodes
2. Click "Connect Nodes" then click two nodes to create relationships
3. Select nodes to edit properties and add measurements
4. Drag nodes to reposition them
5. Use canvas controls to zoom and center the view
6. Save/Load your work or export as JSON

Node Types:
• Business Metrics (Green): Top-level business outcomes
• Product Metrics (Blue): Service/product level metrics
• Initiatives (Orange/Red): Features or actions that drive change`);
    }

    calculatePerformance(measurements) {
        if (measurements.length === 0) return 0;
        
        const avgPerformance = measurements.reduce((sum, meas) => {
            return sum + this.calculateMeasurementPerformance(meas);
        }, 0) / measurements.length;
        
        return avgPerformance;
    }

    calculateMeasurementPerformance(measurement) {
        if (measurement.expected_value === 0) return 0;
        return Math.abs(measurement.actual_value / measurement.expected_value);
    }

    getNodeTypeLabel(nodeType) {
        switch (nodeType) {
            case 'business_metric': return 'Business Metric';
            case 'product_metric': return 'Product Metric';
            case 'initiative': return 'Initiative';
            default: return nodeType;
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

// Initialize the application
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new ImpactTreeApp();
});