import axios from 'axios';
import https from 'https';
import Headless from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import log4js from "log4js";
import request from "request";
import fs from 'fs';
import async from 'async';

import userAgent from "user-agents";
import aCaptcha from "@antiadmin/anticaptchaofficial";

aCaptcha.setAPIKey('3de82f4c8f796c0999609da3197f5084');
aCaptcha.setSoftId(0);

const logger = log4js.getLogger();
logger.level = 'debug';

function Random(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}

Headless.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: '8a20e630e686a22e0dd66653acca8f3d'
        },
        visualFeedback: true
    })
);

Headless.use(StealthPlugin());

const delay = ms => new Promise(res => setTimeout(res, ms));

const initGrabber = async () => {
    let browser = await Headless.launch({
        headless: false,
        ignoreHTTPErrors: true,
        args: [
            `--no-sandbox`,
            `--ignore-certificate-errors`,
            `--no-zygote`,
            `--dicleasable-features=site-per-process`,
            `--single-process`,
            `--proxy-server=gateway.proxy4g.fr:8089`
        ]
    });
    try {
            let tab = (await browser.pages())[0];
            await tab.setUserAgent(userAgent.toString());
        try {

            await tab.authenticate({
                 username: 'nacc',
                 password: 'botvote'
            });
        } catch (error) { } finally {

                    try {
                        await tab.goto(`https://www.rpg-paradize.com/?page=vote&vote=114196`, {
                            waitUntil: 'networkidle0'
                        });
                    } catch (error) { } finally {
                        let ReSolver = await ReCaptchaSolver(tab);

                        if (ReSolver === true) {
                            await tab.click('#postbut');
                            await delay(5048);
                            logger.info('Vote validé !');
                        }
                    }
         }


    } catch (error) {
        logger.warn(error);
    } finally {
        await browser.close();
        await request.get('http://gateway.proxy4g.fr:8080/resetIp?id=YTRDU17309000688');

        initGrabber();
    }
};

async function ReCaptchaSolver(page) {
    try {
        /** Searching ReCaptcha */
        let frames = await page.frames();
        let recaptchaFrame = await frames.find(frame => frame.url().includes('api2/anchor'));

        if(recaptchaFrame !== undefined) {
            logger.debug('Creating new Task ...');

            /*  await page.solveRecaptchas();
            return true;*/

            let RecaptchaSelector = await recaptchaFrame.waitForSelector('.recaptcha-checkbox-border');

                if(RecaptchaSelector !== undefined) {
                    await RecaptchaSelector.click();

                    await delay(2048);

                    frames = await page.frames();
                    recaptchaFrame = await frames.find(frame => frame.url().includes('api2/bframe'));

                    const RecaptchaAudioButton = await recaptchaFrame.waitForSelector('#recaptcha-audio-button');

                    await RecaptchaAudioButton.click();

                    frames = await page.frames();
                    recaptchaFrame = await frames.find(frame => frame.url().includes('api2/bframe'));

                    await delay(2048);

                    logger.fatal('ReCaptcha audio Founded.');

                    /*while(true) {*/

                        const audioLink = await recaptchaFrame.$$eval(
                            '#audio-source',
                            pElements => pElements.map(el => el.src)
                        );


                        const audioBytes = await recaptchaFrame.evaluate(audioLink => {
                            return (async () => {
                                const response = await window.fetch(audioLink);
                                const buffer = await response.arrayBuffer();
                                return Array.from(new Uint8Array(buffer));
                            })();
                        }, audioLink);

                        const httsAgent = new https.Agent({ rejectUnauthorized: false });
                        const response = await axios({
                            httsAgent,
                            method: 'POST',
                            url: 'https://api.wit.ai/speech?v=2021092',
                            data: new Uint8Array(audioBytes).buffer,
                            headers: {
                                Authorization: 'Bearer JVHWCNWJLWLGN6MFALYLHAPKUFHMNTAC',
                                'Content-Type': 'audio/mpeg3',
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        });

                        let audioTranscript = null;
                        try {
                            audioTranscript = response.data.match('"text": "(.*)",')[1].trim();
                            logger.fatal('ReCaptcha audio response received.');
                        } catch (e) {/*
                            const reloadButton = await recaptchaFrame.$('#recaptcha-reload-button')
                            await reloadButton.click({ delay: Random(30, 150) });*/
                            logger.warn('ReCaptcha audio response not received.');/*
                            continue;*/
                        }


                    if (audioTranscript !== null) {

                        const frames = await page.frames();
                        const imageFrame = frames.find(frame => frame.url().includes('api2/bframe'));

                        const input = await imageFrame.$('#audio-response');
                        await input.click();
                        await delay(1024);

                        await input.type(audioTranscript, { delay: Random(30, 75) });
                        await delay(1024);

                        logger.fatal(`Setting ReCaptcha response : ${audioTranscript}`);

                        const verifyButton = await imageFrame.$('#recaptcha-verify-button');
                        await verifyButton.click();

                          try {
/*                            await page.waitForFunction(() => {
                              const iframe = document.querySelector('iframe[src*="api2/anchor"]')
                              if (!iframe) return false

                              return !!iframe.contentWindow.document.querySelector('#recaptcha-anchor[aria-checked="true"]')
                            }, { timeout: 5000 })

                            return page.evaluate(() => document.getElementById('g-recaptcha-response').value)*/
                          } catch (e) {
                            /*const reloadButton = await imageFrame.$('#recaptcha-reload-button');
                            await reloadButton.click({ delay: Random(30, 150) });
                            continue;*/
                          }
                        

                    }
                    /*break;
                }*/
                        return true;
                        
                }
                
            }
    } catch (e) {
        logger.warn(e);
        return false;
    }
}

function findAll(regexPattern, sourceString) {
    let output = []
    let match
    // auto-add global flag while keeping others as-is
    let regexPatternWithGlobal = RegExp(regexPattern,[...new Set("g"+regexPattern.flags)].join(""))
    while (match = regexPatternWithGlobal.exec(sourceString)) {
        // get rid of the string copy
        delete match.input
        // store the match data
        output.push(match)
    } 
    return output
}
 
initGrabber()