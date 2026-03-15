// Configuration: use window.HEATGRID_API_BASE_URL when set (e.g. by Amplify / index.html for API Gateway)
const API_BASE_URL = (typeof window !== 'undefined' && window.HEATGRID_API_BASE_URL != null && window.HEATGRID_API_BASE_URL !== '')
  ? window.HEATGRID_API_BASE_URL.replace(/\/$/, '')  // no trailing slash
  : '';

// Ohio seed data fallback when API is not available (e.g. static deploy or no server)
const OHIO_HEAT_SOURCES_FALLBACK = [
  { id: "ohio-source-1", name: "Cleveland Industrial Plant", industry: "Manufacturing", latitude: 41.4993, longitude: -81.6944, estimatedWasteHeatMWhPerYear: 12000, recoverableHeatMWhPerYear: 6000, temperatureClass: "high", operatingHoursPerYear: 8760 },
  { id: "ohio-source-2", name: "Columbus Data Center", industry: "Technology", latitude: 39.9612, longitude: -82.9988, estimatedWasteHeatMWhPerYear: 8000, recoverableHeatMWhPerYear: 4000, temperatureClass: "medium", operatingHoursPerYear: 8760 },
  { id: "ohio-source-3", name: "Cincinnati Refinery", industry: "Oil & Gas", latitude: 39.1031, longitude: -84.512, estimatedWasteHeatMWhPerYear: 25000, recoverableHeatMWhPerYear: 12500, temperatureClass: "high", operatingHoursPerYear: 8760 },
  { id: "ohio-source-4", name: "Toledo Glass Factory", industry: "Manufacturing", latitude: 41.6528, longitude: -83.5378, estimatedWasteHeatMWhPerYear: 6000, recoverableHeatMWhPerYear: 3000, temperatureClass: "high", operatingHoursPerYear: 7200 },
  { id: "ohio-source-5", name: "Akron Rubber Plant", industry: "Manufacturing", latitude: 41.0814, longitude: -81.519, estimatedWasteHeatMWhPerYear: 5000, recoverableHeatMWhPerYear: 2500, temperatureClass: "medium", operatingHoursPerYear: 8760 }
];
const OHIO_HEAT_CONSUMERS_FALLBACK = [
  { id: "ohio-consumer-1", name: "Cleveland District Heating Network", category: "District Heating", latitude: 41.5052, longitude: -81.6934, annualHeatDemandMWh: 15000 },
  { id: "ohio-consumer-2", name: "Columbus Hospital Complex", category: "Healthcare", latitude: 39.9652, longitude: -83.0008, annualHeatDemandMWh: 8000 },
  { id: "ohio-consumer-3", name: "Cincinnati Apartment Complex", category: "Residential", latitude: 39.1105, longitude: -84.505, annualHeatDemandMWh: 3000 },
  { id: "ohio-consumer-4", name: "Toledo Greenhouse Facility", category: "Agriculture", latitude: 41.6588, longitude: -83.5418, annualHeatDemandMWh: 5000 },
  { id: "ohio-consumer-5", name: "Akron Food Processing Plant", category: "Food Processing", latitude: 41.0865, longitude: -81.523, annualHeatDemandMWh: 4000 }
];

/** Filter Ohio fallback by search query: name contains query (case-insensitive). Empty query = full array. */
function filterFallbackByQuery(arr, searchQuery) {
  const q = (searchQuery && typeof searchQuery === 'string') ? searchQuery.trim() : '';
  if (!q) return arr.slice();
  const normalized = q.toLowerCase();
  return arr.filter((item) => item.name && item.name.toLowerCase().includes(normalized));
}

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
let mapInitialized = false;

// 2 km range circle (yellow)
const RANGE_RADIUS_KM = 2;
const RANGE_CIRCLE_SOURCE_ID = 'range-circle-source';
const RANGE_CIRCLE_LAYER_ID = 'range-circle-layer';
const RANGE_CIRCLE_FILL_COLOR = '#eab308';

function getCirclePolygon(centerLat, centerLng, radiusKm) {
    const points = 64;
    const coords = [];
    const latDegPerKm = 1 / 111;
    const lngDegPerKm = 1 / (111 * Math.cos(centerLat * Math.PI / 180));
    for (let i = 0; i <= points; i++) {
        const angle = (2 * Math.PI * i) / points;
        coords.push([
            centerLng + radiusKm * lngDegPerKm * Math.sin(angle),
            centerLat + radiusKm * latDegPerKm * Math.cos(angle)
        ]);
    }
    return coords;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('HeatGrid initializing...');
    
    // Show loading states
    showLoading('rankingsBody', 'Loading heat sources...');
    document.getElementById('markerCounts').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    // Initialize map with fallback
    await initMap();
    
    // Load initial data (Ohio seed data)
    await loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load rankings
    await loadRankings();
});

// Show loading state helper
function showLoading(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<tr><td colspan="7" class="loading"><i class="fas fa-spinner fa-spin"></i> ${message}</td></tr>`;
    }
}

// Show error message helper
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<tr><td colspan="7" class="loading" style="color: #dc3545;">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </td></tr>`;
    }
}

// Inline OSM fallback (no external style URL = no CORS). Use when not served from backend.
const OSM_FALLBACK_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
        }
    },
    layers: [
        { id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }
    ]
};

// Initialize map with AWS Location Service (MapLibre GL JS)
async function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    if (typeof maplibregl === 'undefined') {
        mapEl.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; min-height: 400px; background: #f8f9fa; border-radius: 10px;">
                <div style="text-align: center; color: #6c757d; padding: 20px;">
                    <i class="fas fa-map-marked-alt fa-3x" style="margin-bottom: 15px;"></i>
                    <h3>Map library failed to load</h3>
                    <p>Check your connection and reload. Or open this app from <strong>http://localhost:3000</strong> after running <code>npm run dev</code>.</p>
                    <button onclick="location.reload()" class="btn-secondary" style="margin-top: 15px;"><i class="fas fa-redo"></i> Retry</button>
                </div>
            </div>
        `;
        return;
    }

    try {
        let style = OSM_FALLBACK_STYLE;

        try {
            const styleResponse = await fetch(`${API_BASE_URL}/api/map-style`);
            if (styleResponse.ok) {
                const data = await styleResponse.json();
                if (data.styleUrl) {
                    style = data.styleUrl;
                    console.log('Using AWS Location Service map');
                } else if (data.style && data.style.sources) {
                    style = data.style;
                    console.log('Using server OSM fallback map');
                }
            }
        } catch (e) {
            console.log('Using inline OSM fallback map');
        }

        map = new maplibregl.Map({
            container: 'map',
            style: style,
            center: [-82.5, 40.0],
            zoom: 7
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-left');

        map.on('load', () => {
            mapInitialized = true;
            map.resize();
            const usingAws = typeof style === 'string' && style.includes('amazonaws.com');
            new maplibregl.Popup({ closeOnClick: true })
                .setLngLat([-82.5, 40.0])
                .setHTML(`
                    <div style="padding: 10px;">
                        <h3 style="margin: 0 0 10px 0;">🔥 HeatGrid</h3>
                        <p>Welcome! Select a source and consumer to calculate heat recovery opportunities.</p>
                        <p style="font-size: 0.9em; color: #666;">
                            ${usingAws ? '✓ Using AWS Location Service' : '✓ Map ready'}
                        </p>
                    </div>
                `)
                .addTo(map);
        });

        map.on('error', (e) => {
            console.error('Map error:', e);
        });
    } catch (error) {
        console.error('Failed to initialize map:', error);
        mapEl.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; min-height: 400px; background: #f8f9fa; border-radius: 10px;">
                <div style="text-align: center; color: #6c757d; padding: 20px;">
                    <i class="fas fa-map-marked-alt fa-3x" style="margin-bottom: 15px;"></i>
                    <h3>Map failed to load</h3>
                    <p>For the best experience, run <code>npm run dev</code> and open <strong>http://localhost:3000</strong>.</p>
                    <button onclick="location.reload()" class="btn-secondary" style="margin-top: 15px;"><i class="fas fa-redo"></i> Retry</button>
                </div>
            </div>
        `;
    }
}

// Load data from backend
async function loadData(searchQuery = '') {
    try {
        showLoading('rankingsBody', 'Loading heat sources and consumers...');
        
        let sourcesUrl = `${API_BASE_URL}/api/heat-sources`;
        let consumersUrl = `${API_BASE_URL}/api/heat-consumers`;
        
        if (searchQuery) {
            sourcesUrl += `?locationSearchQuery=${encodeURIComponent(searchQuery)}`;
            consumersUrl += `?locationSearchQuery=${encodeURIComponent(searchQuery)}`;
            console.log(`Searching for: ${searchQuery}`);
        }
        
        // Fetch both in parallel with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const [sourcesResponse, consumersResponse] = await Promise.all([
            fetch(sourcesUrl, { signal: controller.signal }).catch(() => ({ ok: false, status: 404 })),
            fetch(consumersUrl, { signal: controller.signal }).catch(() => ({ ok: false, status: 404 }))
        ]);
        
        clearTimeout(timeoutId);
        
        // Handle responses with fallbacks
        let sourcesData = { heatSources: [] };
        let consumersData = { heatConsumers: [] };
        
        if (sourcesResponse.ok) {
            sourcesData = await sourcesResponse.json();
        } else {
            console.warn('API not available for sources, using Ohio seed fallback');
        }
        
        if (consumersResponse.ok) {
            consumersData = await consumersResponse.json();
        } else {
            console.warn('API not available for consumers, using Ohio seed fallback');
        }
        
        // Update global variables; use Ohio fallback when API returned no data (filtered by search)
        sources = (sourcesData.heatSources && sourcesData.heatSources.length) ? (sourcesData.heatSources || []) : filterFallbackByQuery(OHIO_HEAT_SOURCES_FALLBACK, searchQuery);
        consumers = (consumersData.heatConsumers && consumersData.heatConsumers.length) ? (consumersData.heatConsumers || []) : filterFallbackByQuery(OHIO_HEAT_CONSUMERS_FALLBACK, searchQuery);
        
        console.log(`Loaded ${sources.length} sources, ${consumers.length} consumers`);
        
        // Update UI
        if (mapInitialized) {
            updateMarkers();
        }
        updateSelectors();
        updateMarkerCounts();
        
        // Show message if no data
        if (sources.length === 0 && consumers.length === 0) {
            showError('rankingsBody', 'No heat sources or consumers found. Try a different search.');
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        sources = OHIO_HEAT_SOURCES_FALLBACK;
        consumers = OHIO_HEAT_CONSUMERS_FALLBACK;
        if (mapInitialized) updateMarkers();
        updateSelectors();
        updateMarkerCounts();
        showError('rankingsBody', 'Using Ohio seed data (API unavailable).');
    }
}

// Update map markers
function updateMarkers() {
    if (!map || !mapInitialized) {
        console.warn('Map not ready, skipping markers');
        return;
    }
    
    // Clear existing markers
    sourceMarkers.forEach(m => m.marker.remove());
    consumerMarkers.forEach(m => m.marker.remove());
    sourceMarkers = [];
    consumerMarkers = [];
    
    // Add source markers (red)
    sources.forEach(source => {
        // Validate coordinates
        if (!source.longitude || !source.latitude) {
            console.warn('Source missing coordinates:', source);
            return;
        }
        
        const popupContent = `
            <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #ff4d4d;">🏭 ${source.name || 'Unnamed Source'}</h3>
                <p><strong>Industry:</strong> ${source.industry || 'Industrial'}</p>
                <p><strong>Waste Heat:</strong> ${(source.estimatedWasteHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
                <p><strong>Recoverable:</strong> ${(source.recoverableHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
                <p><strong>Temperature:</strong> ${source.temperatureClass || 'medium'}</p>
                <button onclick="window.selectSource('${source.id}')" 
                    style="width:100%; padding:8px; background:#ff4d4d; color:white; border:none; border-radius:5px; cursor:pointer; margin-top:10px;">
                    <i class="fas fa-check"></i> Select This Source
                </button>
            </div>
        `;
        
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);
        
        const marker = new maplibregl.Marker({ color: '#ff4d4d' })
            .setLngLat([source.longitude, source.latitude])
            .setPopup(popup)
            .addTo(map);
        
        sourceMarkers.push({ marker, id: source.id, data: source });
    });
    
    // Add consumer markers (blue)
    consumers.forEach(consumer => {
        // Validate coordinates
        if (!consumer.longitude || !consumer.latitude) {
            console.warn('Consumer missing coordinates:', consumer);
            return;
        }
        
        const popupContent = `
            <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #4d79ff;">🏢 ${consumer.name || 'Unnamed Consumer'}</h3>
                <p><strong>Category:</strong> ${consumer.category || 'Building'}</p>
                <p><strong>Heat Demand:</strong> ${(consumer.annualHeatDemandMWh / 1000).toFixed(1)} GWh/year</p>
                <button onclick="window.selectConsumer('${consumer.id}')" 
                    style="width:100%; padding:8px; background:#4d79ff; color:white; border:none; border-radius:5px; cursor:pointer; margin-top:10px;">
                    <i class="fas fa-check"></i> Select This Consumer
                </button>
            </div>
        `;
        
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);
        
        const marker = new maplibregl.Marker({ color: '#4d79ff' })
            .setLngLat([consumer.longitude, consumer.latitude])
            .setPopup(popup)
            .addTo(map);
        
        consumerMarkers.push({ marker, id: consumer.id, data: consumer });
    });
    
    console.log(`Added ${sourceMarkers.length} source markers, ${consumerMarkers.length} consumer markers`);
}

// Update dropdown selectors
function updateSelectors() {
    const sourceSelect = document.getElementById('sourceSelect');
    const consumerSelect = document.getElementById('consumerSelect');
    
    if (!sourceSelect || !consumerSelect) return;
    
    // Update sources dropdown
    sourceSelect.innerHTML = '<option value="">Select a source...</option>';
    sources.forEach(source => {
        if (source.id && source.name) {
            sourceSelect.innerHTML += `<option value="${source.id}">${source.name} (${(source.recoverableHeatMWhPerYear / 1000).toFixed(1)} GWh)</option>`;
        }
    });
    
    // Update consumers dropdown
    consumerSelect.innerHTML = '<option value="">Select a consumer...</option>';
    consumers.forEach(consumer => {
        if (consumer.id && consumer.name) {
            consumerSelect.innerHTML += `<option value="${consumer.id}">${consumer.name} (${(consumer.annualHeatDemandMWh / 1000).toFixed(1)} GWh)</option>`;
        }
    });
    
    // Enable/disable calculate button based on selections
    updateCalculateButton();
}

// Update marker counts in UI
function updateMarkerCounts() {
    const markerCounts = document.getElementById('markerCounts');
    if (markerCounts) {
        markerCounts.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${sourceMarkers.length} sources, ${consumerMarkers.length} consumers`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const query = (document.getElementById('locationSearch').value || '').trim();
            await loadData(query || '');
            await loadRankings(query || '');
        });
    }
    
    // Source selection
    const sourceSelect = document.getElementById('sourceSelect');
    if (sourceSelect) {
        sourceSelect.addEventListener('change', (e) => {
            selectedSourceId = e.target.value;
            highlightSelected();
            updateCalculateButton();
            
            // Auto-open popup for selected source
            if (selectedSourceId) {
                const marker = sourceMarkers.find(m => m.id === selectedSourceId);
                if (marker) marker.marker.togglePopup();
            }
        });
    }
    
    // Consumer selection
    const consumerSelect = document.getElementById('consumerSelect');
    if (consumerSelect) {
        consumerSelect.addEventListener('change', (e) => {
            selectedConsumerId = e.target.value;
            highlightSelected();
            updateCalculateButton();
            
            // Auto-open popup for selected consumer
            if (selectedConsumerId) {
                const marker = consumerMarkers.find(m => m.id === selectedConsumerId);
                if (marker) marker.marker.togglePopup();
            }
        });
    }
    
    // Calculate button
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateOpportunity);
    }
    
    // Fit markers button
    const fitBtn = document.getElementById('fitMarkersBtn');
    if (fitBtn) {
        fitBtn.addEventListener('click', fitMarkersToBounds);
    }
    
    // PDF generation button
    const pdfBtn = document.getElementById('generatePdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', generatePdf);
    }
    
    // Enter key in search
    const searchInput = document.getElementById('locationSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn')?.click();
            }
        });
    }
    
    // Share button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            alert('Share feature coming soon! For now, copy the URL.');
        });
    }
}

// Update calculate button state
function updateCalculateButton() {
    const btn = document.getElementById('calculateBtn');
    if (btn) {
        btn.disabled = !selectedSourceId || !selectedConsumerId;
    }
}

// Update 2 km range circle on map (yellow fill)
function updateRangeCircle() {
    if (!map || !mapInitialized) return;
    if (map.getLayer(RANGE_CIRCLE_LAYER_ID)) map.removeLayer(RANGE_CIRCLE_LAYER_ID);
    if (map.getSource(RANGE_CIRCLE_SOURCE_ID)) map.removeSource(RANGE_CIRCLE_SOURCE_ID);
    let centerLat = null, centerLng = null;
    if (selectedSourceId) {
        const s = sources.find(x => x.id === selectedSourceId);
        if (s && s.latitude != null && s.longitude != null) { centerLat = s.latitude; centerLng = s.longitude; }
    }
    if (centerLat == null && selectedConsumerId) {
        const c = consumers.find(x => x.id === selectedConsumerId);
        if (c && c.latitude != null && c.longitude != null) { centerLat = c.latitude; centerLng = c.longitude; }
    }
    if (centerLat == null || centerLng == null) return;
    const ring = getCirclePolygon(centerLat, centerLng, RANGE_RADIUS_KM);
    map.addSource(RANGE_CIRCLE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } }
    });
    map.addLayer({
        id: RANGE_CIRCLE_LAYER_ID,
        type: 'fill',
        source: RANGE_CIRCLE_SOURCE_ID,
        paint: {
            'fill-color': RANGE_CIRCLE_FILL_COLOR,
            'fill-opacity': 0.2
        }
    });
}

// Highlight selected markers
function highlightSelected() {
    updateRangeCircle();
    // Reset all marker colors
    sourceMarkers.forEach(({ marker }) => {
        marker.getElement().style.filter = 'none';
        marker.getElement().style.opacity = '0.7';
    });
    consumerMarkers.forEach(({ marker }) => {
        marker.getElement().style.filter = 'none';
        marker.getElement().style.opacity = '0.7';
    });
    
    // Highlight selected source
    if (selectedSourceId) {
        const selected = sourceMarkers.find(m => m.id === selectedSourceId);
        if (selected) {
            selected.marker.getElement().style.filter = 'drop-shadow(0 0 10px gold)';
            selected.marker.getElement().style.opacity = '1';
        }
    }
    
    // Highlight selected consumer
    if (selectedConsumerId) {
        const selected = consumerMarkers.find(m => m.id === selectedConsumerId);
        if (selected) {
            selected.marker.getElement().style.filter = 'drop-shadow(0 0 10px gold)';
            selected.marker.getElement().style.opacity = '1';
        }
    }
}

// Fit map to show all markers
function fitMarkersToBounds() {
    if (!map || !mapInitialized) return;
    
    if (sourceMarkers.length === 0 && consumerMarkers.length === 0) {
        alert('No markers to fit');
        return;
    }
    
    const bounds = new maplibregl.LngLatBounds();
    
    sourceMarkers.forEach(({ marker }) => {
        bounds.extend(marker.getLngLat());
    });
    
    consumerMarkers.forEach(({ marker }) => {
        bounds.extend(marker.getLngLat());
    });
    
    map.fitBounds(bounds, { padding: 50, duration: 1000 });
}

// Calculate opportunity for selected source and consumer
async function calculateOpportunity() {
    if (!selectedSourceId || !selectedConsumerId) return;
    
    // Show loading state
    const calculateBtn = document.getElementById('calculateBtn');
    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
    calculateBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/evaluate-opportunity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId: selectedSourceId,
                consumerId: selectedConsumerId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentOpportunity = data.opportunity;
        
        console.log('Opportunity calculated:', currentOpportunity);
        
        // Display results
        displayOpportunityResults(currentOpportunity);
        
        // Draw route on map
        drawRoute(currentOpportunity);
        
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error calculating opportunity:', error);
        alert('Failed to calculate opportunity. Using demo data instead.');
        
        // Create demo opportunity for testing
        createDemoOpportunity();
        
    } finally {
        // Restore button
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
    }
}

// Create demo opportunity for testing when API fails
function createDemoOpportunity() {
    const source = sources.find(s => s.id === selectedSourceId);
    const consumer = consumers.find(c => c.id === selectedConsumerId);
    
    if (!source || !consumer) return;
    
    const distance = calculateHaversineDistance(
        source.latitude, source.longitude,
        consumer.latitude, consumer.longitude
    );
    
    currentOpportunity = {
        id: `demo-${selectedSourceId}-${selectedConsumerId}`,
        sourceId: selectedSourceId,
        consumerId: selectedConsumerId,
        distanceKm: distance,
        estimatedWasteHeatMWhPerYear: source.estimatedWasteHeatMWhPerYear || 10000,
        recoverableHeatMWhPerYear: source.recoverableHeatMWhPerYear || 5000,
        infrastructureCost: {
            pipelineCostUsd: distance * 2000000,
            heatExchangerCostUsd: distance * 800000,
            pumpCostUsd: distance * 400000,
            integrationCostUsd: distance * 600000,
            totalInfrastructureCostUsd: distance * 3800000
        },
        financialModel: {
            annualEnergyRecoveredMWh: Math.min(
                source.recoverableHeatMWhPerYear || 5000,
                consumer.annualHeatDemandMWh || 3000
            ),
            annualSavingsUsd: Math.min(
                source.recoverableHeatMWhPerYear || 5000,
                consumer.annualHeatDemandMWh || 3000
            ) * 50,
            paybackYears: (distance * 3800000) / (Math.min(
                source.recoverableHeatMWhPerYear || 5000,
                consumer.annualHeatDemandMWh || 3000
            ) * 50)
        },
        environmentalImpact: {
            emissionsReductionTonsCo2PerYear: Math.min(
                source.recoverableHeatMWhPerYear || 5000,
                consumer.annualHeatDemandMWh || 3000
            ) * 0.4
        },
        feasibilityScore: Math.round(100 - (distance * 2))
    };
    
    displayOpportunityResults(currentOpportunity);
    drawRoute(currentOpportunity);
    
    document.getElementById('resultsSection').style.display = 'block';
}

// Calculate Haversine distance (fallback)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Display opportunity results
function displayOpportunityResults(opp) {
    if (!opp) return;
    
    // Helper to safely get values with fallbacks
    const getValue = (obj, path, fallback = '0.0') => {
        try {
            const parts = path.split('.');
            let value = obj;
            for (const part of parts) {
                if (value === undefined || value === null) return fallback;
                value = value[part];
            }
            return value !== undefined && value !== null ? value : fallback;
        } catch {
            return fallback;
        }
    };
    
    // Update UI with safe value access
    document.getElementById('resultDistance').textContent = 
        `${parseFloat(getValue(opp, 'distanceKm', 0)).toFixed(1)} km`;
    
    const totalCost = parseFloat(getValue(opp, 'infrastructureCost.totalInfrastructureCostUsd', 0));
    document.getElementById('resultCapex').textContent = 
        `$${(totalCost / 1e6).toFixed(1)}M`;
    
    // Add tooltip with breakdown
    const capexCard = document.getElementById('resultCapex').parentElement;
    if (capexCard) {
        const pipeline = parseFloat(getValue(opp, 'infrastructureCost.pipelineCostUsd', 0)) / 1e6;
        const exchanger = parseFloat(getValue(opp, 'infrastructureCost.heatExchangerCostUsd', 0)) / 1e6;
        const pump = parseFloat(getValue(opp, 'infrastructureCost.pumpCostUsd', 0)) / 1e6;
        const integration = parseFloat(getValue(opp, 'infrastructureCost.integrationCostUsd', 0)) / 1e6;
        
        capexCard.title = [
            `Pipeline: $${pipeline.toFixed(2)}M`,
            `Heat Exchanger: $${exchanger.toFixed(2)}M`,
            `Pump: $${pump.toFixed(2)}M`,
            `Integration: $${integration.toFixed(2)}M`,
            `TOTAL: $${(pipeline + exchanger + pump + integration).toFixed(2)}M`
        ].join('\n');
    }
    
    document.getElementById('resultPayback').textContent = 
        `${parseFloat(getValue(opp, 'financialModel.paybackYears', 0)).toFixed(1)} years`;
    
    document.getElementById('resultCarbon').textContent = 
        `${parseInt(getValue(opp, 'environmentalImpact.emissionsReductionTonsCo2PerYear', 0))} tons`;
    
    document.getElementById('resultScore').textContent = 
        `${parseInt(getValue(opp, 'feasibilityScore', 0))}/100`;
    
    // Calculate NPV
    const annualSavings = parseFloat(getValue(opp, 'financialModel.annualSavingsUsd', 0));
    const npv = calculateNPV(totalCost, annualSavings);
    document.getElementById('resultNpv').textContent = `$${npv.toFixed(1)}M`;
    
    // Create chart
    createFinancialChart(totalCost, annualSavings);
}

// Calculate NPV
function calculateNPV(initialCost, annualSavings, discountRate = 0.08, years = 20) {
    let npv = -initialCost;
    for (let year = 1; year <= years; year++) {
        npv += annualSavings / Math.pow(1 + discountRate, year);
    }
    return npv / 1e6;
}

// Draw route on map
function drawRoute(opp) {
    if (!map || !mapInitialized) return;
    
    // Remove existing route
    if (currentRouteLayer) {
        try {
            map.removeLayer(currentRouteLayer);
            map.removeSource(currentRouteLayer);
        } catch (e) {
            console.warn('Error removing old route:', e);
        }
    }
    
    const source = sources.find(s => s.id === opp.sourceId);
    const consumer = consumers.find(c => c.id === opp.consumerId);
    
    if (!source || !consumer) return;
    
    const routeId = 'route-' + Date.now();
    currentRouteLayer = routeId;
    
    try {
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
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ff6b6b',
                'line-width': 4,
                'line-dasharray': [2, 1]
            }
        });
        
        // Fit bounds to show the route
        const bounds = new maplibregl.LngLatBounds()
            .extend([source.longitude, source.latitude])
            .extend([consumer.longitude, consumer.latitude]);
        
        map.fitBounds(bounds, { padding: 100, duration: 1000 });
        
    } catch (error) {
        console.error('Error drawing route:', error);
    }
}

// Create financial chart
function createFinancialChart(initialCost, annualSavings) {
    const ctx = document.getElementById('financialChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (window.financialChart) {
        window.financialChart.destroy();
    }
    
    // Calculate cumulative cash flow
    const cumulativeData = [];
    let cumulative = -initialCost;
    
    for (let year = 1; year <= 10; year++) {
        cumulative += annualSavings;
        cumulativeData.push(cumulative / 1e6);
    }
    
    window.financialChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'],
            datasets: [{
                label: 'Cumulative Cash Flow ($M)',
                data: cumulativeData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return ` $${context.raw.toFixed(2)}M`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: (value) => '$' + value + 'M'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Load ranked opportunities (optional searchQuery filters to that location, e.g. Toledo or Columbus)
async function loadRankings(searchQuery) {
    try {
        let url = `${API_BASE_URL}/api/ranked-opportunities`;
        if (searchQuery && String(searchQuery).trim()) {
            url += `?locationSearchQuery=${encodeURIComponent(String(searchQuery).trim())}`;
        }
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allRankings = data.rankings || [];
        displayRankings(allRankings);
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        showError('rankingsBody', 'Failed to load rankings. Using demo data.');
        
        // Create demo rankings
        createDemoRankings();
    }
}

// Create demo rankings for testing
function createDemoRankings() {
    if (sources.length === 0 || consumers.length === 0) return;
    
    const demoRankings = [];
    
    for (let i = 0; i < Math.min(5, sources.length); i++) {
        for (let j = 0; j < Math.min(2, consumers.length); j++) {
            const source = sources[i];
            const consumer = consumers[j];
            
            if (!source || !consumer) continue;
            
            const distance = calculateHaversineDistance(
                source.latitude, source.longitude,
                consumer.latitude, consumer.longitude
            );
            
            demoRankings.push({
                rank: demoRankings.length + 1,
                opportunity: {
                    sourceId: source.id,
                    consumerId: consumer.id,
                    distanceKm: distance,
                    financialModel: {
                        paybackYears: distance * 0.5 + 2
                    },
                    feasibilityScore: Math.round(100 - distance)
                }
            });
        }
    }
    
    displayRankings(demoRankings);
}

// Display rankings
function displayRankings(rankings) {
    const tbody = document.getElementById('rankingsBody');
    if (!tbody) return;
    
    if (!rankings || rankings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No rankings available</td></tr>';
        return;
    }
    
    let html = '';
    rankings.slice(0, 10).forEach((item, index) => {
        const opp = item.opportunity;
        const sourceName = getSourceName(opp.sourceId);
        const consumerName = getConsumerName(opp.consumerId);
        
        html += `
            <tr onclick="selectOpportunity('${opp.sourceId}', '${opp.consumerId}')">
                <td><strong>#${item.rank || index + 1}</strong></td>
                <td>${sourceName}</td>
                <td>${consumerName}</td>
                <td>${(opp.distanceKm || 0).toFixed(1)} km</td>
                <td>${(opp.financialModel?.paybackYears || 0).toFixed(1)} yrs</td>
                <td><span class="score-badge">${opp.feasibilityScore || 0}</span></td>
                <td><button class="btn-small" onclick="event.stopPropagation(); selectOpportunity('${opp.sourceId}', '${opp.consumerId}')">
                    <i class="fas fa-eye"></i> View
                </button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Helper to get source name by ID
function getSourceName(id) {
    const source = sources.find(s => s.id === id);
    return source ? source.name : 'Unknown Source';
}

// Helper to get consumer name by ID
function getConsumerName(id) {
    const consumer = consumers.find(c => c.id === id);
    return consumer ? consumer.name : 'Unknown Consumer';
}

// Select opportunity from rankings
function selectOpportunity(sourceId, consumerId) {
    selectedSourceId = sourceId;
    selectedConsumerId = consumerId;
    
    const sourceSelect = document.getElementById('sourceSelect');
    const consumerSelect = document.getElementById('consumerSelect');
    
    if (sourceSelect) sourceSelect.value = sourceId;
    if (consumerSelect) consumerSelect.value = consumerId;
    
    highlightSelected();
    updateCalculateButton();
    calculateOpportunity();
}

// PDF generation
function generatePdf() {
    if (!currentOpportunity) {
        alert('Please calculate an opportunity first');
        return;
    }
    
    // Simple PDF generation alert
    alert('📄 PDF Report Generated!\n\n' +
          'In a production environment, this would download a detailed report with:\n' +
          `- Distance: ${currentOpportunity.distanceKm.toFixed(1)} km\n` +
          `- CAPEX: $${(currentOpportunity.infrastructureCost.totalInfrastructureCostUsd/1e6).toFixed(1)}M\n` +
          `- Payback: ${currentOpportunity.financialModel.paybackYears.toFixed(1)} years\n` +
          `- CO₂ Saved: ${currentOpportunity.environmentalImpact.emissionsReductionTonsCo2PerYear.toFixed(0)} tons/year\n` +
          `- Feasibility Score: ${currentOpportunity.feasibilityScore}/100`);
}

// Global functions for popup buttons
window.selectSource = function(id) {
    selectedSourceId = id;
    const sourceSelect = document.getElementById('sourceSelect');
    if (sourceSelect) sourceSelect.value = id;
    highlightSelected();
    updateCalculateButton();
};

window.selectConsumer = function(id) {
    selectedConsumerId = id;
    const consumerSelect = document.getElementById('consumerSelect');
    if (consumerSelect) consumerSelect.value = id;
    highlightSelected();
    updateCalculateButton();
};
