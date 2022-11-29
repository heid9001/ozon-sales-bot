const puppeteer = require('puppeteer');
const moment = require('moment');
const bot    = require('./botlib');
const {
    STATE_DONE,
    STATE_ERROR,
} = require('./models');

// LOGIN & COOKIES SETUP
async function warmup(sec)
{
    const browser = await puppeteer.launch({
        headless: false,
    })
    let url = 'https://ozon.ru'
    const page = await bot.setupPage(browser)
    await page.goto(url)
    await bot.sleep(sec * 1000)
    await bot.saveCookies(page)
    await browser.close()
}
exports.warmup = warmup;


async function registerError(browser, page, saleTask, label, msg) {
    await page.screenshot({path: `./screens/${label}-${saleTask.id}-${moment().unix()}.png`});
    saleTask.status  = STATE_ERROR;
    saleTask.current = msg;
    await saleTask.save();
    console.log(msg);
    await browser.close();
}

async function logTask(saleTask, msg) {
    saleTask.current = msg;
    await saleTask.save();
}

/**
 * @param saleTask
 * @returns {Promise<boolean>}
 */
async function process(saleTask)
{
    const AT_SALE = moment(saleTask.at).add(2, 'seconds');
    const AT_CART = moment(saleTask.atCart);
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        slowMo:10,
    })
    const page = await bot.setupPage(browser)
    await page.goto(saleTask.entry)
    // ожидаем срок занесения товара в корзину (по тесту за 2 минуты до начала)
    while (AT_CART.diff(moment()) > 0) {
        await bot.sleep(500);
    }
    await logTask(saleTask,"Время добавлять в корзину");
    try {
        await page.waitForFunction(
            'document.querySelector("body").innerText.includes("В корзину")'
        );
        let btns = await page.$x("//div[@data-widget='webAddToCart']//button")
        if (btns) {
            switch (btns.length) {
                case 1: {
                    await btns[0].click()
                    break;
                }
                case 2: {
                    await btns[1].click()
                    break;
                }
            }
        }
        await bot.sleep(1000);
    } catch (err) {
        await registerError(browser, page, saleTask, 'noAddToCartBtn', "Не вижу кнопки `В корзину`");
        return false;
    }
    await logTask(saleTask,"Добавил товар в корзину");
    try {
        let [cartBtn] = await page.$x('//a[@href="/cart"]')
        if (cartBtn) {
            cartBtn.click();
        }
        await bot.sleep(1000);
    } catch (err) {
        await registerError(browser, page, saleTask, 'noCartBtn', "Не могу перейти в корзину");
        return false;
    }
    await logTask(saleTask,"Перешел в корзину");
    // ожидаем даты начала распродажи (по тесту за 6 минут от начала)
    while (AT_SALE.diff(moment()) > 0) {
        await bot.sleep(100);
    }
    await logTask(saleTask,"Время оформлять заказ");
    try {
        await bot.tryClickBtn(page,"//button[contains(., 'Перейти к оформлению')]");
    } catch (err) {
        await registerError(browser, page, saleTask, 'noOfferBtn', "Не могу оформить заказ");
        return false;
    }
    await logTask(saleTask,"Заказ оформлен");
    try {
        await bot.tryClickBtn(page,"//button[contains(., 'Оплатить онлайн')]");
    } catch (err) {
        await registerError(browser, page, saleTask, 'noBuyBtn', "Не могу оплатить заказ");
        return false;
    }
    await logTask(saleTask,"Заказ оплачен");
    try {
        saleTask.status = STATE_DONE;
        await saleTask.save();
    } catch (err) {
        console.error(err.message);
        return false;
    }
    await page.screenshot({path: `ending-${moment().unix()}.png`});
    await browser.close();
    return saleTask.id;
}
exports.process = process;
