document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('province-districts-table-body');
  const annualTbody = document.getElementById('province-annual-table-body');
  const originsTbody = document.getElementById('province-origins-table-body');
  const provinceLabel = document.getElementById('province-label');
  const originsTitle = document.querySelector('.provinceOriginsTableArea h3');

  if (!tbody || !annualTbody || !originsTbody) {
    console.error('Table bodies not found');
    return;
  }

  // Helper to populate districts table
  const populateDistrictsTable = (districts) => {
    tbody.innerHTML = '';

    if (!districts || districts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">No district data available</td></tr>';
      return;
    }

    const name = districts[0]?.provincename || 'Unknown Province';
    provinceLabel.textContent = name;

    districts.forEach((district) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td></td>
        <td>${district.provincename || ''}</td>
        <td>${district.districtname || ''}</td>
        <td>${formatNumber(district['2024'] || '')}</td>
        <td>${formatNumber(district['2023'] || '')}</td>
        <td>${formatNumber(district['2022'] || '')}</td>
        <td>${formatNumber(district['2015'] || '')}</td>
        <td>${formatNumber(district['2011'] || '')}</td>
        <td>${formatNumber(district['2007'] || '')}</td>
      `;
      tr.addEventListener('click', () => {
        window.location.href = `http://127.0.0.1:8080/ilce-nufus.html?districtId=${district.id}`;
      });
      tbody.appendChild(tr);
    });
  };

  // Helper to populate annual table (province population and foreigners by year)
  const populateAnnualTable = (provinceData, foreignersData) => {
    annualTbody.innerHTML = '';

    if (!provinceData || !foreignersData) {
      annualTbody.innerHTML = '<tr><td colspan="3">No annual data available</td></tr>';
      return;
    }

    // Generate all years from 2024 down to 2007 (reversed order: 2024 first)
    const years = [];
    for (let year = 2024; year >= 2007; year--) {
      years.push(year.toString());
    }

    years.forEach((year) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${year}</td>
        <td>${formatNumber(provinceData[year] || '')}</td>
        <td>${formatNumber(foreignersData[year] || '')}</td>
      `;
      annualTbody.appendChild(tr);
    });
  };

  // Helper to populate origins table (people from selected province living in other provinces)
  const populateOriginsTable = (originsData) => {
    originsTbody.innerHTML = '';

    if (!originsData) {
      originsTbody.innerHTML = '<tr><td colspan="3">No origins data available</td></tr>';
      return;
    }

    const originName = originsData.provincename || 'Unknown Province';

    // Update the dynamic header for the third column (e.g., "Mersinliler")
    const header = document.querySelector('.province-origins-table thead tr th:nth-child(3)');
    if (header) {
      const lastTwoChars = originName.slice(-2).toLowerCase();
      let suffix = 'liler'; // default
      if (lastTwoChars.includes('a') || lastTwoChars.includes('ı')) {
        suffix = 'lılar';
      } else if (lastTwoChars.includes('e') || lastTwoChars.includes('i')) {
        suffix = 'liler';
      } else if (lastTwoChars.includes('ö') || lastTwoChars.includes('ü')) {
        suffix = 'lüler';
      } else if (lastTwoChars.includes('o') || lastTwoChars.includes('u')) {
        suffix = 'lular';
      }
      header.textContent = `${originName}${suffix}`;
      originsTitle.textContent = `${originName}${suffix} en çok hangi ilde yaşıyor?`;
    }



    // Filter entries to only residence provinces (exclude basic info and total)
    const entries = Object.entries(originsData).filter(([key]) => 
      !['provinceid', 'provincename', 'originPopulation'].includes(key)
    );

    if (entries.length === 0) {
      originsTbody.innerHTML = '<tr><td colspan="3">No origins distribution data</td></tr>';
      return;
    }

    // Already sorted descending by the backend
    entries.forEach(([residenceName, count], index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${residenceName}</td>
        <td>${formatNumber(count)}</td>
      `;
      originsTbody.appendChild(tr);
    });
  };

  // Helper to format numbers Turkish-style (e.g., 1234567 → 1.234.567)
  const formatNumber = (value) => {
    if (!value || isNaN(parseInt(value))) return '';
    return parseInt(value).toLocaleString('tr-TR');
  };

  // Helper to fetch and populate all tables (concurrent requests)
  const fetchAndPopulate = async (provinceId) => {
    if (!provinceId) {
      console.warn('No provinceId provided');
      tbody.innerHTML = '<tr><td colspan="9">No province selected</td></tr>';
      annualTbody.innerHTML = '<tr><td colspan="3">No province selected</td></tr>';
      originsTbody.innerHTML = '<tr><td colspan="3">No province selected</td></tr>';
      return;
    }

    const districtsUrl = `https://www.eumaps.org/api/kac-milyon/get-districts/${provinceId}`;
    const provinceUrl = `https://www.eumaps.org/api/kac-milyon/get-province/${provinceId}`;
    const foreignersUrl = `https://www.eumaps.org/api/kac-milyon/get-province-foreigners/${provinceId}`;
    const originsUrl = `https://www.eumaps.org/api/kac-milyon/get-province-origins/${provinceId}`;

    try {
      const [districtsRes, provinceRes, foreignersRes, originsRes] = await Promise.all([
        axios.get(districtsUrl),
        axios.get(provinceUrl),
        axios.get(foreignersUrl),
        axios.get(originsUrl)
      ]);

      // Handle districts table
      if (districtsRes.data.resStatus) {
        populateDistrictsTable(districtsRes.data.resData);
      } else {
        console.warn('Districts API error:', districtsRes.data.resMessage);
        tbody.innerHTML = `<tr><td colspan="9">${districtsRes.data.resMessage || 'Districts data not found'}</td></tr>`;
      }

      // Handle annual table
      if (provinceRes.data.resStatus && foreignersRes.data.resStatus) {
        populateAnnualTable(provinceRes.data.resData, foreignersRes.data.resData);
      } else {
        console.warn('Annual API error:', { province: provinceRes.data.resMessage, foreigners: foreignersRes.data.resMessage });
        let msg = 'Annual data not available';
        if (!provinceRes.data.resStatus) msg += ' - Population data missing';
        if (!foreignersRes.data.resStatus) msg += ' - Foreigners data missing';
        annualTbody.innerHTML = `<tr><td colspan="3">${msg}</td></tr>`;
      }

      // Handle origins table
      if (originsRes.data.resStatus && originsRes.data.resData && originsRes.data.resData.length > 0) {
        populateOriginsTable(originsRes.data.resData[0]);
      } else {
        console.warn('Origins API error:', originsRes.data.resMessage);
        originsTbody.innerHTML = `<tr><td colspan="3">${originsRes.data.resMessage || 'Origins data not found'}</td></tr>`;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      tbody.innerHTML = '<tr><td colspan="9">Error loading district data</td></tr>';
      annualTbody.innerHTML = '<tr><td colspan="3">Error loading annual data</td></tr>';
      originsTbody.innerHTML = '<tr><td colspan="3">Error loading origins data</td></tr>';
    }
  };

  // Auto-load from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlProvinceId = urlParams.get('provinceId');
  if (urlProvinceId) {
    console.log('Auto-loading from URL:', urlProvinceId);
    fetchAndPopulate(urlProvinceId);
  } else {
    // Initial placeholders
    tbody.innerHTML = '<tr><td colspan="9">Select a province on the map or add ?provinceId=34 to URL</td></tr>';
    annualTbody.innerHTML = '<tr><td colspan="3">Select a province to view annual population data</td></tr>';
    originsTbody.innerHTML = '<tr><td colspan="3">Select a province to view origins distribution</td></tr>';
  }

  // Listen for map events
  document.addEventListener('provinceSelected', async (event) => {
    const { provinceId } = event.detail;
    console.log('Map event received:', provinceId);
    fetchAndPopulate(provinceId);
  });
});