const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const moment = require('moment');
const {
    STATE_DONE,
    STATE_ERROR,
} = require('./models');
const LOGGING = true;
const ENV     = 'prod';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function saveCookies(page)
{
    const cookies = await page.cookies();
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
}

async function loadCookies(page)
{
    if (fsSync.existsSync('./cookies.json')) {
        const cookiesString = await fs.readFile('./cookies.json');
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
    }
}

async function setupPage(browser)
{
    const page = await browser.newPage()
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1200, height: 1030 })
    await loadCookies(page);
    return page;
}

// LOGIN & COOKIES SETUP
async function warmup(sec)
{
    const browser = await puppeteer.launch({
        headless: false,
    })
    let url = 'https://ozon.ru'
    const page = await setupPage(browser)
    await page.goto(url)
    await sleep(sec * 1000)
    await saveCookies(page)
    await browser.close()
}
exports.warmup = warmup;


/**
 * @param saleTask
 * @returns {Promise<boolean>}
 *
 * начало             08:16:09
 * добавлен в корзину 08:21:59 9 + 20 = 29
 * заказ     оформлен 08:22:26
 */
async function process(saleTask)
{
    if (LOGGING) {
        console.log(moment().format());
    }
    const AT_SALE = moment(saleTask.at).add(2, 'seconds');
    const AT_CART = moment(saleTask.atCart);
    const browser = await puppeteer.launch({headless: false})
    const page = await setupPage(browser)
    await page.goto(saleTask.entry)
    // ожидаем срок занесения товара в корзину (по тесту за 2 минуты до начала)
    while (AT_CART.diff(moment()) > 0) {
        if (LOGGING) {
            console.log("AT_CART", (AT_CART.diff(moment()) / 1000));
        }
        await sleep(500);
    }
    if (LOGGING) {
        console.log("Добавляем товар в корзину", moment().format())
    }
    await page.waitForFunction(
        'document.querySelector("body").innerText.includes("В корзину")'
    );
    var btns = [];
    btns = await page.$x("//div[@data-widget='webAddToCart']//button")
    switch (btns.length) {
        case 0: {
            console.error("no button found");
            break;
        }
        case 1: {
            await btns[0].click()
            break;
        }
        case 2: {
            await btns[1].click()
            break;
        }
    }
    await sleep(1000);
    // добавили товар в корзину, теперь идем в корзину
    await page.goto("https://www.ozon.ru/cart")
    await sleep(1000);
    //     // ожидаем даты начала распродажи (по тесту за 6 минут от начала)
    while (AT_SALE.diff(moment()) > 0) {
        if (LOGGING) {
            console.log("AT_ORDER", (AT_SALE.diff(moment()) / 1000));
        }
        await sleep(100);
    }
    console.log("В корзине")
    // await sleep(1000);
    await page.waitForFunction(
        'document.evaluate("//button[contains(., \'Перейти к оформлению\')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null'
    );
    await page.evaluate(() => {
        document.evaluate("//button[contains(., 'Перейти к оформлению')]",
            document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            .singleNodeValue.click();
    });
    await sleep(1000);

    await page.waitForFunction(
        'document.evaluate("//button[contains(., \'Оплатить онлайн\')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null'
    );
    await page.evaluate(() => {
        document.evaluate("//button[contains(., 'Оплатить онлайн')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click();
    });
    console.log("заказ оплачен")
    saleTask.status = STATE_DONE;
    try {
        await saleTask.save();
    } catch (err) {
        console.error(err.message);
    }
    await sleep(10000);
    await browser.close();
    return saleTask.id;
}
exports.process = process;

// (async () => {
//     await process({
//         status: STATE_QUEUE,
//         at: moment().add(45, 'second').toDate(),
//         atCart: moment().add(20, 'second').toDate(),
//         current: undefined,
//         entry: 'https://www.ozon.ru/product/smartfon-xiaomi-redmi-9a-2-32-gb-seryy-182413399/?avtc=1&avte=1&avts=1669607050&sh=5ivTRUX2KA',
//         save: async function() {
//             return true;
//         }
//     });
// })()
