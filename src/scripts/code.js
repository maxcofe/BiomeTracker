// グローバル変数
let totalBiomes = 0;
let exploredBiomes = 0;
let allBiomes = [];
let worldFilters = { Overworld: true, Nether: true, End: true, Other: true };
let currentFileName = '';
let currentFontSize = 14;
let isTopBarVisible = true;
let taskListBgColor = '#FFFFFF';
let fontColor = '#000000';

function loadDefaultData() {
  fetch('data/biome_tracker_default.json') // ファイル名は適宜変更
    .then(response => response.json())
    .then(data => {
      allBiomes = data.biomes.map(biome => ({
        no: biome.no,
        name_en: biome.name_en,
        name_jp: biome.name_jp,
        world_type: biome.world_type,
        exp: biome.exp
      }));

      // スタイルの適用
      const { backgroundColor, fontSize, fontColor, taskListBgColor } = data.styleSettings;
      document.body.style.backgroundColor = backgroundColor;
      document.body.style.fontSize = `${fontSize}px`;
      document.getElementById('biomeList').style.color = fontColor;
      document.getElementById('biomeList').style.backgroundColor = taskListBgColor;
      document.querySelectorAll('.boxed-section').forEach(el => {
        el.style.backgroundColor = taskListBgColor;
      });

      displayBiomes(allBiomes);
      calculateProgress(allBiomes);
    })
    .catch(error => {
      console.error('Error loading default JSON:', error);
      // エラーが発生した場合のデフォルトの動作（例えば、空のリストを表示するなど）
      allBiomes = [];
      displayBiomes(allBiomes);
      calculateProgress(allBiomes);
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

  fileInput.addEventListener('change', loadProgress);
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
  loadDefaultData();
}

function loadProgress(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        // Biomesの更新
        allBiomes = data.biomes.map(biome => ({
          no: biome.no,
          name_en: biome.name_en,
          name_jp: biome.name_jp,
          world_type: biome.world_type,
          exp: biome.exp
        }));

        // スタイルの適用
        const { backgroundColor, fontSize, fontColor, taskListBgColor } = data.styleSettings;
        document.body.style.backgroundColor = backgroundColor;
        document.body.style.fontSize = `${fontSize}px`;
        document.getElementById('biomeList').style.color = fontColor;
        document.getElementById('biomeList').style.backgroundColor = taskListBgColor;
        document.querySelectorAll('.boxed-section').forEach(el => {
          el.style.backgroundColor = taskListBgColor;
        });

        displayBiomes(allBiomes);
        calculateProgress(allBiomes);
      } catch(error) {
        console.error('Error parsing JSON:', error);
        alert('Failed to load the data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }
}

function updateFileNameDisplay() {
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  fileNameDisplay.textContent = currentFileName ? ` - ${currentFileName}` : '';
}

function updateWorldFilter(event) {
  const world = event.target.value;
  worldFilters[world] = event.target.checked;
  const filteredBiomes = allBiomes.filter(biome => worldFilters[biome.world_type]);
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

function displayBiomes(data) {
  const biomeList = document.getElementById('biomeList');
  biomeList.innerHTML = '';
  data.forEach(biome => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = biome.exp === '〇';
    checkbox.id = `biome-${biome.no}`;
    checkbox.addEventListener('change', function() {
      biome.exp = this.checked ? '〇' : '×';
      updateProgress();
    });
    li.appendChild(checkbox);
    
    const biomeName = document.createElement('span');
    biomeName.className = 'biomeName';
    biomeName.textContent = `${biome.name_en} / ${biome.name_jp}`;
    li.appendChild(biomeName);
    
    const world = document.createElement('span');
    world.className = 'world';
    world.textContent = `(${biome.world_type})`;
    li.appendChild(world);
    
    biomeList.appendChild(li);
  });
}

function calculateProgress(data, isWorldFilter = true) {
  if (isWorldFilter) {
    totalBiomes = data.length;
    exploredBiomes = data.filter(biome => biome.exp === '〇').length;
  } else {
    totalBiomes = allBiomes.length; // すべてのバイオームを使用
    exploredBiomes = allBiomes.filter(biome => biome.exp === '〇').length;
  }
  updateProgressDisplay();
}

function updateProgress() {
  allBiomes.forEach(biome => {
    const checkbox = document.getElementById(`biome-${biome.no}`);
    if (checkbox) {
      biome.exp = checkbox.checked ? '〇' : '×';
    }
  });
  // ソート条件: まずチェックされていないものを先頭に、次にNo順
  allBiomes.sort((a, b) => {
    if (a.exp === '×' && b.exp === '〇') return -1;
    if (a.exp === '〇' && b.exp === '×') return 1;
    return a.no - b.no;
  });
  displayBiomes(allBiomes.filter(biome => worldFilters[biome.world_type])); // フィルタリングを考慮
  exploredBiomes = allBiomes.filter(biome => biome.exp === '〇').length;
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
    (biome.name_en.toLowerCase().includes(searchValue) || 
    biome.name_jp.toLowerCase().includes(searchValue)) &&
    worldFilters[biome.world_type]
  );
  displayBiomes(filteredBiomes);
  calculateProgress(filteredBiomes, false); // 検索フィルタ時はfalse
}

function saveProgress() {
  const saveData = {
    biomes: allBiomes.map(biome => ({
      no: biome.no || '',
      name_en: biome.name_en || '',
      name_jp: biome.name_jp || '',
      world_type: biome.world_type || '',
      exp: biome.exp || ''
    })),
    styleSettings: {
      backgroundColor: document.body.style.backgroundColor,
      fontSize: currentFontSize,
      fontColor: fontColor,
      taskListBgColor: taskListBgColor
    }
  };

  const jsonData = JSON.stringify(saveData, null, 2);

  const blob = new Blob([jsonData], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `biome_tracker_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
  link.click();
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