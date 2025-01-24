let totalBiomes = 0;
let exploredBiomes = 0;
let allBiomes = [];
let worldFilters = { Overworld: true, Nether: true, End: true, Other: true };
let currentFileName = '';
let currentFontSize = 14;
let isTopBarVisible = true;
let taskListBgColor = '#FFFFFF';
let fontColor = '#000000';

function loadDefaultCSV() {
  fetch('src/scripts/data/biome_list.csv')
    .then(response => response.text())
    .then(csv => {
      allBiomes = processCSV(csv);
      displayBiomes(allBiomes);
      calculateProgress(allBiomes);
    })
    .catch(error => {
      console.error('Error loading default CSV:', error);
    });
}

function initialize() {
  const fileInput = document.getElementById('csvFile');
  const searchInput = document.getElementById('biomeSearch');
  const fontSelector = document.getElementById('fontSelector');
  const customFontInput = document.getElementById('customFont');
  const toggleButton = document.getElementById('toggleTopBar');
  const colorPicker = document.getElementById('colorPicker');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const taskListColorPicker = document.getElementById('taskListColorPicker');
  const fontColorPicker = document.getElementById('fontColorPicker');

  document.querySelector('.file-upload-btn').addEventListener('click', function() {
    fileInput.click();
  });

  fileInput.addEventListener('change', handleFileSelect);
  searchInput.addEventListener('input', filterBiomes);
  fontSelector.addEventListener('change', updateFont);
  customFontInput.addEventListener('input', updateCustomFont);
  toggleButton.addEventListener('click', toggleTopBar);
  colorPicker.addEventListener('input', updateBackgroundColor);
  fontSizeInput.addEventListener('input', updateFontSize);
  taskListColorPicker.addEventListener('input', updateTaskListBackgroundColor);
  fontColorPicker.addEventListener('input', updateFontColor);

  // ワールドフィルターのチェックボックスを初期化
  document.querySelectorAll('.worldFilter input').forEach(input => {
    input.checked = true;
    input.addEventListener('change', updateWorldFilter);
  });

  // トグルの初期化
  toggleTopBar();
  // 初期CSVの読み込み
  loadDefaultCSV();
}

function handleFileSelect(event) {
  const fileInput = event.target;
  if (fileInput.files.length > 0) {
    currentFileName = fileInput.files[0].name;
    updateFileNameDisplay();
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    allBiomes = processCSV(event.target.result);
    displayBiomes(allBiomes);
    calculateProgress(allBiomes);
  };
  reader.readAsText(fileInput.files[0]);
}

function updateFileNameDisplay() {
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  fileNameDisplay.textContent = currentFileName ? ` - ${currentFileName}` : '';
}

function updateWorldFilter(event) {
  const world = event.target.value;
  worldFilters[world] = event.target.checked;
  const filteredBiomes = allBiomes.filter(biome => worldFilters[biome.ワールド]);
  displayBiomes(filteredBiomes);
  calculateProgress(filteredBiomes, true); // ワールドフィルタ時はtrue
}

function toggleTopBar() {
  const topBar = document.querySelector('.top-bar');
  const toggleButton = document.getElementById('toggleTopBar');
  
  if (topBar.style.display === 'none' || topBar.style.display === '') {
    topBar.style.display = 'flex';
    toggleButton.textContent = '▲';
  } else {
    topBar.style.display = 'none';
    toggleButton.textContent = '▼';
  }
}

function processCSV(fileContent) {
  const rows = fileContent.split('\n').filter(row => row.trim() !== '');
  const header = rows.shift(); // ヘッダを削除
  const biomes = rows.map(row => {
    const values = row.split(',');
    return {
      No: values[0],
      英名: values[1],
      日本語名: values[2],
      ワールド: values[3],
      EXP: values[4]
    };
  });
  biomes.sort((a, b) => a.No - b.No); // Noでソート
  return biomes;
}

function displayBiomes(data) {
  const biomeList = document.getElementById('biomeList');
  biomeList.innerHTML = '';
  data.forEach(biome => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = biome.EXP === '〇';
    checkbox.id = `biome-${biome.No}`;
    checkbox.addEventListener('change', function() {
      biome.EXP = this.checked ? '〇' : '×';
      updateProgress();
    });
    li.appendChild(checkbox);
    
    const biomeName = document.createElement('span');
    biomeName.className = 'biomeName';
    biomeName.textContent = `${biome.英名} / ${biome.日本語名}`;
    li.appendChild(biomeName);
    
    const world = document.createElement('span');
    world.className = 'world';
    world.textContent = `(${biome.ワールド})`;
    li.appendChild(world);
    
    biomeList.appendChild(li);
  });
}

function calculateProgress(data, isWorldFilter = true) {
  if (isWorldFilter) {
    totalBiomes = data.length;
    exploredBiomes = data.filter(biome => biome.EXP === '〇').length;
  } else {
    totalBiomes = allBiomes.length; // すべてのバイオームを使用
    exploredBiomes = allBiomes.filter(biome => biome.EXP === '〇').length;
  }
  updateProgressDisplay();
}

function updateProgress() {
  allBiomes.forEach(biome => {
    const checkbox = document.getElementById(`biome-${biome.No}`);
    if (checkbox) {
      biome.EXP = checkbox.checked ? '〇' : '×';
    }
  });
  // ソート条件: まずチェックされていないものを先頭に、次にNo順
  allBiomes.sort((a, b) => {
    if (a.EXP === '×' && b.EXP === '〇') return -1;
    if (a.EXP === '〇' && b.EXP === '×') return 1;
    return a.No - b.No;
  });
  displayBiomes(allBiomes.filter(biome => worldFilters[biome.ワールド])); // フィルタリングを考慮
  exploredBiomes = allBiomes.filter(biome => biome.EXP === '〇').length;
  updateProgressDisplay();
}

function updateProgressDisplay() {
  const progressElement = document.getElementById('progress');
  const progressPercentage = totalBiomes > 0 ? ((exploredBiomes / totalBiomes) * 100).toFixed(2) : "0.00";
  progressElement.textContent = `進捗状況: ${exploredBiomes} / ${totalBiomes} ( ${progressPercentage}% )`;
}

function filterBiomes() {
  const searchValue = document.getElementById('biomeSearch').value.toLowerCase();
  const filteredBiomes = allBiomes.filter(biome => 
    (biome.英名.toLowerCase().includes(searchValue) || 
    biome.日本語名.toLowerCase().includes(searchValue)) &&
    worldFilters[biome.ワールド]
  );
  displayBiomes(filteredBiomes);
  calculateProgress(filteredBiomes, false); // 検索フィルタ時はfalse
}

function downloadCSV() {
  const biomes = allBiomes.map(biome => [
    biome.No || '', 
    biome.英名 || '', 
    biome.日本語名 || '', 
    biome.ワールド || '', 
    biome.EXP || ''
  ]);
  const csv = ["No,英名,日本語名,ワールド,EXP", ...biomes.map(biome => biome.join(','))].join("\n");
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "biome_list_" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function updateFont() {
  const selectedFont = document.getElementById('fontSelector').value;
  applyFont(selectedFont);
}

function updateCustomFont() {
  const customFont = document.getElementById('customFont').value;
  applyFont(`"${customFont}", Arial, sans-serif`);
}

function applyFont(font) {
  document.getElementById('progress').style.fontFamily = font;
  document.getElementById('biomeList').style.fontFamily = font;
}

function updateBackgroundColor(event) {
  const color = event.target.value;
  document.body.style.backgroundColor = color;
}

function updateFontSize(event) {
  currentFontSize = event.target.value;
  document.body.style.fontSize = `${currentFontSize}px`;
}

function updateTaskListBackgroundColor(event) {
  taskListBgColor = event.target.value;
  document.getElementById('biomeList').style.backgroundColor = taskListBgColor;
  document.querySelectorAll('.boxed-section').forEach(el => {
    el.style.backgroundColor = taskListBgColor;
  });
}

function updateFontColor(event) {
  fontColor = event.target.value;
  document.getElementById('biomeList').style.color = fontColor;
  document.getElementById('progress').style.color = fontColor;
}

window.onload = initialize;