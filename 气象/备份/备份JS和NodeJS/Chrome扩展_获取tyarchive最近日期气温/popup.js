document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  const stationsBody = document.getElementById('stationsBody');
  let allStations = [];

  // Function to render table rows
  const renderTable = (stations) => {
    stationsBody.innerHTML = '';
    
    if (stations.length === 0) {
      stationsBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">No stations found.</td>
        </tr>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    stations.forEach(station => {
      const tr = document.createElement('tr');
      
      const usaf = station.USAF || '-';
      const domesId = station.domes_id || '-';
      const province = station.level1 || '-';
      const name = station.cn_name || '-';

      tr.innerHTML = `
        <td>${usaf}</td>
        <td>${domesId}</td>
        <td>${province}</td>
        <td>${name}</td>
        <td>
          <button class="btn-select" data-domesid="${domesId}" data-usaf="${usaf}" data-name="${name}">Select</button>
        </td>
      `;
      fragment.appendChild(tr);
    });

    stationsBody.appendChild(fragment);

    // Add event listeners to the Select buttons
    const selectButtons = stationsBody.querySelectorAll('.btn-select');
    selectButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const domesId = e.target.getAttribute('data-domesid');
        const stationName = e.target.getAttribute('data-name');
        console.log(`Selected Station: ${stationName} (${domesId})`);
        // For Step 1, we just log it. Future steps will trigger content script.
        
        // Optional: show a quick visual feedback
        const originalText = e.target.innerText;
        e.target.innerText = 'Selected!';
        e.target.style.backgroundColor = '#10b981'; // green
        setTimeout(() => {
          e.target.innerText = originalText;
          e.target.style.backgroundColor = '';
        }, 1000);
      });
    });
  };

  // Load the JSON data using absolute extension URL (works reliably in iframes)
  try {
    const jsonUrl = chrome.runtime.getURL('stations.json');
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allStations = await response.json();
    renderTable(allStations);
  } catch (error) {
    console.error('Error loading stations data:', error);
    stationsBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state" style="color: #ef4444;">Failed to load data. Ensure stations.json exists.</td>
      </tr>
    `;
  }

  // Handle Search Input
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
      renderTable(allStations);
      return;
    }

    const filtered = allStations.filter(station => {
      const usaf = String(station.USAF || '').toLowerCase();
      const domesId = String(station.domes_id || '').toLowerCase();
      const province = (station.level1 || '').toLowerCase();
      const name = (station.cn_name || '').toLowerCase();

      return usaf.includes(query) || domesId.includes(query) || province.includes(query) || name.includes(query);
    });

    renderTable(filtered);
  });
});
