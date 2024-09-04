// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const deckSelect = document.getElementById('deck');
    const modelSelect = document.getElementById('model');
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save-settings');

    // 加载保存的设置
    chrome.storage.sync.get(['deck', 'model', 'apiKey'], function(result) {
        if (result.deck) deckSelect.value = result.deck;
        if (result.model) modelSelect.value = result.model;
        if (result.apiKey) apiKeyInput.value = result.apiKey;
    });

    // 保存设置
    saveButton.addEventListener('click', function() {
        const settings = {
            deck: deckSelect.value,
            model: modelSelect.value,
            apiKey: apiKeyInput.value
        };

        chrome.storage.sync.set(settings, function() {
            console.log('设置已保存');
            // 可以在这里添加一个保存成功的提示
        });
    });

    // 获取Anki牌组列表
    function fetchAnkiDecks() {
        fetch('http://localhost:8765', {
            method: 'POST',
            body: JSON.stringify({
                action: "deckNames",
                version: 6
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.result) {
                data.result.forEach(deck => {
                    const option = document.createElement('option');
                    option.value = deck;
                    option.textContent = deck;
                    deckSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('获取牌组失败:', error));
    }

    // 获取Anki笔记类型列表
    function fetchAnkiModels() {
        fetch('http://localhost:8765', {
            method: 'POST',
            body: JSON.stringify({
                action: "modelNames",
                version: 6
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.result) {
                data.result.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('获取笔记类型失败:', error));
    }

    // 调用函数获取Anki数据
    fetchAnkiDecks();
    fetchAnkiModels();
});