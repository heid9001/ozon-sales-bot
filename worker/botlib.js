const moment = require('moment');
const fs = require('fs').promises;
const fsSync = require('fs');

function sleep (ms) {
    return new Promise(r => setTimeout(r, ms));
}
module.exports.sleep = sleep;

async function saveCookies(page)
{
    const cookies = await page.cookies();
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
} module.exports.saveCookies = saveCookies;

async function loadCookies(page)
{
    if (fsSync.existsSync('./cookies.json')) {
        const cookiesString = await fs.readFile('./cookies.json');
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
    }
} module.exports.loadCookies = loadCookies;

async function setupPage(browser)
{
    const page = await browser.newPage()
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1200, height: 1030 })
    await page.setDefaultTimeout(10000);
    await loadCookies(page);
    return page;
} module.exports.setupPage = setupPage;

async function tryClickBtn(page, xpath)
{
    await page.waitForFunction(
        `document.evaluate("${xpath}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null`
    );
    // интересный шаблон получился, нужно вынести в либу
    const memUrl = await page.evaluate(() => document.location.href);
    let curUrl = memUrl;
    let tries = 0;
    let now = moment();
    let at  = now.add('10', 'second');
    while (memUrl === curUrl) {
        if (at.diff(moment()) <= 0) {
            throw "Слишком много попыток нажать кнопку";
        }
        tries++;
        // console.log("попытка прожать оплату: ", tries);
        let [btn] = await page.$x(xpath);
        if (btn) {
            btn.click();
        }
        await sleep(1000);
        curUrl = await page.evaluate(() => document.location.href);
    }
} module.exports.tryClickBtn = tryClickBtn;
