const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');

async function getPriceFromHtml(htmlSource, pair) {
    const dom = new JSDOM(htmlSource);
    const document = dom.window.document;

    const value = document.querySelectorAll('input[title="Token Amount"]')[1].value;

    console.log(pair + ': ' + value);

    fetch('http://127.0.0.1:5999/set', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 0,
            apiKey: '218abfa6-2ad8-4049-b055-d80c0c10e216',
            key: pair + '-' + Date.now(),
            value: value
        })
    })
}

async function getPairPrice(token1, token2) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    const url = `${'https://pancakeswap.finance/?inputCurrency='}${token1}${'&chainId=56&outputCurrency='}${token2}`;
  
    await page.goto(url, { waitUntil: 'networkidle2' });
  
    // Wait for the input field with title "Token Amount" to be available
    await page.waitForSelector('input[title="Token Amount"]'); 
  
    // Click on the input field
    const inputField = await page.$('input[title="Token Amount"]');
    await inputField.click();  // Focus the input field
  
    // Type '1' into the input field
    await page.type('input[title="Token Amount"]', '1');  // This method also focuses and types
  
    // Simulate mouse click
    await page.mouse.click(1300, 550);
  
    // Take a screenshot after 2 seconds
    setTimeout(async () => {
      const pair = [token1, token2].join('-');
      getPriceFromHtml(await page.content(), pair);
      await browser.close();
    }, 2000);
}

(async () => {
    while (true) {
        await getPairPrice('0x570A5D26f7765Ecb712C0924E4De545B89fD43dF',  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82');
    }
})();