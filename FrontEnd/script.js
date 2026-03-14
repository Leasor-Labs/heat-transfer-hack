// Configuration
const API_BASE_URL = ''; // Set your API Gateway URL

// Global variables
let map;
let sources = [];
let consumers = [];
let sourceMarkers = [];
let consumerMarkers = [];
let selectedSourceId = null;
let selectedConsumerId = null;
let currentRouteLayer = null;
let currentOpportunity = null;
let allRankings = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('HeatGrid initializing...');
    
    // Initialize map
    initMap();
    
    // Load initial data
    await loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load rankings
    loadRankings();
});

// Initialize map
function initMap() {
    mapboxgl.accessToken = 'pk.placeholder';
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-82.5, 40.0],
        zoom: 7
    });
    
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
}

// Load data from backend
async function loadData(searchQuery = '') {
    try {
        let sourcesUrl = `${API_BASE_URL}/api/heat-sources`;
        let consumersUrl = `${API_BASE_URL}/api/heat-consumers`;
        
        if (searchQuery) {
            sourcesUrl += `?locationSearchQuery=${encodeURIComponent(searchQuery)}`;
            consumersUrl += `?locationSearchQuery=${encodeURIComponent(searchQuery)}`;
        }
        
        const [sourcesResponse, consumersResponse] = await Promise.all([
            fetch(sourcesUrl),
            fetch(consumersUrl)
        ]);
        
        const sourcesData = await sourcesResponse.json();
        const consumersData = await consumersResponse.json();
        
        // Handle both response formats
        sources = sourcesData.heatSources || sourcesData;
        consumers = consumersData.heatConsumers || consumersData;
        
        console.log(`Loaded ${sources.length} sources, ${consumers.length} consumers`);
        
        updateMarkers();
        updateSelectors();
        updateMarkerCounts();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Update map markers
function updateMarkers() {
    sourceMarkers.forEach(m => m.remove());
    consumerMarkers.forEach(m => m.remove());
    sourceMarkers = [];
    consumerMarkers = [];
    
    sources.forEach(source => {
        const popup = new mapboxgl.Popup().setHTML(`
            <h3>🏭 ${source.name}</h3>
            <p><strong>Industry:</strong> ${source.industry || 'Industrial'}</p>
            <p><strong>Waste Heat:</strong> ${(source.estimatedWasteHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
            <p><strong>Recoverable:</strong> ${(source.recoverableHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
            <p><strong>Temperature:</strong> ${source.temperatureClass || 'medium'}</p>
            <button onclick="window.selectSource('${source.id}')" style="margin-top:5px; padding:5px 10px; background:#ff4d4d; color:white; border:none; border-radius:5px; cursor:pointer;">
                Select Source
            </button>
        `);
        
        const marker = new mapboxgl.Marker({ color: '#ff4d4d' })
            .setLngLat([source.longitude, source.latitude])
            .setPopup(popup)
            .addTo(map);
        
        sourceMarkers.push({ marker, id: source.id, data: source });
    });
    
    consumers.forEach(consumer => {
        const popup = new mapboxgl.Popup().setHTML(`
            <h3>🏢 ${consumer.name}</h3>
            <p><strong>Category:</strong> ${consumer.category || 'Building'}</p>
            <p><strong>Heat Demand:</strong> ${(consumer.annualHeatDemandMWh / 1000).toFixed(1)} GWh/year</p>
            <button onclick="window.selectConsumer('${consumer.id}')" style="margin-top:5px; padding:5px 10px; background:#4d79ff; color:white; border:none; border-radius:5px; cursor:pointer;">
                Select Consumer
            </button>
        `);
        
        const marker = new mapboxgl.Marker({ color: '#4d79ff' })
            .setLngLat([consumer.longitude, consumer.latitude])
            .setPopup(popup)
            .addTo(map);
        
        consumerMarkers.push({ marker, id: consumer.id, data: consumer });
    });
}

// Update dropdowns
function updateSelectors() {
    const sourceSelect = document.getElementById('sourceSelect');
    const consumerSelect = document.getElementById('consumerSelect');
    
    sourceSelect.innerHTML = '<option value="">Select a source...</option>';
    sources.forEach(source => {
        sourceSelect.innerHTML += `<option value="${source.id}">${source.name} (${(source.recoverableHeatMWhPerYear / 1000).toFixed(1)} GWh)</option>`;
    });
    
    consumerSelect.innerHTML = '<option value="">Select a consumer...</option>';
    consumers.forEach(consumer => {
        consumerSelect.innerHTML += `<option value="${consumer.id}">${consumer.name} (${(consumer.annualHeatDemandMWh / 1000).toFixed(1)} GWh)</option>`;
    });
}

function updateMarkerCounts() {
    document.getElementById('markerCounts').innerHTML = 
        `<i class="fas fa-map-marker-alt"></i> ${sources.length} sources, ${consumers.length} consumers`;
}

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const query = document.getElementById('locationSearch').value;
        if (query) await loadData(query);
    });
    
    document.getElementById('sourceSelect').addEventListener('change', (e) => {
        selectedSourceId = e.target.value;
        highlightSelected();
        updateCalculateButton();
    });
    
    document.getElementById('consumerSelect').addEventListener('change', (e) => {
        selectedConsumerId = e.target.value;
        highlightSelected();
        updateCalculateButton();
    });
    
    document.getElementById('calculateBtn').addEventListener('click', calculateOpportunity);
    document.getElementById('fitMarkersBtn').addEventListener('click', fitMarkersToBounds);
    document.getElementById('generatePdfBtn').addEventListener('click', generatePdf);
    
    document.getElementById('locationSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('searchBtn').click();
    });
}

function updateCalculateButton() {
    const btn = document.getElementById('calculateBtn');
    btn.disabled = !selectedSourceId || !selectedConsumerId;
}

function highlightSelected() {
    sourceMarkers.forEach(({ marker }) => {
        marker.getElement().style.filter = 'none';
    });
    consumerMarkers.forEach(({ marker }) => {
        marker.getElement().style.filter = 'none';
    });
    
    if (selectedSourceId) {
        const selected = sourceMarkers.find(m => m.id === selectedSourceId);
        if (selected) {
            selected.marker.getElement().style.filter = 'drop-shadow(0 0 10px gold)';
            selected.marker.togglePopup();
        }
    }
    
    if (selectedConsumerId) {
        const selected = consumerMarkers.find(m => m.id === selectedConsumerId);
        if (selected) {
            selected.marker.getElement().style.filter = 'drop-shadow(0 0 10px gold)';
            selected.marker.togglePopup();
        }
    }
}

function fitMarkersToBounds() {
    if (sourceMarkers.length === 0 && consumerMarkers.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    sourceMarkers.forEach(({ marker }) => bounds.extend(marker.getLngLat()));
    consumerMarkers.forEach(({ marker }) => bounds.extend(marker.getLngLat()));
    map.fitBounds(bounds, { padding: 50 });
}

// MAIN FUNCTION: Calculate opportunity
async function calculateOpportunity() {
    if (!selectedSourceId || !selectedConsumerId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/evaluate-opportunity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: selectedSourceId,
                consumerId: selectedConsumerId
            })
        });
        
        const data = await response.json();
        currentOpportunity = data.opportunity;
        
        console.log('Opportunity calculated:', currentOpportunity);
        
        displayOpportunityResults(currentOpportunity);
        drawRoute(currentOpportunity);
        
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error calculating opportunity:', error);
        alert('Failed to calculate opportunity');
    }
}

// Display results matching your backend structure
function displayOpportunityResults(opp) {
    // Basic metrics
    document.getElementById('resultDistance').textContent = `${opp.distanceKm.toFixed(1)} km`;
    document.getElementById('resultCapex').textContent = `$${(opp.infrastructureCost.totalInfrastructureCostUsd / 1e6).toFixed(1)}M`;
    document.getElementById('resultPayback').textContent = `${opp.financialModel.paybackYears.toFixed(1)} years`;
    document.getElementById('resultCarbon').textContent = `${opp.environmentalImpact.emissionsReductionTonsCo2PerYear.toFixed(0)} tons`;
    document.getElementById('resultScore').textContent = `${opp.feasibilityScore}/100`;
    
    // Calculate NPV (20-year, 8% discount rate)
    const npv = calculateNPV(opp);
    document.getElementById('resultNpv').textContent = `$${npv.toFixed(1)}M`;
    
    // Update tooltip for cost breakdown
    const capexElement = document.getElementById('resultCapex').parentElement;
    capexElement.title = showCostBreakdown(opp);
    
    createFinancialChart(opp);
}

// Calculate NPV based on your financial model
function calculateNPV(opportunity) {
    const discountRate = 0.08;
    const years = 20;
    const annualSavings = opportunity.financialModel.annualSavingsUsd;
    const initialCost = opportunity.infrastructureCost.totalInfrastructureCostUsd;
    
    let npv = -initialCost;
    for (let year = 1; year <= years; year++) {
        npv += annualSavings / Math.pow(1 + discountRate, year);
    }
    
    return npv / 1e6;
}

// Format cost breakdown tooltip
function showCostBreakdown(opp) {
    const costs = opp.infrastructureCost;
    return [
        `Pipeline: $${(costs.pipelineCostUsd/1e6).toFixed(2)}M`,
        `Heat Exchanger: $${(costs.heatExchangerCostUsd/1e6).toFixed(2)}M`,
        `Pump: $${(costs.pumpCostUsd/1e6).toFixed(2)}M`,
        `Integration: $${(costs.integrationCostUsd/1e6).toFixed(2)}M`,
        `TOTAL: $${(costs.totalInfrastructureCostUsd/1e6).toFixed(2)}M`
    ].join('\n');
}

// Draw route on map
function drawRoute(opp) {
    if (currentRouteLayer) {
        map.removeLayer(currentRouteLayer);
        map.removeSource(currentRouteLayer);
    }
    
    const source = sources.find(s => s.id === opp.sourceId);
    const consumer = consumers.find(c => c.id === opp.consumerId);
    
    if (!source || !consumer) return;
    
    const routeId = 'route-' + Date.now();
    currentRouteLayer = routeId;
    
    map.addSource(routeId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [
                    [source.longitude, source.latitude],
                    [consumer.longitude, consumer.latitude]
                ]
            }
        }
    });
    
    map.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': '#ff6b6b',
            'line-width': 4,
            'line-dasharray': [2, 1]
        }
    });
}

// Create financial chart
function createFinancialChart(opp) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    
    if (window.financialChart) {
        window.financialChart.destroy();
    }
    
    const annualSavings = opp.financialModel.annualSavingsUsd;
    const initialCost = opp.infrastructureCost.totalInfrastructureCostUsd;
    
    const cumulativeData = [];
    let cumulative = -initialCost;
    
    for (let year = 1; year <= 10; year++) {
        cumulative += annualSavings;
        cumulativeData.push(cumulative / 1e6);
    }
    
    window.financialChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Year 0', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'],
            datasets: [{
                label: 'Cumulative Cash Flow ($M)',
                data: [-initialCost/1e6, ...cumulativeData],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `$${context.raw.toFixed(2)}M`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => '$' + value + 'M'
                    }
                }
            }
        }
    });
}

// Load ranked opportunities
async function loadRankings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ranked-opportunities`);
        const data = await response.json();
        allRankings = data.rankings || [];
        displayRankings(allRankings);
    } catch (error) {
        console.error('Error loading rankings:', error);
    }
}

// Display rankings
function displayRankings(rankings) {
    const tbody = document.getElementById('rankingsBody');
    
    if (!rankings || rankings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No rankings available</td></tr>';
        return;
    }
    
    let html = '';
    rankings.slice(0, 10).forEach(item => {
        const opp = item.opportunity;
        html += `
            <tr onclick="selectOpportunity('${opp.sourceId}', '${opp.consumerId}')">
                <td><strong>#${item.rank}</strong></td>
                <td>${getSourceName(opp.sourceId)}</td>
                <td>${getConsumerName(opp.consumerId)}</td>
                <td>${opp.distanceKm.toFixed(1)} km</td>
                <td>${opp.financialModel.paybackYears.toFixed(1)} yrs</td>
                <td><span class="score-badge">${opp.feasibilityScore}</span></td>
                <td><button class="btn-small">View</button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Helper to get source name by ID
function getSourceName(id) {
    const source = sources.find(s => s.id === id);
    return source ? source.name : 'Unknown';
}

// Helper to get consumer name by ID
function getConsumerName(id) {
    const consumer = consumers.find(c => c.id === id);
    return consumer ? consumer.name : 'Unknown';
}

// Select opportunity from rankings
function selectOpportunity(sourceId, consumerId) {
    selectedSourceId = sourceId;
    selectedConsumerId = consumerId;
    
    document.getElementById('sourceSelect').value = sourceId;
    document.getElementById('consumerSelect').value = consumerId;
    
    highlightSelected();
    updateCalculateButton();
    calculateOpportunity();
}

// PDF generation (placeholder)
function generatePdf() {
    if (!currentOpportunity) {
        alert('Calculate an opportunity first');
        return;
    }
    
    alert('PDF generation would connect to your backend PDF service');
    // In production: fetch(`${API_BASE_URL}/api/generate-pdf`, { method: 'POST', body: JSON.stringify(currentOpportunity) })
}

// Global functions for popup buttons
window.selectSource = function(id) {
    selectedSourceId = id;
    document.getElementById('sourceSelect').value = id;
    highlightSelected();
    updateCalculateButton();
};

window.selectConsumer = function(id) {
    selectedConsumerId = id;
    document.getElementById('consumerSelect').value = id;
    highlightSelected();
    updateCalculateButton();
};
