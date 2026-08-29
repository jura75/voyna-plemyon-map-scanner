javascript:(function() {
    if (typeof game_data === 'undefined' || game_data.screen !== 'map') {
        alert('Запустите скрипт на странице карты!');
        return;
    }

    if (!window._mapScannerSavedHistory) {
        try {
            window._mapScannerSavedHistory = JSON.parse(localStorage.getItem('_tw_scanner_history') || '[]');
        } catch(e) {
            window._mapScannerSavedHistory = [];
        }
    }

    function launchMapScanner() {
        $('#custom-map-scanner').remove();
        window._mapScannerData = [];
        window._mapCurrentFiltered = [];

        var html = `
        <div id="custom-map-scanner" style="position: fixed; top: 100px; left: 100px; width: 880px; height: 550px; background: #f4e4bc; border: 3px solid #7d510f; z-index: 99999; box-shadow: 0 0 15px rgba(0,0,0,0.5); font-family: Verdana, Arial; display: flex; flex-direction: column;">
            <div id="scanner-header" style="background: #7d510f; color: #fff; padding: 8px; font-weight: bold; cursor: move; display: flex; justify-content: space-between; align-items: center;">
                <span>Сканер карты + Архив (Скролл для таблиц)</span>
                <button id="scanner-close" style="background: #c00; color: #fff; border: none; font-weight: bold; cursor: pointer; padding: 2px 6px;">X</button>
            </div>
            
            <div style="display: flex; background: #dcc293; border-bottom: 2px solid #7d510f;">
                <button id="tab-btn-scanner" style="flex: 1; padding: 6px; background: #f4e4bc; border: none; font-weight: bold; cursor: pointer; border-right: 1px solid #bc9a63;">Сканер карты</button>
                <button id="tab-btn-history" style="flex: 1; padding: 6px; background: #dcc293; border: none; font-weight: bold; cursor: pointer; color: #555;">Сохраненные данные (<span id="history-badge">0</span>)</button>
            </div>

            <!-- Вкладка 1: Сканер -->
            <div id="tab-content-scanner" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                <div style="padding: 10px; display: flex; gap: 6px; background: #e8d3a2; border-bottom: 1px solid #bc9a63; align-items: center; flex-wrap: wrap;">
                    <label style="font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                        Рамка:
                        <select id="scanner-size-select" style="padding: 4px;">
                            <option value="1">1x1</option>
                            <option value="3" selected>3x3</option>
                            <option value="5">5x5</option>
                            <option value="7">7x7</option>
                            <option value="9">9x9</option>
                            <option value="11">11x11</option>
                            <option value="15">15x15</option>
                        </select>
                    </label>
                    <button id="scanner-btn-update" style="background: #5b3511; color: #fff; border: 1px solid #3c2007; padding: 5px 8px; font-weight: bold; cursor: pointer;">Сканировать</button>
                    <button id="scanner-btn-clear" style="background: #a94442; color: #fff; border: 1px solid #6b2624; padding: 5px 8px; font-weight: bold; cursor: pointer;">Сбросить</button>
                    <select id="filter-player" style="padding: 4px; max-width: 100px;"><option value="">Все игроки</option></select>
                    <select id="filter-ally" style="padding: 4px; max-width: 100px;"><option value="">Все племена</option></select>
                    <select id="filter-k" style="padding: 4px; max-width: 75px;"><option value="">Все квад.</option></select>
                    <button id="scanner-copy" style="background: #5b3511; color: #fff; border: 1px solid #3c2007; padding: 5px 8px; font-weight: bold; cursor: pointer; font-size: 11px;">Копировать</button>
                    <span id="scanner-count" style="font-size: 11px; font-weight: bold;">Найдено: 0</span>
                </div>
                <div style="flex: 1; overflow-y: auto; background: #fff; padding: 5px;">
                    <table id="scanner-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background: #e8d3a2; border-bottom: 1px solid #7d510f; text-align: left;">
                                <th style="padding: 6px; border: 1px solid #ddd;">Координаты</th>
                                <th style="padding: 6px; border: 1px solid #ddd;">Квадрат</th>
                                <th style="padding: 6px; border: 1px solid #ddd;">Игрок</th>
                                <th style="padding: 6px; border: 1px solid #ddd;">Племя</th>
                            </tr>
                        </thead>
                        <tbody id="scanner-tbody">
                            <tr><td colspan="4" style="text-align: center; color: #777; padding: 20px;">Нажмите "Сканировать"</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Вкладка 2: Сохраненные данные -->
            <div id="tab-content-history" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
                <div style="padding: 10px; display: flex; gap: 6px; background: #e8d3a2; border-bottom: 1px solid #bc9a63; align-items: center;">
                    <button id="history-btn-clear" style="background: #a94442; color: #fff; border: 1px solid #6b2624; padding: 5px 10px; font-weight: bold; cursor: pointer;">Очистить архив</button>
                    <button id="history-btn-copy-all" style="background: #5b3511; color: #fff; border: 1px solid #3c2007; padding: 5px 10px; font-weight: bold; cursor: pointer;">Копировать все коорд.</button>
                    <span id="history-count" style="font-size: 11px; font-weight: bold;">Сохранено записей: 0</span>
                </div>
                <div style="flex: 1; overflow-y: auto; background: #fff; padding: 5px;">
                    <table id="history-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background: #e8d3a2; border-bottom: 1px solid #7d510f; text-align: left;">
                                <th style="padding: 6px; border: 1px solid #ddd; width: 120px;">Дата / Время</th>
                                <th style="padding: 6px; border: 1px solid #ddd;">Координаты (строкой)</th>
                                <th style="padding: 6px; border: 1px solid #ddd; width: 140px; text-align: center;">Действия</th>
                            </tr>
                        </thead>
                        <tbody id="history-tbody">
                            <tr><td colspan="3" style="text-align: center; color: #777; padding: 20px;">Архив пуст. Отфильтруйте и нажмите "Копировать" на сканере.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        $('body').append(html);

        if (typeof $.fn.draggable !== 'undefined') {
            $('#custom-map-scanner').draggable({ handle: '#scanner-header' });
        }

        $('#tab-btn-scanner').on('click', function() {
            $('#tab-content-scanner').show();
            $('#tab-content-history').hide();
            $(this).css({ 'background': '#f4e4bc', 'color': '#000' });
            $('#tab-btn-history').css({ 'background': '#dcc293', 'color': '#555' });
        });

        $('#tab-btn-history').on('click', function() {
            $('#tab-content-scanner').hide();
            $('#tab-content-history').show();
            $(this).css({ 'background': '#f4e4bc', 'color': '#000' });
            $('#tab-btn-scanner').css({ 'background': '#dcc293', 'color': '#555' });
            renderHistoryTable();
        });

        function updateHistoryBadge() {
            $('#history-badge').text(window._mapScannerSavedHistory.length);
        }
        updateHistoryBadge();

        function scanVisibleScreen() {
            window._mapScannerData = [];
            let tempMap = {};

            if (typeof TWMap !== 'undefined' && TWMap.villages && TWMap.map) {
                let mapContainer = $('#map_container, #map');
                let w = mapContainer.width() || 750;
                let h = mapContainer.height() || 500;

                let centerX_px = TWMap.map.pos[0] + w / 2;
                let centerY_px = TWMap.map.pos[1] + h / 2;

                let centerCoord = null;
                if (typeof TWMap.map.coordByPixel === 'function') {
                    centerCoord = TWMap.map.coordByPixel(centerX_px, centerY_px);
                }

                if (!centerCoord) {
                    let keys = Object.keys(TWMap.villages);
                    if (keys.length > 0) {
                        let sampleKey = keys[0];
                        let cx = parseInt(sampleKey.substring(0, 3));
                        let cy = parseInt(sampleKey.substring(3));
                        centerCoord = [cx, cy];
                    } else {
                        return;
                    }
                }

                let centerX = parseInt(centerCoord[0]);
                let centerY = parseInt(centerCoord[1]);

                let radiusChoice = parseInt($('#scanner-size-select').val()) || 3;
                let halfR = Math.floor(radiusChoice / 2);

                let startX = centerX - halfR;
                let endX = centerX + halfR;
                let startY = centerY - halfR;
                let endY = centerY + halfR;

                for (let x = startX; x <= endX; x++) {
                    for (let y = startY; y <= endY; y++) {
                        let xyKey = '' + x + (y < 100 ? (y < 10 ? '00' + y : '0' + y) : y);
                        let v = TWMap.villages[xyKey];

                        if (!v) {
                            let altKey = x + '' + y;
                            v = TWMap.villages[altKey];
                        }

                        if (v) {
                            let coords = x + '|' + y;
                            if (!tempMap[coords]) {
                                tempMap[coords] = true;

                                let kNum = '' + Math.floor(y / 100) + Math.floor(x / 100);
                                let playerName = 'Барбарка / Без игрока';
                                let allyName = '-';

                                if (v.owner && typeof TWMap.players !== 'undefined' && TWMap.players[v.owner]) {
                                    playerName = TWMap.players[v.owner].name || 'Без игрока';
                                    let allyId = TWMap.players[v.owner].ally;
                                    if (allyId && typeof TWMap.allies !== 'undefined' && TWMap.allies[allyId]) {
                                        allyName = TWMap.allies[allyId].name || '-';
                                    }
                                } else if (v.playerName) {
                                    playerName = v.playerName;
                                    if (v.ally && typeof TWMap.allies !== 'undefined' && TWMap.allies[v.ally]) {
                                        allyName = TWMap.allies[v.ally].name || '-';
                                    }
                                }

                                window._mapScannerData.push({ coords: coords, k: kNum, player: playerName, ally: allyName });
                            }
                        }
                    }
                }
            }

            applyFiltersAndRender();
            updateFiltersDropdowns(window._mapScannerData);
        }

        $('#scanner-btn-update').off('click').on('click', function() {
            scanVisibleScreen();
            $('#filter-player').val('');
            $('#filter-ally').val('');
            $('#filter-k').val('');
            applyFiltersAndRender();
            if (typeof UI !== 'undefined' && UI.InfoMessage) {
                UI.InfoMessage('Область отсканирована!', 2000, 'success');
            }
        });

        $('#scanner-btn-clear').off('click').on('click', function() {
            window._mapScannerData = [];
            window._mapCurrentFiltered = [];
            delete window._mapScannerData;
            delete window._mapCurrentFiltered;
            $('#custom-map-scanner').remove();
            launchMapScanner();
        });

        function applyFiltersAndRender() {
            let selectedPlayer = $('#filter-player').val();
            let selectedAlly = $('#filter-ally').val();
            let selectedK = $('#filter-k').val();

            if (!window._mapScannerData) window._mapScannerData = [];

            window._mapCurrentFiltered = window._mapScannerData.filter(item => {
                let matchPlayer = !selectedPlayer || item.player === selectedPlayer;
                let matchAlly = !selectedAlly || item.ally === selectedAlly;
                let matchK = !selectedK || item.k === selectedK;
                return matchPlayer && matchAlly && matchK;
            });

            updateTable(window._mapCurrentFiltered);
            $('#scanner-count').text('Показано: ' + window._mapCurrentFiltered.length + ' из ' + window._mapScannerData.length);
        }

        function updateTable(data) {
            let tbody = $('#scanner-tbody');
            tbody.empty();

            if (!data || data.length === 0) {
                tbody.append('<tr><td colspan="4" style="text-align: center; color: #777; padding: 20px;">Список пуст. Нажмите "Сканировать".</td></tr>');
                return;
            }

            let rowsHtml = [];
            for (let i = 0; i < data.length; i++) {
                let item = data[i];
                rowsHtml.push(
                    '<tr style="border-bottom: 1px solid #eee;">' +
                        '<td style="padding: 4px; border: 1px solid #eee; font-weight: bold;">' + item.coords + '</td>' +
                        '<td style="padding: 4px; border: 1px solid #eee; color: #5b3511; font-weight: bold;">K' + item.k + '</td>' +
                        '<td style="padding: 4px; border: 1px solid #eee;">' + item.player + '</td>' +
                        '<td style="padding: 4px; border: 1px solid #eee;">' + item.ally + '</td>' +
                    '</tr>'
                );
            }
            tbody.html(rowsHtml.join(''));
        }

        function updateFiltersDropdowns(data) {
            if (!data || data.length === 0) return;
            let players = [...new Set(data.map(item => item.player))].sort();
            let allies = [...new Set(data.map(item => item.ally))].sort();
            let ks = [...new Set(data.map(item => item.k))].sort();

            let playerSelect = $('#filter-player');
            let allySelect = $('#filter-ally');
            let kSelect = $('#filter-k');

            let pHtml = ['<option value="">Все игроки</option>'];
            players.forEach(p => pHtml.push('<option value="' + p + '">' + p + '</option>'));
            playerSelect.html(pHtml.join(''));

            let aHtml = ['<option value="">Все племена</option>'];
            allies.forEach(a => aHtml.push('<option value="' + a + '">' + a + '</option>'));
            allySelect.html(aHtml.join(''));

            let kHtml = ['<option value="">Все квад.</option>'];
            ks.forEach(k => kHtml.push('<option value="' + k + '">K' + k + '</option>'));
            kSelect.html(kHtml.join(''));
        }

        $('#filter-player, #filter-ally, #filter-k').off('change').on('change', function() {
            applyFiltersAndRender();
        });

        $('#scanner-copy').off('click').on('click', function() {
            let targetList = window._mapCurrentFiltered && window._mapCurrentFiltered.length > 0 ? window._mapCurrentFiltered : window._mapScannerData;
            
            if (!targetList || targetList.length === 0) {
                alert('Нечего копировать! Список пуст.');
                return;
            }

            let textToCopy = targetList.map(item => item.coords).join(' ');
            
            let now = new Date();
            let timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            
            window._mapScannerSavedHistory.unshift({ 
                time: timeStr, 
                text: textToCopy, 
                items: JSON.parse(JSON.stringify(targetList)) 
            });
            
            try {
                localStorage.setItem('_tw_scanner_history', JSON.stringify(window._mapScannerSavedHistory));
            } catch(e) {}

            updateHistoryBadge();

            try {
                navigator.clipboard.writeText(textToCopy).then(function() {
                    if (typeof UI !== 'undefined' && UI.InfoMessage) {
                        UI.InfoMessage('Отфильтрованные данные скопированы и сохранены в архив!', 3000, 'success');
                    } else {
                        alert('Скопировано и сохранено в архив!');
                    }
                }).catch(function(err) {
                    fallbackCopyTextToClipboard(textToCopy);
                });
            } catch (e) {
                fallbackCopyTextToClipboard(textToCopy);
            }
        });

        function fallbackCopyTextToClipboard(text) {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                if (typeof UI !== 'undefined' && UI.InfoMessage) {
                    UI.InfoMessage('Отфильтрованные данные скопированы и сохранены в архив!', 3000, 'success');
                } else {
                    alert('Скопировано и сохранено в архив!');
                }
            } catch (err) {
                alert('Не удалось скопировать.');
            }
            document.body.removeChild(textArea);
        }

        function renderHistoryTable() {
            let tbody = $('#history-tbody');
            tbody.empty();
            let history = window._mapScannerSavedHistory;

            $('#history-count').text('Сохранено записей: ' + history.length);

            if (!history || history.length === 0) {
                tbody.append('<tr><td colspan="3" style="text-align: center; color: #777; padding: 20px;">Архив пуст. Отфильтруйте и нажмите "Копировать" на сканере.</td></tr>');
                return;
            }

            let rows = [];
            for (let i = 0; i < history.length; i++) {
                let item = history[i];
                let tableId = 'history-subtable-' + i;
                
                rows.push(
                    '<tr style="border-bottom: 1px solid #ccc; background: #faf4e2;" data-index="' + i + '">' +
                        '<td style="padding: 6px; border: 1px solid #ddd; color: #555; white-space: nowrap; vertical-align: top;">' + item.time + '</td>' +
                        '<td style="padding: 6px; border: 1px solid #ddd; word-break: break-all; font-family: monospace; vertical-align: top;">' + item.text + '</td>' +
                        '<td style="padding: 6px; border: 1px solid #ddd; text-align: center; vertical-align: top;">' +
                            '<div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">' +
                                '<button class="history-item-copy" data-text="' + encodeURIComponent(item.text) + '" style="background: #5b3511; color: #fff; border: none; padding: 3px 6px; cursor: pointer; font-size: 10px; border-radius: 2px;">Коп.</button>' +
                                '<button class="history-item-toggle" data-target="' + tableId + '" style="background: #7d510f; color: #fff; border: none; padding: 3px 6px; cursor: pointer; font-size: 10px; border-radius: 2px;">Таблица</button>' +
                            '</div>' +
                        '</td>' +
                    '</tr>'
                );

                if (item.items && item.items.length > 0) {
                    let subRows = [];
                    for (let j = 0; j < item.items.length; j++) {
                        let sub = item.items[j];
                        subRows.push(
                            '<tr style="border-bottom: 1px solid #eee;">' +
                                '<td style="padding: 3px 6px; border: 1px solid #ddd; font-weight: bold;">' + sub.coords + '</td>' +
                                '<td style="padding: 3px 6px; border: 1px solid #ddd; color: #5b3511;">K' + sub.k + '</td>' +
                                '<td style="padding: 3px 6px; border: 1px solid #ddd;">' + sub.player + '</td>' +
                                '<td style="padding: 3px 6px; border: 1px solid #ddd;">' + sub.ally + '</td>' +
                            '</tr>'
                        );
                    }

                    // Добавлен контейнер со скроллом (max-height: 250px; overflow-y: auto) и фиксацией шапки (position: sticky)
                    rows.push(
                        '<tr id="' + tableId + '" style="display: none; background: #fff;">' +
                            '<td colspan="3" style="padding: 8px; border: 1px solid #ddd;">' +
                                '<div style="font-weight: bold; margin-bottom: 4px; color: #7d510f; font-size: 10px;">Табличный вид (сохраненный срез):</div>' +
                                '<div style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd;">' +
                                    '<table style="width: 100%; border-collapse: collapse; font-size: 11px;">' +
                                        '<thead>' +
                                            '<tr style="background: #e8d3a2; border-bottom: 1px solid #7d510f; text-align: left; position: sticky; top: 0; z-index: 2;">' +
                                                '<th style="padding: 4px; border: 1px solid #ddd; background: #e8d3a2;">Координаты</th>' +
                                                '<th style="padding: 4px; border: 1px solid #ddd; background: #e8d3a2;">Квадрат</th>' +
                                                '<th style="padding: 4px; border: 1px solid #ddd; background: #e8d3a2;">Игрок</th>' +
                                                '<th style="padding: 4px; border: 1px solid #ddd; background: #e8d3a2;">Племя</th>' +
                                            '</tr>' +
                                        '</thead>' +
                                        '<tbody>' + subRows.join('') + '</tbody>' +
                                    '</table>' +
                                '</div>' +
                            '</td>' +
                        '</tr>'
                    );
                } else {
                    rows.push(
                        '<tr id="' + tableId + '" style="display: none; background: #fff;">' +
                            '<td colspan="3" style="padding: 8px; border: 1px solid #ddd; color: #777; text-align: center;">' +
                                'Для этой старой записи табличные данные отсутствуют. Сделайте новое копирование.' +
                            '</td>' +
                        '</tr>'
                    );
                }
            }
            tbody.html(rows.join(''));
        }

        $('#history-table').off('click', '.history-item-copy').on('click', '.history-item-copy', function() {
            let txt = decodeURIComponent($(this).attr('data-text'));
            navigator.clipboard.writeText(txt).then(function() {
                if (typeof UI !== 'undefined' && UI.InfoMessage) {
                    UI.InfoMessage('Координаты скопированы!', 2000, 'success');
                } else {
                    alert('Скопировано!');
                }
            });
        });

        $('#history-table').off('click', '.history-item-toggle').on('click', '.history-item-toggle', function() {
            let targetId = '#' + $(this).attr('data-target');
            $(targetId).toggle();
        });

        $('#history-btn-copy-all').off('click').on('click', function() {
            if (!window._mapScannerSavedHistory || window._mapScannerSavedHistory.length === 0) {
                alert('Архив пуст!');
                return;
            }
            let allText = window._mapScannerSavedHistory.map(h => h.text).join(' ');
            navigator.clipboard.writeText(allText).then(function() {
                if (typeof UI !== 'undefined' && UI.InfoMessage) {
                    UI.InfoMessage('Все координаты архива скопированы!', 3000, 'success');
                } else {
                    alert('Все координаты архива скопированы!');
                }
            });
        });

        $('#history-btn-clear').off('click').on('click', function() {
            if (confirm('Очистить весь архив сохраненных данных?')) {
                window._mapScannerSavedHistory = [];
                try {
                    localStorage.removeItem('_tw_scanner_history');
                } catch(e) {}
                updateHistoryBadge();
                renderHistoryTable();
                if (typeof UI !== 'undefined' && UI.InfoMessage) {
                    UI.InfoMessage('Архив очищен!', 2000, 'info');
                }
            }
        });

        $('#scanner-close').off('click').on('click', function() {
            $('#custom-map-scanner').remove();
        });
    }

    launchMapScanner();
})();
