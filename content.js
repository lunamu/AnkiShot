console.log = function(...args) {
    chrome.runtime.sendMessage({type: "LOG", message: args.join(" ")});
  };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelection") {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      // 从存储中获取API密钥
      chrome.storage.sync.get(['apiKey'], async function(result) {
        const apiKey = result.apiKey;
        if (!apiKey) {
          console.error('Gemini API密钥未设置');
          return;
        }
        try {
          const summary = await getSummaryFromGemini(selectedText, apiKey);
          // 创建Anki卡片
          const ankiCard = {
            front: summary,
            back: selectedText
          };

          // 发送卡片数据到background script
          chrome.runtime.sendMessage({action: "saveCard", card: ankiCard});
        } catch (error) {
          console.error('生成摘要失败:', error);
        }
      });
    } else {
      console.error("没有选中文本");
    }
  }
});

async function getSummaryFromGemini(text, apiKey) {
 
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const body = JSON.stringify({
    "contents": [{
      "parts": [{
        "text": `请为以下文本生成一个简短的摘要问题,以下文本可以作为该问题的答案存在：\n\n${text}`
      }]
    }]
  });
  //show content of headers, url, body, apiKey, show detail of response
  console.log("Headers:", JSON.stringify(headers, null, 2));
  console.log("Body:", JSON.stringify(JSON.parse(body), null, 2));
  
  console.log("url: ", url);
  console.log("apiKey: ", apiKey);

  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: headers,
      body: body
    });
    //is response correct? show content of response
    console.log("Response:", JSON.stringify(response, null, 2));

    const data = await response.json();
    console.log(data);
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('无法生成摘要');
    }
  } catch (error) {
    console.error('调用Gemini API失败:', error);
    return '无法生成摘要';
  }
}