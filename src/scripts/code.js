// グローバル変数
let totalBiomes = 0;
let exploredBiomes = 0;
let allBiomes = [];
let worldFilters = {};
let currentFileName = '';
let currentFontSize = 14;
let isTopBarVisible = true;
let taskListBgColor = '#FFFFFF';
let fontColor = '#000000';

function applyStylesAndUpdateForm(data) {
  const { backgroundColor, fontSize, fontColor, taskListBgColor, font, customFont } = data.styleSettings;

  // スタイルの適用
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.fontSize = `${fontSize}px`;
  document.getElementById('biomeList').style.color = fontColor;
  document.getElementById('biomeList').style.backgroundColor = taskListBgColor;
  document.querySelectorAll('.boxed-section').forEach(el => {
    el.style.backgroundColor = taskListBgColor;
  });

  // スタイル設定フォームに値をセット
  document.getElementById('colorPicker').value = backgroundColor;
  document.getElementById('fontSizeInput').value = fontSize;
  document.getElementById('fontColorPicker').value = fontColor;
  document.getElementById('taskListColorPicker').value = taskListBgColor;

  // フォントの設定
  document.getElementById('fontSelector').value = font;
  document.getElementById('customFont').value = customFont;

  // カスタムフォントが設定されている場合、デフォルトのフォントセレクトを無効化
  if (customFont && customFont.trim() !== '') {
    document.getElementById('fontSelector').disabled = true;
    applyFont(`"${customFont}", Arial, sans-serif`);
  } else {
    document.getElementById('fontSelector').disabled = false;
    applyFont(font);
  }
}

function loadDefaultData() {
  fetch('src/scripts/data/biome_tracker_default.json')
    .then(response => response.json())
    .then(data => {
      allBiomes = data.biomes.map(biome => ({
        no: biome.no,
        name_en: biome.name_en,
        name_jp: biome.name_jp,
        world_type: biome.world_type,
        exp: biome.exp
      }));

      // ワールドの種類を抽出してworldFiltersを更新
      const uniqueWorldTypes = [...new Set(allBiomes.map(biome => biome.world_type))];
      worldFilters = {};
      uniqueWorldTypes.forEach(worldType => {
        worldFilters[worldType] = true; // 初期状態として全てtrueに設定
      });

      // UI上のチェックボックス状態を更新
      Object.keys(worldFilters).forEach(world => {
        let checkbox = document.querySelector(`.worldFilter input[value="${world}"]`);
        if (!checkbox) {
          // 既存のチェックボックスがない場合、新しいチェックボックスを追加
          const label = document.createElement('label');
          checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = world;
          checkbox.checked = true;
          checkbox.addEventListener('change', updateWorldFilter);
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(world));
          document.querySelector('.worldFilter').appendChild(label);
        } else {
          checkbox.checked = true;
        }
      });

      displayBiomes(allBiomes);
      calculateProgress(allBiomes);

      // スタイル設定の適用
      applyStylesAndUpdateForm(data);
    })
    .catch(error => {
      console.error('Error loading default JSON:', error);
      allBiomes = [];
      displayBiomes(allBiomes);
      calculateProgress(allBiomes);
    });
}

function loadProgress(event) {
  const file = event.target.files[0];
  if (file) {
    currentFileName = file.name;
    updateFileNameDisplay();
    const reader = new FileReader();
    document.getElementById('status').textContent = '読み込み中...';
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        document.getElementById('status').textContent = '読み込み完了.✓';

        // バイオームデータの更新
        allBiomes = data.biomes.map(biome => ({
          no: biome.no,
          name_en: biome.name_en,
          name_jp: biome.name_jp,
          world_type: biome.world_type,
          exp: biome.exp
        }));

        // ワールドの種類を抽出してworldFiltersを更新
        const uniqueWorldTypes = [...new Set(allBiomes.map(biome => biome.world_type))];
        worldFilters = {};
        uniqueWorldTypes.forEach(worldType => {
          worldFilters[worldType] = true; // 初期状態として全てtrueに設定
        });

        // UI上のチェックボックス状態を更新
        Object.keys(worldFilters).forEach(world => {
          let checkbox = document.querySelector(`.worldFilter input[value="${world}"]`);
          if (!checkbox) {
            // 既存のチェックボックスがない場合、新しいチェックボックスを追加
            const label = document.createElement('label');
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = world;
            checkbox.checked = true;
            checkbox.addEventListener('change', updateWorldFilter);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(world));
            document.querySelector('.worldFilter').appendChild(label);
          } else {
            checkbox.checked = true;
          }
        });

        displayBiomes(allBiomes);
        calculateProgress(allBiomes);

        // スタイル設定の適用
        applyStylesAndUpdateForm(data);

        setTimeout(() => {
          document.getElementById('status').textContent = '';
        }, 3000);
      } catch(error) {
        console.error('Error parsing JSON:', error);
        document.getElementById('status').textContent = '読み込みエラー';
        alert('Failed to load the data. Please check the file format.');
        setTimeout(() => {
          document.getElementById('status').textContent = '';
        }, 3000);
      }
    };
    reader.readAsText(file);
  }
}

function initialize() {
  const elements = {
    fileInput: document.getElementById('csvFile'),
    searchInput: document.getElementById('biomeSearch'),
    fontSelector: document.getElementById('fontSelector'),
    customFontInput: document.getElementById('customFont'),
    toggleButton: document.getElementById('toggleTopBar'),
    colorPicker: document.getElementById('colorPicker'),
    fontSizeInput: document.getElementById('fontSizeInput'),
    taskListColorPicker: document.getElementById('taskListColorPicker'),
    fontColorPicker: document.getElementById('fontColorPicker')
  };

  const eventListeners = [
    { element: elements.fileInput, event: 'change', handler: loadProgress },
    { element: elements.searchInput, event: 'input', handler: filterBiomes },
    { element: elements.fontSelector, event: 'change', handler: updateFont },
    { element: elements.customFontInput, event: 'input', handler: updateCustomFont },
    { element: elements.toggleButton, event: 'click', handler: toggleTopBar },
    { element: elements.colorPicker, event: 'input', handler: updateBackgroundColor },
    { element: elements.fontSizeInput, event: 'input', handler: updateFontSize },
    { element: elements.taskListColorPicker, event: 'input', handler: updateTaskListBackgroundColor },
    { element: elements.fontColorPicker, event: 'input', handler: updateFontColor }
  ];

  eventListeners.forEach(({ element, event, handler }) => {
    if (element) {
      element.addEventListener(event, handler);
    }
  });

  document.querySelector('.file-upload-btn').addEventListener('click', function() {
    elements.fileInput.click();
  });

  // ワールドフィルターのチェックボックスを初期化
  document.querySelectorAll('.worldFilter input').forEach(input => {
    input.checked = true;
    input.addEventListener('change', updateWorldFilter);
  });

  // トグルの初期化
  toggleTopBar();
  
  // 初期データの読み込み
  loadDefaultData();
}

function updateFileNameDisplay() {
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  fileNameDisplay.textContent = currentFileName ? ` - ${currentFileName}` : '';
}

function updateWorldFilter(event) {
  const world = event.target.value;
  worldFilters[world] = event.target.checked;
  
  applyFilters(); // 共通のフィルタ関数を呼び出す
}

function applyFilters(isCalculate = true) {
  const searchValue = document.getElementById('biomeSearch').value.toLowerCase();

  const worldFilterdBiomes = allBiomes.filter(biome =>
    worldFilters[biome.world_type]
  );

  if (isCalculate) {
    calculateProgress(worldFilterdBiomes, true);
  }

  const searchFilteredBiomes = worldFilterdBiomes.filter(biome => 
    (biome.name_en.toLowerCase().includes(searchValue) || 
     biome.name_jp.toLowerCase().includes(searchValue))
  );
  
  displayBiomes(searchFilteredBiomes);
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
    checkbox.checked = biome.exp;
    checkbox.id = `biome-${biome.no}`;
    checkbox.addEventListener('change', function() {
      biome.exp = this.checked;
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
    exploredBiomes = data.filter(biome => biome.exp).length;
  } else {
    totalBiomes = allBiomes.length; // すべてのバイオームを使用
    exploredBiomes = allBiomes.filter(biome => biome.exp).length;
  }
  updateProgressDisplay();
}

function updateProgress() {
  allBiomes.forEach(biome => {
    const checkbox = document.getElementById(`biome-${biome.no}`);
    if (checkbox) {
      biome.exp = checkbox.checked;
    }
  });
  
  // ソート
  allBiomes.sort((a, b) => {
    if (!a.exp && b.exp) return -1;
    if (a.exp && !b.exp) return 1;
    return a.no - b.no;
  });

  applyFilters(); // 共通のフィルタ関数を呼び出す
  updateProgressDisplay();
}

function updateProgressDisplay() {
  const progressText = document.getElementById('progressText');
  const progressPercentage = totalBiomes > 0 ? ((exploredBiomes / totalBiomes) * 100).toFixed(2) : "0.00";
  
  // 内部の span 要素の textContent を更新
  if (progressText) {
    progressText.textContent = `進捗状況: ${exploredBiomes} / ${totalBiomes} ( ${progressPercentage}% )`;
  }
}

function filterBiomes() {
  applyFilters(false);
}

function rgbToHex(rgb) {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  const [, r, g, b] = match.map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function saveProgress() {
  const saveData = {
    biomes: allBiomes.map(biome => ({
      no: biome.no || '',
      name_en: biome.name_en || '',
      name_jp: biome.name_jp || '',
      world_type: biome.world_type || '',
      exp: typeof biome.exp === 'boolean' ? biome.exp : false
    })),
    styleSettings: {
      backgroundColor: rgbToHex(getComputedStyle(document.body).backgroundColor),
      fontSize: currentFontSize,
      fontColor: fontColor,
      taskListBgColor: rgbToHex(getComputedStyle(document.getElementById('biomeList')).backgroundColor),
      font: document.getElementById('fontSelector').value,
      customFont: document.getElementById('customFont').value
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
  applyFontAndColor(selectedFont);
}

function updateCustomFont() {
  const customFont = document.getElementById('customFont').value;
  const fontSelector = document.getElementById('fontSelector');
  
  if (customFont.trim() !== '') {
    fontSelector.disabled = true;
    applyFontAndColor(`"${customFont}", Arial, sans-serif`);
  } else {
    fontSelector.disabled = false;
    updateFont();
  }
}

function applyFont(font) {
  applyFontAndColor(font);
}

function updateBackgroundColor(event) {
  const color = event.target.value;
  document.body.style.backgroundColor = color;
}

function setGreenBackground() {
  document.body.style.backgroundColor = '#00FF00';
  document.getElementById('colorPicker').value = '#00FF00';
}

function updateFontSize(event) {
  currentFontSize = event.target.value;
  const elementsToApply = [
    document.getElementById('progress'), // 進捗管理レイヤ
    document.getElementById('biomeList'), // リストレイヤ
    ...document.querySelectorAll('.boxed-section') // 検索レイヤを含む
  ];

  elementsToApply.forEach(el => {
    if (el) {
      el.style.fontSize = `${currentFontSize}px`;
    }
  });
}

function updateTaskListBackgroundColor(event) {
  taskListBgColor = event.target.value;
  document.getElementById('biomeList').style.backgroundColor = taskListBgColor;
  document.querySelectorAll('.boxed-section').forEach(el => {
    el.style.backgroundColor = taskListBgColor;
  });
}

function setListGreenBackground() {
  // リスト背景色を#00FF00に設定
  document.getElementById('biomeList').style.backgroundColor = '#00FF00';
  document.querySelectorAll('.boxed-section').forEach(el => {
    el.style.backgroundColor = '#00FF00';
  });
  
  // カラーピッカーの値も更新
  document.getElementById('taskListColorPicker').value = '#00FF00';
}

function updateFontColor(event) {
  fontColor = event.target.value;
  const customFont = document.getElementById('customFont').value;
  if (customFont && customFont.trim() !== '') {
    applyFontAndColor(`"${customFont}", Arial, sans-serif`, fontColor);
  } else {
    applyFontAndColor(document.getElementById('fontSelector').value, fontColor);
  }
}

function updateStyle(elements, property, value) {
  elements.forEach(el => {
    if (el) {
      el.style[property] = value;
    }
  });
}

function applyFontAndColor(font, color) {
  const elements = [
    document.getElementById('progress'),
    document.getElementById('biomeList'),
    ...document.querySelectorAll('#biomeList li .biomeName'),
    ...document.querySelectorAll('#biomeList li .world'),
    ...document.querySelectorAll('.worldFilter label')
  ];

  updateStyle(elements, 'fontFamily', font);
  if (color) {
    updateStyle(elements, 'color', color);
  }
}

window.onload = initialize;