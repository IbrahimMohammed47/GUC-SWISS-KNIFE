'use strict'
const puppeteer = require('puppeteer')
const timeout = {
    timeout: 500000,
    waitUntil: 'networkidle0',
}
const authData = require('./../data.json');

module.exports =
    async function () {
        const browser = await puppeteer.launch({ headless: false }); // default is true
        const page = await browser.newPage();

        await page.authenticate(authData);

        await navigate_entity(page, 'https://student.guc.edu.eg/External/Student/Staff/EvaluateStaff.aspx');
        await evaluate_entity(page, '#stfIdLst', 'https://student.guc.edu.eg/External/Student/Staff/EvaluateStaff.aspx');

        await navigate_entity(page, 'https://student.guc.edu.eg/External/Student/Course/EvaluateCourse.aspx');
        await evaluate_entity(page, '#crsIdLst', 'https://student.guc.edu.eg/External/Student/Course/EvaluateCourse.aspx');

    }

async function navigate_entity(page, url) {
    await page.goto(url, timeout);
}

async function evaluate_entity(page, selector_name, url) {
    const option_values = await page.evaluate((selector_name) => {
        let values = [];
        document.querySelectorAll(`${selector_name} option`).forEach(node => {
            if (node.value) values.push(node.value);
        })
        return values;
    }, selector_name)
    for (let i = 0; i < option_values.length; i++) {
        await navigate_entity(page, url);
        await page.select(selector_name, option_values[i]);
        await fill_entity_form(page);
    }

}

async function fill_entity_form(page) {
    await page.waitForSelector('#msgLbl');
    let evaluated = await page.evaluate(() => document.querySelector('#msgLbl').innerText);
    if (evaluated.length > 0) return

    await page.evaluate(() => {
        document.querySelectorAll("input[value='1']").forEach(input => {
            input.click();
        });
    });

    await Promise.all([
        page.evaluate(() => { document.querySelector("input[name='pstEvalBtn']").click(); }),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await page.screenshot({ path: `proof_${Math.random()}.png` });
}


