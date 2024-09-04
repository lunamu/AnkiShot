chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToAnki",
    title: "Save to Anki",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToAnki") {
    chrome.tabs.sendMessage(tab.id, {action: "getSelection"});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveCard") {
    saveCardToAnki(request.card);
  }
});

function saveCardToAnki(card) {
  chrome.storage.sync.get(['deck', 'model', 'apiKey'], function(settings) {
    console.log("当前设置:", settings);
    console.log("当前牌组:", settings.deck);
    console.log("当前笔记类型:", settings.model);
    console.log("当前卡片:", card);
    console.log("当前API密钥:", settings.apiKey);

    const deckName = settings.deck || "默认";
    const modelName = settings.model || "基础";
    console.log("deckName:", deckName);
    console.log("modelName:", modelName);
    const requestBody = {
      "action": "addNote",
      "version": 6,
      "params": {
        "note": {
          "deckName": deckName,
          "modelName": modelName,
          "fields": {
            "Front": card.front,
            "Back": card.back
          },
          "options": {
            "allowDuplicate": true
          },
          "tags": ["chrome-extension"]
        }
      }
    };

    console.log("发送到AnkiConnect的请求体:", JSON.stringify(requestBody, null, 2));

    fetch('http://localhost:8765', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log("收到响应，状态码:", response.status);
        console.log("响应头:", JSON.stringify(Array.from(response.headers.entries())));
        return response.text().then(text => {
          console.log("原始响应体:", text);
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("解析JSON失败:", e);
            return null;
          }
        });
      })
    .then(data => {
      if (data.error) {
        console.error('保存卡片失败:', data.error);
        // 这里可以添加错误通知逻辑
      } else {
        console.log('卡片保存成功:', data.result);
        // 这里可以添加成功通知逻辑
      }
    })
    .catch(error => {
      console.error('调用AnkiConnect失败:', error);
      // 这里可以添加错误通知逻辑
    });
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "LOG") {
      console.log("来自 content.js 的日志:", message.message);
    }
  });