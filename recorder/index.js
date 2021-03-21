require('dotenv').config()
const puppeteer = require('puppeteer')
const { Converter } = require("ffmpeg-stream")
const fs = require('fs')
const process = require('process')

const pino = require('pino')

const logger = pino({
    prettyPrint: Boolean(Number(process.env.PRETTY_LOGS)) || false,
    level: process.env.LOG_LEVEL || 'info'
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


(async () => {
  process.on('unhandledRejection', pino.final(logger, (err, finalLogger) => {
    finalLogger.error(err, 'unhandledRejection')
    process.exit(1)
  }))

  process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
    finalLogger.error(err, 'uncaughtException')
    process.exit(1)
  }))

  const browser = await puppeteer.launch({
    headless: (process.env.HEADLESS == undefined) ? true : Boolean(Number(process.env.HEADLESS)),
    args: ['--disable-dev-shm-usage','--use-gl=swiftshader','--disable-software-rasterizer']
  })
  const page = await browser.newPage()
  logger.info('Launched browser instance..')

  // set window to 1920x1080
  page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor:1
  })

  // set session cookie
  logger.debug('Adding authentication info to browser session')
  page.setCookie(...[{
    "name": "connect.sid",
    "value": process.env.BLASEBALL_SESSION,
    "domain": "www.blaseball.com"
  }])

  // blaseball time
  await page.goto('https://www.blaseball.com/')

  await page.waitForSelector("a.Navigation-Button:nth-child(2)")
  // go to league page
  logger.debug('Navigating to the league page')
  const [league] = await page.$x("//a[@class='Navigation-Button' and @href='/league']")
  if (league) {
    await league.click()
  }
//  add css inserts
  logger.debug('Adding css inserts')
  await page.addStyleTag({path:'./css/bigscreen.css'})
  await page.addStyleTag({path:'./css/compact.css'})

  await page.waitForSelector(".Main-Body")
  // scroll until every game is in view
  logger.debug('Scrolling games into view')
  try {
    await page.$eval('.GameWidget:last-of-type', e => {
      e.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
    })
  } catch (e) {
    try {

      await page.$eval('div.PlayoffSetup-MatchupGroup:last-child', e => {
        e.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
      })
    } catch (e) {
      
    }
  }

  const converter = new Converter()

  // create JPEG input stream
  const converterInput = converter.createInputStream({
    f: "image2pipe",
    vcodec: "mjpeg",
  })

  // start screencast from chrome
  logger.info('Starting screencast')
  const session = await page.target().createCDPSession();
  await session.send('Page.startScreencast', {
    format: 'jpeg',
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1
  })
  // listen to chrome screencast events
  session.on('Page.screencastFrame', ({data,sessionId}) => {
    logger.debug('Received frame')
    let buff = Buffer.from(data, 'base64');
    converterInput.write(buff)
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  })

  // create output stream
  logger.debug('Creating output stream')
  converter.createOutputToFile('/stream/blaseball.m3u8', {
    f: "hls",
    hls_time: 10,
    hls_list_size: 40,
    hls_flags: ["delete_segments"]
  })

  // run converter
  logger.info('Started recording')
  await converter.run()
})()
