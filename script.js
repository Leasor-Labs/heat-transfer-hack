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

// Global variables
let map;
let sources = [];
let consumers = [];
let sourceMarkers = [];
let consumerMarkers = [];
let selectedSourceId = null;
let selectedConsumerId = null;
let lastOpenSourcePopup = null;
let lastOpenConsumerPopup = null;
let currentRouteLayer = null;
let currentOpportunity = null;
let allRankings = [];
let mapInitialized = false;

// All tags from database (industries + categories) for search autocomplete
let allTags = { industries: [], categories: [] };

// Location suggestions for autocomplete: city, region, or address (e.g. Toledo, OH)
const LOCATION_SUGGESTIONS_STATIC = [
    'Toledo, OH', 'Cleveland, OH', 'Columbus, OH', 'Cincinnati, OH', 'Akron, OH',
    'Ohio', 'Toledo', 'Cleveland', 'Columbus', 'Cincinnati', 'Akron',
    'Dayton, OH', 'Youngstown, OH', 'Canton, OH', 'Parma, OH'
];

// Autocomplete: city, region, or address only (no industry/category/site)
const SUGGESTION_TYPE = { location: 'location' };

function getLocationSuggestions(query) {
    const q = (query || '').trim().toLowerCase();
    const seen = new Set();
    const result = [];

    function addLocation(value) {
        const v = value && String(value).trim();
        if (!v || seen.has(v.toLowerCase())) return;
        seen.add(v.toLowerCase());
        result.push({ value: v, type: SUGGESTION_TYPE.location });
    }

    LOCATION_SUGGESTIONS_STATIC.forEach(addLocation);
    sources.forEach(s => {
        if (s.city) addLocation(s.city + (s.region ? ', ' + s.region : ''));
    });
    consumers.forEach(c => {
        if (c.city) addLocation(c.city + (c.region ? ', ' + c.region : ''));
    });

    let list = result;
    if (q) list = result.filter(({ value }) => value.toLowerCase().includes(q));
    return list.slice(0, 20);
}

function showAutocomplete(query) {
    const listEl = document.getElementById('autocompleteList');
    if (!listEl) return;
    const suggestions = getLocationSuggestions(query);
    listEl.innerHTML = suggestions.map((s, i) => {
        const safeValue = (s.value || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<li class="autocomplete-item" data-index="${i}" data-value="${safeValue}" data-type="location" role="option">
            <span class="autocomplete-item-value">${safeValue}</span>
        </li>`;
    }).join('');
    listEl.setAttribute('aria-hidden', suggestions.length === 0 ? 'true' : 'false');
    if (suggestions.length > 0) {
        listEl.style.display = 'block';
        const items = listEl.querySelectorAll('.autocomplete-item');
        items.forEach((el, i) => {
            if (i === 0) el.classList.add('active');
            el.addEventListener('click', () => {
                const input = document.getElementById('locationSearch');
                if (input) {
                    input.value = el.getAttribute('data-value');
                    listEl.setAttribute('aria-hidden', 'true');
                    listEl.style.display = 'none';
                    document.getElementById('searchBtn')?.click();
                }
            });
        });
    } else {
        listEl.style.display = 'none';
    }
}

function hideAutocomplete() {
    const listEl = document.getElementById('autocompleteList');
    if (listEl) {
        listEl.setAttribute('aria-hidden', 'true');
        listEl.style.display = 'none';
    }
}

// Fetch all tags (industries + categories) from API for search autocomplete
async function fetchTags() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/tags`);
        if (res.ok) {
            const data = await res.json();
            allTags = { industries: data.industries || [], categories: data.categories || [] };
        }
    } catch (e) {
        console.warn('Could not fetch tags for search:', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('HeatGrid initializing...');
    
    // Refresh DynamoDB from Location Service on page load (fire-and-forget)
    if (API_BASE_URL) {
        fetch(API_BASE_URL + '/api/refresh-seed-from-location').catch(() => {});
    }
    
    // No initial data load — map loads with no markers until user searches
    showLoading('rankingsBody', 'Enter a location and click Search to load data.');
    document.getElementById('markerCounts').innerHTML = '<i class="fas fa-map-marker-alt"></i> 0 sources, 0 consumers';
    
    // Fetch tags so search has access to all database tags
    await fetchTags();
    
    // Initialize map with fallback (no markers on first load)
    await initMap();
    
    // Setup event listeners
    setupEventListeners();
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

// Show or hide the red error message under the search bar (e.g. "Toledo, OH not found")
function showSearchBanner(message, isError) {
    const el = document.getElementById('searchBanner');
    if (!el) return;
    if (!message || !isError) {
        el.style.display = 'none';
        el.textContent = '';
        el.className = 'search-banner';
        return;
    }
    el.textContent = message;
    el.className = 'search-banner search-banner-error';
    el.style.display = 'block';
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
            if (sources.length > 0 || consumers.length > 0) {
                updateMarkers();
                fitMarkersToBounds();
            }
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
        
        const apiSources = (sourcesData.heatSources && sourcesData.heatSources.length) ? (sourcesData.heatSources || []) : [];
        const apiConsumers = (consumersData.heatConsumers && consumersData.heatConsumers.length) ? (consumersData.heatConsumers || []) : [];
        const searchWasUsed = searchQuery.length > 0;

        sources = searchWasUsed ? apiSources : (apiSources.length ? apiSources : OHIO_HEAT_SOURCES_FALLBACK);
        consumers = searchWasUsed ? apiConsumers : (apiConsumers.length ? apiConsumers : OHIO_HEAT_CONSUMERS_FALLBACK);

        if (searchWasUsed && sources.length === 0 && consumers.length === 0) {
            showSearchBanner(searchQuery + ' not found', true);
        } else {
            showSearchBanner('', false);
        }
        
        console.log(`Loaded ${sources.length} sources, ${consumers.length} consumers`);
        
        // When a location is searched and found: only markers that fit the search are in sources/consumers.
        // updateMarkers() removes all existing markers and adds only these (removing any that don't fit).
        // Then zoom and pan so the map fits all active markers.
        if (mapInitialized) {
            updateMarkers();
            if (sourceMarkers.length > 0 || consumerMarkers.length > 0) {
                fitMarkersToBounds();
            }
        }
        updateSelectors();
        updateMarkerCounts();
        
        // Show message if no data
        if (sources.length === 0 && consumers.length === 0 && !searchWasUsed) {
            showError('rankingsBody', 'No heat sources or consumers found. Try a different search.');
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        sources = OHIO_HEAT_SOURCES_FALLBACK;
        consumers = OHIO_HEAT_CONSUMERS_FALLBACK;
        showSearchBanner('', false);
        if (mapInitialized) updateMarkers();
        updateSelectors();
        updateMarkerCounts();
        showError('rankingsBody', 'Using Ohio seed data (API unavailable).');
    }
}

// Update map markers: remove all existing markers, then add only the current sources/consumers
// (so after a search, only markers that fit the search query remain)
function updateMarkers() {
    if (!map || !mapInitialized) {
        console.warn('Map not ready, skipping markers');
        return;
    }
    
    sourceMarkers.forEach(m => m.marker.remove());
    consumerMarkers.forEach(m => m.marker.remove());
    sourceMarkers = [];
    consumerMarkers = [];
    
    // Add source markers (red)
    sources.forEach(source => {
        if (!source.longitude || !source.latitude) {
            console.warn('Source missing coordinates:', source);
            return;
        }
        const popupContent = `
                <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #ff0000;">🏭 ${source.name || 'Unnamed Source'}</h3>
                <p style='color:#000;'><strong>Industry:</strong> ${source.industry || 'Industrial'}</p>
                <p style='color:#000;'><strong>Waste Heat:</strong> ${(source.estimatedWasteHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
                <p style='color:#000;'><strong>Recoverable:</strong> ${(source.recoverableHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
                <p style='color:#000;'><strong>Temperature:</strong> ${source.temperatureClass || 'medium'}</p>
                <button onclick="window.selectSource('${source.id}')" 
                    style="width:100%; padding:8px; background:#ff0000; color:white; border:none; border-radius:5px; cursor:pointer; margin-top:10px;">
                    <i class="fas fa-check"></i> Select This Source
                </button>
            </div>
        `;
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);
        popup.on('open', () => {
            if (lastOpenSourcePopup && lastOpenSourcePopup !== popup) {
                lastOpenSourcePopup.remove();
            }
            lastOpenSourcePopup = popup;
        });
        const marker = new maplibregl.Marker({ color: '#ff0000' })
            .setLngLat([source.longitude, source.latitude])
            .setPopup(popup)
            .addTo(map);
        sourceMarkers.push({ marker, id: source.id, data: source });
    });
    
    // Add consumer markers (blue)
    consumers.forEach(consumer => {
        if (!consumer.longitude || !consumer.latitude) {
            console.warn('Consumer missing coordinates:', consumer);
            return;
        }
        const popupContent = `
                <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #007bff;">🏢 ${consumer.name || 'Unnamed Consumer'}</h3>
                <p style='color:#000;'><strong>Category:</strong> ${consumer.category || 'Building'}</p>
                <p style='color:#000;'><strong>Heat Demand:</strong> ${(consumer.annualHeatDemandMWh / 1000).toFixed(1)} GWh/year</p>
                <button onclick="window.selectConsumer('${consumer.id}')" 
                    style="width:100%; padding:8px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; margin-top:10px;">
                    <i class="fas fa-check"></i> Select This Consumer
                </button>
            </div>
        `;
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);
        popup.on('open', () => {
            if (lastOpenConsumerPopup && lastOpenConsumerPopup !== popup) {
                lastOpenConsumerPopup.remove();
            }
            lastOpenConsumerPopup = popup;
        });
        const marker = new maplibregl.Marker({ color: '#007bff' })
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
    // Mark as empty (placeholder shown) when no selection
    if (sourceSelect.value === '' || !sourceSelect.value) {
        sourceSelect.classList.add('empty');
    } else {
        sourceSelect.classList.remove('empty');
    }
    
    // Update consumers dropdown
    consumerSelect.innerHTML = '<option value="">Select a consumer...</option>';
    consumers.forEach(consumer => {
        if (consumer.id && consumer.name) {
            consumerSelect.innerHTML += `<option value="${consumer.id}">${consumer.name} (${(consumer.annualHeatDemandMWh / 1000).toFixed(1)} GWh)</option>`;
        }
    });
    // Mark as empty (placeholder shown) when no selection
    if (consumerSelect.value === '' || !consumerSelect.value) {
        consumerSelect.classList.add('empty');
    } else {
        consumerSelect.classList.remove('empty');
    }
    
    // Enable/disable calculate button based on selections
    updateCalculateButton();
}

// Update marker counts in UI (use data lengths so count is correct even before map is ready)
function updateMarkerCounts() {
    const markerCounts = document.getElementById('markerCounts');
    if (markerCounts) {
        markerCounts.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${sources.length} sources, ${consumers.length} consumers`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search button: blank query does nothing and clears any markers; non-blank runs search
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const query = (document.getElementById('locationSearch').value || '').trim();
            if (!query) {
                sources = [];
                consumers = [];
                showSearchBanner('', false);
                if (mapInitialized) updateMarkers();
                updateSelectors();
                updateMarkerCounts();
                return;
            }
            await loadData(query);
            // Open popup showing DynamoDB data (same query as search)
            const popupUrl = window.location.origin + '/src/temp-popup/popup.html' + (query ? '?q=' + encodeURIComponent(query) : '');
            window.open(popupUrl, 'dynamodb-popup', 'width=720,height=620,scrollbars=yes,resizable=yes');
        });
    }
    
    // Source selection
    const sourceSelect = document.getElementById('sourceSelect');
    if (sourceSelect) {
        sourceSelect.addEventListener('change', (e) => {
            selectedSourceId = e.target.value;
            highlightSelected();
            updateCalculateButton();
            // toggle empty class so placeholder shows as white background when no selection
            if (e.target.value === '') e.target.classList.add('empty'); else e.target.classList.remove('empty');
            
            // Auto-open popup for selected source
            if (selectedSourceId) {
                const markerObj = sourceMarkers.find(m => m.id === selectedSourceId);
                if (markerObj) {
                    // Remove select button for dropdown-triggered popup
                    const popupContent = `
                        <div style="padding: 10px; min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #ff0000;">🏭 ${markerObj.data.name || 'Unnamed Source'}</h3>
                        <p style='color:#000;'><strong>Industry:</strong> ${markerObj.data.industry || 'Industrial'}</p>
                        <p style='color:#000;'><strong>Waste Heat:</strong> ${(markerObj.data.estimatedWasteHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
                        <p style='color:#000;'><strong>Recoverable:</strong> ${(markerObj.data.recoverableHeatMWhPerYear / 1000).toFixed(1)} GWh/year</p>
                        <p style='color:#000;'><strong>Temperature:</strong> ${markerObj.data.temperatureClass || 'medium'}</p>
                        </div>
                    `;
                    markerObj.marker.getPopup().setHTML(popupContent);
                    markerObj.marker.togglePopup();
                }
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
                const markerObj = consumerMarkers.find(m => m.id === selectedConsumerId);
                if (markerObj) {
                    // Remove select button for dropdown-triggered popup
                    const popupContent = `
                        <div style="padding: 10px; min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #007bff;">🏢 ${markerObj.data.name || 'Unnamed Consumer'}</h3>
                        <p style='color:#000;'><strong>Category:</strong> ${markerObj.data.category || 'Building'}</p>
                        <p style='color:#000;'><strong>Heat Demand:</strong> ${(markerObj.data.annualHeatDemandMWh / 1000).toFixed(1)} GWh/year</p>
                        </div>
                    `;
                    markerObj.marker.getPopup().setHTML(popupContent);
                    markerObj.marker.togglePopup();
                }
            }
            // toggle empty class so placeholder shows as white background when no selection
            if (e.target.value === '') e.target.classList.add('empty'); else e.target.classList.remove('empty');
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
    
    // Search input: autocomplete + Enter
    const searchInput = document.getElementById('locationSearch');
    const autocompleteList = document.getElementById('autocompleteList');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            showAutocomplete(searchInput.value);
        });
        searchInput.addEventListener('focus', () => {
            showAutocomplete(searchInput.value);
        });
        searchInput.addEventListener('blur', () => {
            setTimeout(hideAutocomplete, 180);
        });
        searchInput.addEventListener('keydown', (e) => {
            const items = autocompleteList ? autocompleteList.querySelectorAll('.autocomplete-item') : [];
            const active = autocompleteList ? autocompleteList.querySelector('.autocomplete-item.active') : null;
            let idx = active ? Array.prototype.indexOf.call(items, active) : -1;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length) {
                    idx = (idx + 1) % items.length;
                    items.forEach((el, i) => el.classList.toggle('active', i === idx));
                    items[idx]?.scrollIntoView({ block: 'nearest' });
                }
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length) {
                    idx = idx <= 0 ? items.length - 1 : idx - 1;
                    items.forEach((el, i) => el.classList.toggle('active', i === idx));
                    items[idx]?.scrollIntoView({ block: 'nearest' });
                }
                return;
            }
            if (e.key === 'Enter') {
                if (items.length && idx >= 0 && items[idx]) {
                    e.preventDefault();
                    searchInput.value = items[idx].getAttribute('data-value');
                    hideAutocomplete();
                    document.getElementById('searchBtn')?.click();
                }
            }
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && (!autocompleteList || autocompleteList.getAttribute('aria-hidden') === 'true')) {
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

// Highlight selected markers
function highlightSelected() {
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

// Fit map to show all active markers (zoom and pan with 2s animation)
const FIT_BOUNDS_DURATION_MS = 2000;
const FIT_BOUNDS_PADDING = 50;
const SINGLE_MARKER_ZOOM = 13;

function fitMarkersToBounds() {
    if (!map || !mapInitialized) return;
    
    if (sourceMarkers.length === 0 && consumerMarkers.length === 0) {
        return;
    }
    
    const bounds = new maplibregl.LngLatBounds();
    sourceMarkers.forEach(({ marker }) => bounds.extend(marker.getLngLat()));
    consumerMarkers.forEach(({ marker }) => bounds.extend(marker.getLngLat()));
    
    const totalMarkers = sourceMarkers.length + consumerMarkers.length;
    const singleMarker = totalMarkers === 1;
    const center = bounds.getCenter();
    
    if (singleMarker) {
        map.flyTo({
            center: [center.lng, center.lat],
            zoom: SINGLE_MARKER_ZOOM,
            duration: FIT_BOUNDS_DURATION_MS
        });
    } else {
        map.fitBounds(bounds, {
            padding: FIT_BOUNDS_PADDING,
            duration: FIT_BOUNDS_DURATION_MS,
            maxZoom: 14
        });
    }
}

// Calculate opportunity for selected source and consumer
async function calculateOpportunity() {
    // Ensure we have the latest selection values (defensive — read from DOM if needed)
    const sourceSelectEl = document.getElementById('sourceSelect');
    const consumerSelectEl = document.getElementById('consumerSelect');
    if (!selectedSourceId && sourceSelectEl) selectedSourceId = sourceSelectEl.value;
    if (!selectedConsumerId && consumerSelectEl) selectedConsumerId = consumerSelectEl.value;

    // If still missing, notify user and stop
    if (!selectedSourceId || !selectedConsumerId) {
        alert('Please select both a heat source and a heat consumer before calculating.');
        return;
    }
    
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
        
        // Load and show rankings for the selected source
        await loadRankings(selectedSourceId);
        const rankingsSection = document.querySelector('.rankings-section');
        if (rankingsSection) {
            rankingsSection.style.display = 'block';
            rankingsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error calculating opportunity:', error);
        alert('Failed to calculate opportunity. Using demo data instead.');
        
        // Create demo opportunity for testing
        createDemoOpportunity();
        
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Load and show rankings for the selected source
        await loadRankings(selectedSourceId);
        const rankingsSection = document.querySelector('.rankings-section');
        if (rankingsSection) {
            rankingsSection.style.display = 'block';
            rankingsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
    } finally {
        // Restore button
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;

        // Always attempt to load and show rankings (defensive — show UI even if calculation failed)
        try {
            await loadRankings(selectedSourceId);
        } catch (e) {
            console.warn('Failed to load rankings in finally:', e);
        }
        const rankingsSection = document.querySelector('.rankings-section');
        if (rankingsSection) {
            rankingsSection.style.display = 'block';
            rankingsSection.scrollIntoView({ behavior: 'smooth' });
        }
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

// Load ranked opportunities
async function loadRankings(sourceId = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ranked-opportunities`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allRankings = data.rankings || [];
        displayRankings(allRankings, sourceId);
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        showError('rankingsBody', 'Failed to load rankings. Using demo data.');
        
        // Create demo rankings
        createDemoRankings(sourceId);
    }
}

// Create demo rankings for testing
function createDemoRankings(sourceId = null) {
    if (sources.length === 0 || consumers.length === 0) return;
    
    const demoRankings = [];
    
    const sourcesToUse = sourceId ? sources.filter(s => s.id === sourceId) : sources.slice(0, Math.min(5, sources.length));
    
    for (let i = 0; i < sourcesToUse.length; i++) {
        for (let j = 0; j < consumers.length; j++) {
            const source = sourcesToUse[i];
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
    
    displayRankings(demoRankings, sourceId);
}

// Display rankings
function displayRankings(rankings, sourceId = null) {
    const tbody = document.getElementById('rankingsBody');
    if (!tbody) return;
    
    if (!rankings || rankings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No rankings available</td></tr>';
        return;
    }
    
    // Filter rankings if sourceId is provided
    const filteredRankings = sourceId ? rankings.filter(r => r.opportunity.sourceId === sourceId) : rankings;
    
    // Sort by feasibility score (descending) then re-rank the filtered list
    filteredRankings.sort((a, b) => {
        const aScore = (a && a.opportunity && a.opportunity.feasibilityScore) || 0;
        const bScore = (b && b.opportunity && b.opportunity.feasibilityScore) || 0;
        return bScore - aScore;
    });
    filteredRankings.forEach((item, index) => {
        item.rank = index + 1;
    });
    
    let html = '';
    filteredRankings.slice(0, 10).forEach((item, index) => {
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
