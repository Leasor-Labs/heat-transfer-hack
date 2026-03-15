(function () {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q') || '';
    const apiBase = typeof window.opener !== 'undefined' && window.opener.HEATGRID_API_BASE_URL
        ? window.opener.HEATGRID_API_BASE_URL.replace(/\/$/, '')
        : (window.HEATGRID_API_BASE_URL || 'http://localhost:3000');

    const loadingEl = document.getElementById('popupLoading');
    const errorEl = document.getElementById('popupError');
    const contentEl = document.getElementById('popupContent');
    const subtitleEl = document.getElementById('popupSubtitle');
    const sourcesWrap = document.getElementById('sourcesTableWrap');
    const consumersWrap = document.getElementById('consumersTableWrap');

    document.getElementById('closeBtn').addEventListener('click', function () {
        window.close();
    });

    function showError(message) {
        loadingEl.style.display = 'none';
        contentEl.style.display = 'none';
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    function renderSources(list) {
        if (!list || list.length === 0) {
            sourcesWrap.innerHTML = '';
            return;
        }
        const headers = ['Name', 'Industry', 'Waste heat (MWh/yr)', 'Recoverable (MWh/yr)', 'Temp'];
        sourcesWrap.innerHTML = '<table><thead><tr>' +
            headers.map(h => '<th>' + escapeHtml(h) + '</th>').join('') + '</tr></thead><tbody>' +
            list.map(s => '<tr><td>' + escapeHtml(s.name || '') + '</td><td>' + escapeHtml(s.industry || '') +
                '</td><td>' + (s.estimatedWasteHeatMWhPerYear ?? '') + '</td><td>' + (s.recoverableHeatMWhPerYear ?? '') +
                '</td><td>' + escapeHtml(s.temperatureClass || '') + '</td></tr>').join('') + '</tbody></table>';
    }

    function renderConsumers(list) {
        if (!list || list.length === 0) {
            consumersWrap.innerHTML = '';
            return;
        }
        const headers = ['Name', 'Category', 'Annual demand (MWh)'];
        consumersWrap.innerHTML = '<table><thead><tr>' +
            headers.map(h => '<th>' + escapeHtml(h) + '</th>').join('') + '</tr></thead><tbody>' +
            list.map(c => '<tr><td>' + escapeHtml(c.name || '') + '</td><td>' + escapeHtml(c.category || '') +
                '</td><td>' + (c.annualHeatDemandMWh ?? '') + '</td></tr>').join('') + '</tbody></table>';
    }

    function escapeHtml(s) {
        if (s == null) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    async function load() {
        if (searchQuery) {
            subtitleEl.textContent = 'Filtered by: "' + searchQuery + '" (from DynamoDB)';
        }

        let sourcesUrl = apiBase + '/api/heat-sources';
        let consumersUrl = apiBase + '/api/heat-consumers';
        if (searchQuery) {
            sourcesUrl += '?locationSearchQuery=' + encodeURIComponent(searchQuery);
            consumersUrl += '?locationSearchQuery=' + encodeURIComponent(searchQuery);
        }

        try {
            const [sourcesRes, consumersRes] = await Promise.all([
                fetch(sourcesUrl),
                fetch(consumersUrl)
            ]);

            const sourcesData = sourcesRes.ok ? await sourcesRes.json() : { heatSources: [] };
            const consumersData = consumersRes.ok ? await consumersRes.json() : { heatConsumers: [] };

            const sources = sourcesData.heatSources || [];
            const consumers = consumersData.heatConsumers || [];

            loadingEl.style.display = 'none';
            errorEl.style.display = 'none';
            contentEl.style.display = 'block';
            renderSources(sources);
            renderConsumers(consumers);
        } catch (err) {
            showError('Failed to load data: ' + (err.message || 'Network error'));
        }
    }

    load();
})();
