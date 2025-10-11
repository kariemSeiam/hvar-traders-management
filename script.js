// ================================================
// Global Variables and Data Management
// ================================================
const API_URL = "http://localhost:3000/api";
let govsData = [];
let filteredGovs = [];
let selectedCityId = null;
let tradersDB = {
  columns: [
    { name: "إيرادات", type: "number" },
    {
      name: "حالة الطلب",
      type: "select",
      options: ["مكتمل", "قيد الانتظار", "ملغي", "قيد المعالجة"],
    },
    { name: "الحالة", type: "select", options: ["نشط", "غير نشط", "معلق"] },
    { name: "رقم الهاتف", type: "phone" },
    { name: "اسم التاجر", type: "text" },
  ],
  cities: {},
};

// ================================================
// API Functions for Real-Time JSON Sync
// ================================================
async function loadTradersFromAPI() {
  try {
    const response = await fetch(`${API_URL}/traders`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    tradersDB = data;

    // Ensure default structure
    if (!tradersDB.columns) tradersDB.columns = [];
    if (!tradersDB.cities) tradersDB.cities = {};

    // Migration: Add missing options to select columns
    migrateSelectColumns();

    console.log("✓ Traders data loaded from traders.json via API");
    return true;
  } catch (error) {
    console.error("Error loading traders data:", error);
    showNotification("فشل الاتصال بالخادم - تأكد من تشغيل الخادم", "error");
    return false;
  }
}

async function saveTradersToAPI() {
  try {
    const response = await fetch(`${API_URL}/traders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tradersDB),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("✓ traders.json synced in real-time");
    return true;
  } catch (error) {
    console.error("Error saving traders data:", error);
    showNotification("فشل حفظ البيانات - تأكد من تشغيل الخادم", "error");
    return false;
  }
}

function migrateSelectColumns() {
  if (tradersDB.columns) {
    tradersDB.columns.forEach((col) => {
      if (
        typeof col === "object" &&
        col.type === "select" &&
        (!col.options || col.options.length === 0)
      ) {
        // Add default options based on column name
        if (col.name === "حالة الطلب") {
          col.options = ["مكتمل", "قيد الانتظار", "ملغي", "قيد المعالجة"];
        } else if (col.name === "الحالة") {
          col.options = ["نشط", "غير نشط", "معلق"];
        } else {
          // For other select columns, collect existing values as options
          col.options = [];
          Object.values(tradersDB.cities).forEach((cityData) => {
            cityData.traders.forEach((trader) => {
              const value = trader[col.name];
              if (value && !col.options.includes(value)) {
                col.options.push(value);
              }
            });
          });
          // Add a default empty option if no values found
          if (col.options.length === 0) {
            col.options = [""];
          }
        }
      }
    });
  }
}

// ================================================
// Data Loading and Initialization
// ================================================
async function initializeApp() {
  // Load traders data from API first
  await loadTradersFromAPI();

  // Then load governorates data
  loadGovernoratesData();
  initializeEventListeners();
  updateAddButton();
  updateTraderSectionTitle();
  // Don't call updateTraderViews here - it will be called after data loads
}

function loadGovernoratesData() {
  // Check if we're running on a local file system
  const isLocalFile = window.location.protocol === "file:";

  if (isLocalFile) {
    // For local file system, try to load the data directly
    try {
      // This will work if the server is running
      fetch("./govs.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          processGovernoratesData(data);
        })
        .catch((error) => {
          console.error("Error loading govs.json:", error);
          // Fallback: initialize with empty data
          govsData = [];
          filteredGovs = [];
          populateLocationList();
          updateTraderViews(); // Call this even on error
        });
    } catch (error) {
      console.error("Error loading govs.json:", error);
      // Fallback: initialize with empty data
      govsData = [];
      filteredGovs = [];
      populateLocationList();
      updateTraderViews(); // Call this even on error
    }
  } else {
    // For HTTP/HTTPS, use regular fetch
    fetch("govs.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        processGovernoratesData(data);
      })
      .catch((error) => {
        console.error("Error loading govs.json:", error);
        // Fallback: initialize with empty data
        govsData = [];
        filteredGovs = [];
        populateLocationList();
        updateTraderViews(); // Call this even on error
      });
  }
}

function processGovernoratesData(data) {
  govsData = data.filter(
    (gov) => gov.cityDataModels && gov.cityDataModels.length > 0
  );

  // Sort governorates: those with traders first
  govsData.sort((a, b) => {
    const aHasTraders = a.cityDataModels.some(
      (city) =>
        tradersDB.cities[city.id] &&
        tradersDB.cities[city.id].traders.length > 0
    );
    const bHasTraders = b.cityDataModels.some(
      (city) =>
        tradersDB.cities[city.id] &&
        tradersDB.cities[city.id].traders.length > 0
    );
    return bHasTraders - aHasTraders;
  });

  filteredGovs = govsData;
  populateLocationList();
  updateTraderViews(); // Call this after data is loaded
}

// ================================================
// Utility Functions
// ================================================
function getArabicName(item) {
  return item.nameSecondaryLang || item.name || "غير محدد";
}

function getTraderCount(cityId) {
  return tradersDB.cities[cityId] ? tradersDB.cities[cityId].traders.length : 0;
}

// Removed saveToLocalStorage - now using saveTradersToAPI for real-time sync

function announceToScreenReader(message) {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}

// ================================================
// Location List Management
// ================================================
function populateLocationList() {
  const locationList = document.getElementById("location-list");
  locationList.innerHTML = "";

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < filteredGovs.length; i++) {
    const gov = filteredGovs[i];
    const govLi = document.createElement("li");
    govLi.textContent = getArabicName(gov);
    govLi.setAttribute("role", "treeitem");
    govLi.setAttribute("aria-expanded", "false");

    let govTraderCount = 0;
    for (let j = 0; j < gov.cityDataModels.length; j++) {
      const city = gov.cityDataModels[j];
      if (tradersDB.cities[city.id]) {
        govTraderCount += tradersDB.cities[city.id].traders.length;
      }
    }

    if (govTraderCount > 0) {
      govLi.innerHTML += ` <span class="badge">${govTraderCount}</span>`;
    }

    govLi.onclick = (e) => {
      e.stopPropagation();
      toggleCities(gov.id, govLi);
    };

    fragment.appendChild(govLi);

    // Nested city list
    const cityUl = document.createElement("ul");
    cityUl.className = "city-list";
    cityUl.id = `cities-${gov.id}`;
    cityUl.style.display = "none";
    cityUl.setAttribute("role", "group");

    for (let j = 0; j < gov.cityDataModels.length; j++) {
      const city = gov.cityDataModels[j];
      const cityLi = document.createElement("li");
      cityLi.textContent = getArabicName(city);
      cityLi.setAttribute("role", "treeitem");

      const cityTraderCount = getTraderCount(city.id);
      if (cityTraderCount > 0) {
        cityLi.innerHTML += ` <span class="badge">${cityTraderCount}</span>`;
      }

      cityLi.onclick = (e) => {
        e.stopPropagation();
        selectCity(city.id, cityLi);
      };

      cityUl.appendChild(cityLi);
    }

    fragment.appendChild(cityUl);
  }

  locationList.appendChild(fragment);
}

function toggleCities(govId, govLi) {
  const cityUl = document.getElementById(`cities-${govId}`);
  const isExpanded = cityUl.style.display === "block";

  if (isExpanded) {
    cityUl.style.display = "none";
    govLi.classList.remove("expanded");
    govLi.setAttribute("aria-expanded", "false");
  } else {
    cityUl.style.display = "block";
    govLi.classList.add("expanded");
    govLi.setAttribute("aria-expanded", "true");
  }
}

function selectCity(cityId, clickedElement) {
  // If clicking the same city, deselect it
  if (selectedCityId === cityId) {
    selectedCityId = null;
    clickedElement.classList.remove("selected");
    updateTraderViews();
    updateAddButton();
    updateTraderSectionTitle();
    announceToScreenReader("تم إلغاء تحديد المدينة - عرض جميع البيانات");
    return;
  }

  selectedCityId = cityId;

  // Deselect all other cities and governorates
  document
    .querySelectorAll(".city-list li, .location-list > li")
    .forEach((li) => li.classList.remove("selected"));

  // Select the current city
  if (clickedElement) {
    clickedElement.classList.add("selected");
  }

  updateTraderViews();
  updateAddButton();
  updateTraderSectionTitle();

  const city = govsData
    .flatMap((g) => g.cityDataModels)
    .find((c) => c.id === selectedCityId);

  if (city) {
    announceToScreenReader(`تم اختيار مدينة ${getArabicName(city)}`);
  }
}

// ================================================
// Search Functionality
// ================================================
function initializeSearch() {
  document.getElementById("search").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();

    if (query) {
      filteredGovs = govsData.filter(
        (gov) =>
          getArabicName(gov).toLowerCase().includes(query) ||
          gov.cityDataModels.some((city) =>
            getArabicName(city).toLowerCase().includes(query)
          )
      );
    } else {
      filteredGovs = govsData;
    }

    populateLocationList();
  });
}

// View mode management removed - only table view

// ================================================
// Trader Views Management
// ================================================
function updateTraderViews() {
  updateTableView();
}

function updateTableView() {
  const header = document.getElementById("table-header");
  const body = document.getElementById("table-body");
  header.innerHTML = "";
  body.innerHTML = "";

  // Add class to the existing header row
  header.className = "dynamic-header-row";

  // Add Governorate and City columns FIRST
  const thGov = document.createElement("th");
  thGov.textContent = "المحافظة";
  thGov.className = "dynamic-header-cell location-header";
  header.appendChild(thGov);

  const thCity = document.createElement("th");
  thCity.textContent = "المدينة";
  thCity.className = "dynamic-header-cell location-header";
  header.appendChild(thCity);

  // Then add data columns
  tradersDB.columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = typeof col === "string" ? col : col.name;
    th.className = "dynamic-header-cell";
    header.appendChild(th);
  });

  const thActions = document.createElement("th");
  thActions.textContent = "إجراءات";
  thActions.className = "dynamic-header-cell actions-header";
  thActions.style.textAlign = "center";
  header.appendChild(thActions);

  const fragment = document.createDocumentFragment();

  if (selectedCityId) {
    // Show single city data
    if (
      tradersDB.cities[selectedCityId] &&
      tradersDB.cities[selectedCityId].traders.length > 0
    ) {
      const traders = tradersDB.cities[selectedCityId].traders;
      for (let index = 0; index < traders.length; index++) {
        const tr = createTraderTableRow(traders[index], selectedCityId, index);
        fragment.appendChild(tr);
      }
    }
  } else {
    // Show all cities data WITHOUT separator rows
    const citiesWithData = Object.keys(tradersDB.cities).filter(
      (cityId) => tradersDB.cities[cityId].traders.length > 0
    );

    for (let cityIndex = 0; cityIndex < citiesWithData.length; cityIndex++) {
      const cityId = citiesWithData[cityIndex];
      const cityData = tradersDB.cities[cityId];

      // Add traders for this city directly (no separator)
      for (
        let traderIndex = 0;
        traderIndex < cityData.traders.length;
        traderIndex++
      ) {
        const tr = createTraderTableRow(
          cityData.traders[traderIndex],
          cityId,
          traderIndex
        );
        fragment.appendChild(tr);
      }
    }
  }

  body.appendChild(fragment);
}

function createTraderTableRow(trader, cityId, index) {
  const tr = document.createElement("tr");
  tr.setAttribute("data-city-id", cityId);
  tr.setAttribute("data-trader-index", index);

  // Add governorate and city cells FIRST (read-only)
  const locationInfo = getLocationInfoById(cityId);

  const tdGov = document.createElement("td");
  tdGov.className = "trader-cell location-cell";
  tdGov.setAttribute("data-column", "المحافظة");
  tdGov.setAttribute("data-type", "readonly");
  tdGov.textContent = locationInfo.governorate;
  tr.appendChild(tdGov);

  const tdCity = document.createElement("td");
  tdCity.className = "trader-cell location-cell";
  tdCity.setAttribute("data-column", "المدينة");
  tdCity.setAttribute("data-type", "readonly");
  tdCity.textContent = locationInfo.city;
  tr.appendChild(tdCity);

  // Add data cells with dynamic width
  for (let colIndex = 0; colIndex < tradersDB.columns.length; colIndex++) {
    const col = tradersDB.columns[colIndex];
    const colName = typeof col === "string" ? col : col.name;
    const colType = typeof col === "string" ? "text" : col.type;
    const td = document.createElement("td");
    td.className = "trader-cell";
    td.setAttribute("data-column", colName);
    td.setAttribute("data-type", colType);

    const value = trader[colName] !== undefined ? trader[colName] : "";
    td.innerHTML = formatCellValue(value, colType);

    // Remove double-click editing - use only row edit button
    td.title = "انقر على تعديل لتعديل الصف";

    tr.appendChild(td);
  }

  // Actions cell
  const tdActions = document.createElement("td");
  tdActions.style.textAlign = "center";
  const editBtn = document.createElement("button");
  editBtn.textContent = "تعديل";
  editBtn.className = "btn-edit";
  editBtn.onclick = () => toggleRowEdit(tr, cityId, index);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "حذف";
  deleteBtn.className = "btn-delete";
  deleteBtn.onclick = () =>
    showConfirmationModal(
      "حذف التاجر",
      "هل أنت متأكد من حذف هذا التاجر؟",
      "🗑️",
      () => deleteTrader(cityId, index)
    );

  tdActions.appendChild(editBtn);
  tdActions.appendChild(deleteBtn);
  tr.appendChild(tdActions);

  return tr;
}

function getLocationInfoById(cityId) {
  // Handle case where govsData is not loaded yet
  if (!govsData || govsData.length === 0) {
    return { city: `مدينة ${cityId}`, governorate: "غير محدد" };
  }

  // Convert cityId to number if it's a string
  const numericCityId = typeof cityId === "string" ? parseInt(cityId) : cityId;

  // Try exact match first
  for (let i = 0; i < govsData.length; i++) {
    const gov = govsData[i];
    for (let j = 0; j < gov.cityDataModels.length; j++) {
      const city = gov.cityDataModels[j];
      if (city.id === numericCityId) {
        return {
          city: getArabicName(city),
          governorate: getArabicName(gov),
        };
      }
    }
  }

  // Try string comparison as fallback
  const cityIdStr = cityId.toString();
  for (let i = 0; i < govsData.length; i++) {
    const gov = govsData[i];
    for (let j = 0; j < gov.cityDataModels.length; j++) {
      const city = gov.cityDataModels[j];
      if (city.id.toString() === cityIdStr) {
        return {
          city: getArabicName(city),
          governorate: getArabicName(gov),
        };
      }
    }
  }

  return { city: `مدينة ${cityId}`, governorate: "غير محدد" };
}

function getCityNameById(cityId) {
  // Handle case where govsData is not loaded yet
  if (!govsData || govsData.length === 0) {
    return `مدينة ${cityId}`; // fallback with Arabic prefix
  }

  // Convert cityId to number if it's a string
  const numericCityId = typeof cityId === "string" ? parseInt(cityId) : cityId;

  // Try exact match first
  for (let i = 0; i < govsData.length; i++) {
    const gov = govsData[i];
    for (let j = 0; j < gov.cityDataModels.length; j++) {
      const city = gov.cityDataModels[j];
      if (city.id === numericCityId) {
        return getArabicName(city);
      }
    }
  }

  // Try string comparison as fallback
  const cityIdStr = cityId.toString();
  for (let i = 0; i < govsData.length; i++) {
    const gov = govsData[i];
    for (let j = 0; j < gov.cityDataModels.length; j++) {
      const city = gov.cityDataModels[j];
      if (city.id.toString() === cityIdStr) {
        return getArabicName(city);
      }
    }
  }

  return `مدينة ${cityId}`; // fallback with Arabic prefix
}

// Card view removed - only table view now

// Grid view removed - only table view now

// Card and grid item creation removed - only table view now

function formatCellValue(value, type) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const maxLength = 20; // Maximum characters before truncation
  const valueStr = String(value);

  // Special handling for different types
  switch (type) {
    case "phone":
      if (valueStr.length > maxLength) {
        return `<span class="truncated-content">${valueStr.substring(
          0,
          maxLength
        )}...</span><a href="tel:${value}" class="phone-link full-content" style="display: none;">${value}</a><span class="see-more-btn" onclick="toggleCellContent(this)">see more</span>`;
      }
      return `<a href="tel:${value}" class="phone-link">${value}</a>`;

    case "email":
      if (valueStr.length > maxLength) {
        return `<span class="truncated-content">${valueStr.substring(
          0,
          maxLength
        )}...</span><a href="mailto:${value}" class="email-link full-content" style="display: none;">${value}</a><span class="see-more-btn" onclick="toggleCellContent(this)">see more</span>`;
      }
      return `<a href="mailto:${value}" class="email-link">${value}</a>`;

    case "url":
      if (valueStr.length > maxLength) {
        return `<span class="truncated-content">${valueStr.substring(
          0,
          maxLength
        )}...</span><a href="${value}" target="_blank" class="url-link full-content" style="display: none;">${value}</a><span class="see-more-btn" onclick="toggleCellContent(this)">see more</span>`;
      }
      return `<a href="${value}" target="_blank" class="url-link">${value}</a>`;

    case "checkbox":
      return value ? "✅" : "❌";

    case "select":
      const selectValue = value || "-";
      if (selectValue.length > maxLength) {
        return `<span class="truncated-content">${selectValue.substring(
          0,
          maxLength
        )}...</span><span class="full-content" style="display: none;">${selectValue}</span><span class="see-more-btn" onclick="toggleCellContent(this)">see more</span>`;
      }
      return selectValue;

    default:
      if (valueStr.length > maxLength) {
        return `<span class="truncated-content">${valueStr.substring(
          0,
          maxLength
        )}...</span><span class="full-content" style="display: none;">${valueStr}</span><span class="see-more-btn" onclick="toggleCellContent(this)">see more</span>`;
      }
      return valueStr;
  }
}

function toggleCellContent(btn) {
  const cell = btn.closest("td");
  const truncatedContent = cell.querySelector(".truncated-content");
  const fullContent = cell.querySelector(".full-content");

  if (fullContent.style.display === "none") {
    // Show full content
    truncatedContent.style.display = "none";
    fullContent.style.display = "inline";
    btn.textContent = "see less";
  } else {
    // Show truncated content
    truncatedContent.style.display = "inline";
    fullContent.style.display = "none";
    btn.textContent = "see more";
  }
}

function createActionButton(text, className, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

// ================================================
// Row Editing (Replaces inline editing)
// ================================================

function toggleRowEdit(row, cityId, index) {
  const isEditing = row.classList.contains("row-editing");

  if (isEditing) {
    // Save all changes and exit edit mode
    saveRowEdit(row);
  } else {
    // Enter edit mode
    enableRowEdit(row);
  }
}

function enableRowEdit(row) {
  row.classList.add("row-editing");
  const cells = row.querySelectorAll(".trader-cell");

  cells.forEach((cell) => {
    const colType = cell.dataset.type;

    // Skip readonly cells (governorate and city)
    if (colType === "readonly") {
      return;
    }

    const currentValue = getCurrentCellValue(cell, colType);
    const columnName = cell.dataset.column;
    const column = tradersDB.columns.find(
      (col) => (typeof col === "string" ? col : col.name) === columnName
    );
    const options = column && typeof column === "object" ? column.options : [];

    // Store original content
    cell.dataset.originalContent = cell.innerHTML;
    cell.classList.add("editing");

    // Create input based on column type
    let input;
    if (colType === "select") {
      input = document.createElement("select");
      input.className = "inline-edit-select";

      // If no options defined, add current value as option
      if (!options || options.length === 0) {
        if (currentValue) {
          const option = document.createElement("option");
          option.value = currentValue;
          option.textContent = currentValue;
          option.selected = true;
          input.appendChild(option);
        }
      } else {
        // Add all defined options
        options.forEach((optionText) => {
          const option = document.createElement("option");
          option.value = optionText;
          option.textContent = optionText;
          if (optionText === currentValue) option.selected = true;
          input.appendChild(option);
        });

        // If current value is not in options, add it
        if (currentValue && !options.includes(currentValue)) {
          const option = document.createElement("option");
          option.value = currentValue;
          option.textContent = currentValue;
          option.selected = true;
          input.appendChild(option);
        }
      }
    } else if (colType === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.className = "inline-edit-checkbox";
      input.checked = currentValue === true || currentValue === "true";
    } else {
      input = document.createElement("input");
      input.className = "inline-edit-input";
      switch (colType) {
        case "number":
          input.type = "number";
          break;
        case "phone":
          input.type = "tel";
          break;
        case "email":
          input.type = "email";
          break;
        case "url":
          input.type = "url";
          break;
        case "date":
          input.type = "date";
          break;
        default:
          input.type = "text";
      }
      input.value = currentValue || "";
    }

    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    if (input.select) input.select();
  });

  // Update button text
  const editBtn = row.querySelector(".btn-edit");
  editBtn.textContent = "حفظ";
  editBtn.className = "btn-save";
}

function saveRowEdit(row) {
  const cells = row.querySelectorAll(".trader-cell");
  const cityId = row.dataset.cityId;
  const traderIndex = parseInt(row.dataset.traderIndex);

  cells.forEach((cell) => {
    const input = cell.querySelector("input, select");
    if (input) {
      const colType = cell.dataset.type;
      const columnName = cell.dataset.column;

      let newValue;
      if (colType === "checkbox") {
        newValue = input.checked;
      } else {
        newValue = input.value.trim();
      }

      // Update the database
      if (
        tradersDB.cities[cityId] &&
        tradersDB.cities[cityId].traders[traderIndex]
      ) {
        tradersDB.cities[cityId].traders[traderIndex][columnName] = newValue;
      }

      // Update cell display with truncation
      cell.innerHTML = formatCellValue(newValue, colType);
      cell.classList.remove("editing");
      delete cell.dataset.originalContent;
    }
  });

  // Save to localStorage
  saveTradersToAPI();

  row.classList.remove("row-editing");

  // Update button text
  const saveBtn = row.querySelector(".btn-save");
  saveBtn.textContent = "تعديل";
  saveBtn.className = "btn-edit";
}

function getCurrentCellValue(cell, colType) {
  if (colType === "checkbox") {
    return cell.textContent.includes("✅");
  } else if (colType === "phone") {
    const link = cell.querySelector("a");
    return link ? link.textContent : "";
  } else if (colType === "email") {
    const link = cell.querySelector("a");
    return link ? link.textContent : "";
  } else if (colType === "url") {
    const link = cell.querySelector("a");
    return link ? link.href : "";
  } else {
    // For truncated content, get the full content if available
    const fullContent = cell.querySelector(".full-content");
    if (fullContent) {
      return fullContent.textContent.trim();
    }
    // Otherwise get the truncated content
    const truncatedContent = cell.querySelector(".truncated-content");
    if (truncatedContent) {
      return truncatedContent.textContent.replace("...", "").trim();
    }
    // Fallback to cell text
    return cell.textContent.trim();
  }
}

// ================================================
// Trader Form Management
// ================================================
function showForm(editMode = false, traderData = null, traderIndex = null) {
  const form = document.getElementById("trader-form");
  const fields = document.getElementById("form-fields");
  fields.innerHTML = "";

  tradersDB.columns.forEach((col) => {
    const colName = typeof col === "string" ? col : col.name;
    const colType = typeof col === "string" ? "text" : col.type;

    const fieldContainer = document.createElement("div");
    fieldContainer.className = "field-container";

    const label = document.createElement("label");
    label.textContent = colName;
    label.className = "field-label";
    fieldContainer.appendChild(label);

    let input = createFormInput(colType, colName, col.options);
    input.setAttribute("data-column", colName);

    // Set existing values for edit mode
    if (editMode && traderData) {
      if (colType === "checkbox") {
        input.checked = traderData[colName] === true;
      } else {
        input.value = traderData[colName] || "";
      }
    }

    fieldContainer.appendChild(input);
    fields.appendChild(fieldContainer);
  });

  form.classList.remove("hidden");

  // Update form handler
  const formElement = document.getElementById("trader-input-form");
  formElement.onsubmit = editMode
    ? (e) => updateTrader(e, traderIndex)
    : addTrader;
}

function createFormInput(type, name, options = []) {
  let input;

  if (type === "select") {
    input = document.createElement("select");
    input.className = "form-select";
    options.forEach((optionText) => {
      const option = document.createElement("option");
      option.value = optionText;
      option.textContent = optionText;
      input.appendChild(option);
    });
  } else if (type === "checkbox") {
    input = document.createElement("input");
    input.type = "checkbox";
    input.className = "form-checkbox";
  } else {
    input = document.createElement("input");
    switch (type) {
      case "number":
        input.type = "number";
        break;
      case "phone":
        input.type = "tel";
        input.pattern = "[0-9+\\-\\s]+";
        break;
      case "email":
        input.type = "email";
        break;
      case "url":
        input.type = "url";
        break;
      case "date":
        input.type = "date";
        break;
      default:
        input.type = "text";
    }
  }

  input.placeholder = name;
  if (type !== "checkbox") input.required = true;

  return input;
}

function addTrader(e) {
  e.preventDefault();
  const inputs = Array.from(
    document.getElementById("form-fields").querySelectorAll("input, select")
  );
  const trader = {};

  tradersDB.columns.forEach((col, i) => {
    const colName = typeof col === "string" ? col : col.name;
    const colType = typeof col === "string" ? "text" : col.type;
    const input = inputs[i];

    if (colType === "checkbox") {
      trader[colName] = input.checked;
    } else {
      trader[colName] = input.value || "";
    }
  });

  if (!tradersDB.cities[selectedCityId]) {
    tradersDB.cities[selectedCityId] = { traders: [] };
  }

  tradersDB.cities[selectedCityId].traders.push(trader);
  saveTradersToAPI();
  updateTraderViews();
  hideForm();
  populateLocationList();
  announceToScreenReader("تم إضافة التاجر بنجاح");
}

function editTrader(cityId, traderIndex) {
  const trader = tradersDB.cities[cityId].traders[traderIndex];
  showForm(true, trader, traderIndex);
}

function updateTrader(e, traderIndex) {
  e.preventDefault();
  const inputs = Array.from(
    document.getElementById("form-fields").querySelectorAll("input, select")
  );
  const trader = {};

  tradersDB.columns.forEach((col, i) => {
    const colName = typeof col === "string" ? col : col.name;
    const colType = typeof col === "string" ? "text" : col.type;
    const input = inputs[i];

    if (colType === "checkbox") {
      trader[colName] = input.checked;
    } else {
      trader[colName] = input.value || "";
    }
  });

  tradersDB.cities[selectedCityId].traders[traderIndex] = trader;
  saveTradersToAPI();
  updateTraderViews();
  hideForm();
  populateLocationList();
  announceToScreenReader("تم تحديث بيانات التاجر بنجاح");
}

function deleteTrader(cityId, index) {
  tradersDB.cities[cityId].traders.splice(index, 1);
  if (tradersDB.cities[cityId].traders.length === 0) {
    delete tradersDB.cities[cityId];
  }
  saveTradersToAPI();
  updateTraderViews();
  populateLocationList();
  announceToScreenReader("تم حذف التاجر بنجاح");
}

function hideForm() {
  document.getElementById("trader-form").classList.add("hidden");
}

function updateAddButton() {
  const btn = document.getElementById("add-trader-btn");
  if (selectedCityId) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
}

function updateTraderSectionTitle() {
  const titleElement = document.getElementById("trader-section-title");
  if (selectedCityId) {
    const city = govsData
      .flatMap((g) => g.cityDataModels)
      .find((c) => c.id === selectedCityId);
    if (city) {
      titleElement.textContent = `إدارة التجار - ${getArabicName(city)}`;
    } else {
      titleElement.textContent = "إدارة التجار";
    }
  } else {
    titleElement.textContent = "إدارة التجار - جميع المدن";
  }
}

// ================================================
// Notification System
// ================================================
function showNotification(message, type = "info") {
  // Create notification element if it doesn't exist
  let notification = document.getElementById("notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "notification";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-family: 'Cairo', sans-serif;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;
    document.body.appendChild(notification);
  }

  // Set colors based on type
  const colors = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#007bff",
  };

  notification.style.backgroundColor = colors[type] || colors.info;
  notification.textContent = message;

  // Show notification
  notification.style.transform = "translateX(0)";

  // Hide after 4 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
  }, 4000);
}

// ================================================
// Excel Export Functionality
// ================================================
function exportToExcel() {
  let dataToExport = [];
  let filename = "traders";

  if (selectedCityId) {
    // Export single city data (matches what's displayed)
    if (
      tradersDB.cities[selectedCityId] &&
      tradersDB.cities[selectedCityId].traders.length > 0
    ) {
      const locationInfo = getLocationInfoById(selectedCityId);
      filename = `traders_${locationInfo.city}_${locationInfo.governorate}`;

      tradersDB.cities[selectedCityId].traders.forEach((trader) => {
        // Start with location columns (matching table display)
        const row = {
          المحافظة: locationInfo.governorate,
          المدينة: locationInfo.city,
        };

        // Add all data columns
        tradersDB.columns.forEach((col) => {
          const colName = typeof col === "string" ? col : col.name;
          const colType = typeof col === "string" ? "text" : col.type;
          let value = trader[colName] || "";

          // Format values for Excel
          if (colType === "checkbox") {
            value = value ? "نعم" : "لا";
          } else if (colType === "phone" && value) {
            value = value.toString(); // Ensure phone numbers are strings
          }
          row[colName] = value;
        });
        dataToExport.push(row);
      });
    }
  } else {
    // Export all cities data (matches full table display)
    filename = "traders_all_data";
    const citiesWithData = Object.keys(tradersDB.cities).filter(
      (cityId) => tradersDB.cities[cityId].traders.length > 0
    );

    citiesWithData.forEach((cityId) => {
      const locationInfo = getLocationInfoById(cityId);
      tradersDB.cities[cityId].traders.forEach((trader) => {
        // Start with location columns (matching table display)
        const row = {
          المحافظة: locationInfo.governorate,
          المدينة: locationInfo.city,
        };

        // Add all data columns
        tradersDB.columns.forEach((col) => {
          const colName = typeof col === "string" ? col : col.name;
          const colType = typeof col === "string" ? "text" : col.type;
          let value = trader[colName] || "";

          // Format values for Excel
          if (colType === "checkbox") {
            value = value ? "نعم" : "لا";
          } else if (colType === "phone" && value) {
            value = value.toString(); // Ensure phone numbers are strings
          }
          row[colName] = value;
        });
        dataToExport.push(row);
      });
    });
  }

  if (dataToExport.length === 0) {
    showNotification("لا توجد بيانات للتصدير", "warning");
    return;
  }

  // Show export progress
  const exportBtn = document.getElementById("export-excel-btn");
  const originalText = exportBtn.textContent;
  exportBtn.textContent = "جارٍ التصدير...";
  exportBtn.disabled = true;

  try {
    // Convert to CSV format with proper Arabic support
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((row) =>
        headers
          .map((header) => {
            let value = row[header] || "";
            // Convert to string and escape
            value = String(value);
            if (
              value.includes(",") ||
              value.includes('"') ||
              value.includes("\n")
            ) {
              value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Add BOM for proper Arabic encoding in Excel
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Clean filename for different operating systems
    const cleanFilename = filename.replace(/[<>:"/\\|?*]/g, "_");
    link.download = cleanFilename + ".csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success notification
    const exportType = selectedCityId ? "المدينة المختارة" : "جميع البيانات";
    showNotification(
      `تم تصدير ${dataToExport.length} صف من ${exportType} بنجاح`,
      "success"
    );
    announceToScreenReader(`تم تصدير ${dataToExport.length} صف إلى ملف Excel`);
  } catch (error) {
    console.error("Export error:", error);
    showNotification("حدث خطأ أثناء التصدير", "error");
  } finally {
    // Restore button state
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
  }
}

// ================================================
// Column Management
// ================================================
function showColumnManager() {
  document.getElementById("column-manager").classList.toggle("hidden");
  updateColumnList();
}

function updateColumnList() {
  const list = document.getElementById("column-list");
  list.innerHTML = "";

  tradersDB.columns.forEach((col, i) => {
    const colName = typeof col === "string" ? col : col.name;
    const colType = typeof col === "string" ? "text" : col.type;

    const li = document.createElement("li");
    li.className = "column-item";

    // Move buttons
    const moveButtons = document.createElement("div");
    moveButtons.className = "column-move-buttons";

    const moveUpBtn = document.createElement("button");
    moveUpBtn.innerHTML = "▲";
    moveUpBtn.className = "btn-move-up";
    moveUpBtn.title = "تحريك للأعلى";
    moveUpBtn.disabled = i === 0;
    moveUpBtn.addEventListener("click", () => moveColumn(i, i - 1));

    const moveDownBtn = document.createElement("button");
    moveDownBtn.innerHTML = "▼";
    moveDownBtn.className = "btn-move-down";
    moveDownBtn.title = "تحريك للأسفل";
    moveDownBtn.disabled = i === tradersDB.columns.length - 1;
    moveDownBtn.addEventListener("click", () => moveColumn(i, i + 1));

    moveButtons.appendChild(moveUpBtn);
    moveButtons.appendChild(moveDownBtn);

    const info = document.createElement("div");
    info.className = "column-info";
    info.innerHTML = `
      <span class="column-position-badge">${i + 1}</span>
      <span class="column-name">${colName}</span>
      <span class="column-type">${getTypeLabel(colType)}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "column-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "تعديل";
    editBtn.className = "btn-edit-column";
    editBtn.addEventListener("click", () => showEditColumnModal(i, col));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "حذف";
    deleteBtn.className = "btn-delete-column";
    deleteBtn.addEventListener("click", () =>
      showConfirmationModal(
        "حذف العمود",
        `هل أنت متأكد من حذف العمود "${colName}"؟`,
        "🗑️",
        () => deleteColumn(i)
      )
    );

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(moveButtons);
    li.appendChild(info);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

function getTypeLabel(type) {
  const typeLabels = {
    text: "نص",
    number: "رقم",
    phone: "هاتف",
    email: "بريد إلكتروني",
    url: "رابط",
    date: "تاريخ",
    checkbox: "خانة اختيار",
    select: "قائمة منسدلة",
  };
  return typeLabels[type] || "نص";
}

function addColumn() {
  const name = document.getElementById("new-column-name").value.trim();
  const type = document.getElementById("column-type").value;
  const optionsInput = document.getElementById("select-options").value.trim();

  if (name) {
    const newColumn = { name, type };

    if (type === "select" && optionsInput) {
      newColumn.options = optionsInput
        .split(",")
        .map((opt) => opt.trim())
        .filter((opt) => opt);
    }

    tradersDB.columns.push(newColumn);
    saveTradersToAPI();
    updateColumnList();
    updateTraderViews();

    // Clear form
    document.getElementById("new-column-name").value = "";
    document.getElementById("column-type").value = "text";
    document.getElementById("select-options").value = "";
    document.getElementById("select-options-group").style.display = "none";

    announceToScreenReader(`تم إضافة العمود "${name}" بنجاح`);
  }
}

function deleteColumn(index) {
  const columnName =
    typeof tradersDB.columns[index] === "string"
      ? tradersDB.columns[index]
      : tradersDB.columns[index].name;

  tradersDB.columns.splice(index, 1);

  // Remove column data from all traders
  Object.values(tradersDB.cities).forEach((city) => {
    city.traders.forEach((trader) => delete trader[columnName]);
  });

  saveTradersToAPI();
  updateTraderViews();
  updateColumnList();
  announceToScreenReader(`تم حذف العمود "${columnName}" بنجاح`);
}

function moveColumn(fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    toIndex < 0 ||
    toIndex >= tradersDB.columns.length
  )
    return;

  // Get the column to move
  const column = tradersDB.columns[fromIndex];

  // Remove from old position
  tradersDB.columns.splice(fromIndex, 1);

  // Insert at new position
  tradersDB.columns.splice(toIndex, 0, column);

  // Save and update UI
  saveTradersToAPI();
  updateTraderViews();
  updateColumnList();

  const colName = typeof column === "string" ? column : column.name;
  const direction = toIndex < fromIndex ? "للأعلى" : "للأسفل";
  showNotification(
    `تم نقل "${colName}" ${direction} - الترتيب الجديد: ${toIndex + 1}`,
    "success"
  );
  announceToScreenReader(`تم نقل العمود "${colName}" بنجاح`);
}

function showEditColumnModal(columnIndex, column) {
  const colName = typeof column === "string" ? column : column.name;
  const colType = typeof column === "string" ? "text" : column.type;
  const colOptions =
    typeof column === "object" && column.options ? column.options : [];

  const modal = document.getElementById("confirmation-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalIcon = document.getElementById("modal-icon");
  const modalBody = modal.querySelector(".modal-body");

  modalTitle.textContent = `تعديل العمود: ${colName}`;
  modalIcon.textContent = "✏️";

  // Create edit form
  modalBody.innerHTML = `
    <div class="edit-column-form">
      <div class="form-group-edit">
        <label class="edit-label">النوع:</label>
        <select id="edit-column-type" class="edit-select">
          <option value="text" ${
            colType === "text" ? "selected" : ""
          }>نص</option>
          <option value="number" ${
            colType === "number" ? "selected" : ""
          }>رقم</option>
          <option value="phone" ${
            colType === "phone" ? "selected" : ""
          }>هاتف</option>
          <option value="email" ${
            colType === "email" ? "selected" : ""
          }>بريد</option>
          <option value="url" ${
            colType === "url" ? "selected" : ""
          }>رابط</option>
          <option value="date" ${
            colType === "date" ? "selected" : ""
          }>تاريخ</option>
          <option value="checkbox" ${
            colType === "checkbox" ? "selected" : ""
          }>اختيار</option>
          <option value="select" ${
            colType === "select" ? "selected" : ""
          }>قائمة</option>
        </select>
      </div>
      <div class="form-group-edit" id="edit-options-group" style="display: ${
        colType === "select" ? "flex" : "none"
      }">
        <label class="edit-label">الخيارات:</label>
        <input 
          type="text" 
          id="edit-column-options" 
          class="edit-input" 
          placeholder="خيار 1, خيار 2, خيار 3"
          value="${colOptions.join(", ")}"
        />
      </div>
    </div>
  `;

  // Toggle options visibility
  const typeSelect = document.getElementById("edit-column-type");
  const optionsGroup = document.getElementById("edit-options-group");
  typeSelect.addEventListener("change", () => {
    optionsGroup.style.display =
      typeSelect.value === "select" ? "flex" : "none";
  });

  modal.classList.remove("hidden");

  // Replace confirm button handler
  const confirmBtn = document.getElementById("modal-confirm");
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.textContent = "حفظ التعديلات";
  newConfirmBtn.className = "btn-primary";

  newConfirmBtn.addEventListener("click", () => {
    const newType = document.getElementById("edit-column-type").value;
    const newOptions = document
      .getElementById("edit-column-options")
      .value.split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt);

    // Update column
    const updatedColumn = {
      name: colName,
      type: newType,
    };

    if (newType === "select" && newOptions.length > 0) {
      updatedColumn.options = newOptions;
    }

    tradersDB.columns[columnIndex] = updatedColumn;

    // Save and update
    saveTradersToAPI();
    updateTraderViews();
    updateColumnList();
    hideModal();

    showNotification(`تم تعديل العمود "${colName}" بنجاح`, "success");
    announceToScreenReader(`تم تعديل العمود "${colName}" بنجاح`);
  });

  // Focus management
  setTimeout(() => {
    document.getElementById("edit-column-type").focus();
  }, 100);
}

function toggleSelectOptions() {
  const optionsGroup = document.getElementById("select-options-group");
  const columnType = document.getElementById("column-type").value;

  if (columnType === "select") {
    optionsGroup.style.display = "block";
    document.getElementById("select-options").required = true;
  } else {
    optionsGroup.style.display = "none";
    document.getElementById("select-options").required = false;
  }
}

// ================================================
// Modal Management
// ================================================
function showConfirmationModal(title, message, icon, callback) {
  const modal = document.getElementById("confirmation-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const modalIcon = document.getElementById("modal-icon");

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalIcon.textContent = icon;

  modal.classList.remove("hidden");

  // Remove any existing event listeners and add new one
  const confirmBtn = document.getElementById("modal-confirm");
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  document.getElementById("modal-confirm").addEventListener("click", () => {
    callback();
    hideModal();
  });

  // Focus management
  setTimeout(() => {
    document.getElementById("modal-confirm").focus();
  }, 100);
}

function hideModal() {
  const modal = document.getElementById("confirmation-modal");
  modal.classList.add("hidden");
}

// ================================================
// Event Listeners Initialization
// ================================================
function initializeEventListeners() {
  // Search functionality
  initializeSearch();

  // View mode buttons removed - only table view now

  // Trader management
  document
    .getElementById("list-all-traders-btn")
    .addEventListener("click", () => {
      // Clear city selection and show all traders
      selectedCityId = null;

      // Deselect all cities and governorates
      document
        .querySelectorAll(".city-list li, .location-list > li")
        .forEach((li) => li.classList.remove("selected"));

      updateAddButton();
      updateTraderSectionTitle();
      updateTraderViews();
      showNotification("عرض جميع التجار من كل المدن", "info");
      announceToScreenReader("تم عرض جميع التجار");
    });

  document.getElementById("add-trader-btn").addEventListener("click", () => {
    if (!selectedCityId) return;
    showForm();
  });

  document.getElementById("cancel-form").addEventListener("click", hideForm);

  // Excel export
  document
    .getElementById("export-excel-btn")
    .addEventListener("click", exportToExcel);

  // Column management
  document
    .getElementById("manage-columns-btn")
    .addEventListener("click", showColumnManager);
  document
    .getElementById("add-column-btn")
    .addEventListener("click", addColumn);
  document
    .getElementById("column-type")
    .addEventListener("change", toggleSelectOptions);

  // Modal events
  document.getElementById("modal-close").addEventListener("click", hideModal);
  document.getElementById("modal-cancel").addEventListener("click", hideModal);

  // Close modal when clicking outside
  document
    .getElementById("confirmation-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "confirmation-modal") {
        hideModal();
      }
    });

  // Keyboard navigation
  initializeKeyboardNavigation();
}

function initializeKeyboardNavigation() {
  document.addEventListener("keydown", (e) => {
    // Handle escape key for modals and forms
    if (e.key === "Escape") {
      const modal = document.getElementById("confirmation-modal");
      const form = document.getElementById("trader-form");
      const columnManager = document.getElementById("column-manager");

      if (!modal.classList.contains("hidden")) {
        hideModal();
      } else if (!form.classList.contains("hidden")) {
        hideForm();
      } else if (!columnManager.classList.contains("hidden")) {
        showColumnManager();
      }
    }

    // Handle arrow keys for view mode toggle
    if (e.target.classList.contains("view-btn")) {
      const viewBtns = Array.from(document.querySelectorAll(".view-btn"));
      const currentIndex = viewBtns.indexOf(e.target);

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const newIndex =
          (currentIndex + direction + viewBtns.length) % viewBtns.length;
        viewBtns[newIndex].focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.target.click();
      }
    }
  });
}

// Dynamic width calculation removed - using natural table layout

// ================================================
// Application Initialization
// ================================================
document.addEventListener("DOMContentLoaded", initializeApp);
