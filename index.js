const puppeteer = require('puppeteer');
const fs = require('fs');
const { Converter } = require("ffmpeg-stream")

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const bigscreen = fs.readFileSync('./bigscreen.css')
  const compact = fs.readFileSync('./compact.css')

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor:1
  });
  page.setCookie(...[{
    "name": "connect.sid",
    "value": "",
    "domain": "www.blaseball.com"
  }])

  page.goto('https://www.blaseball.com/')

  await page.waitForSelector('#root > .Main > .Navigation > .Navigation-Main > .Navigation-Button:nth-child(2)')
  await page.click('#root > .Main > .Navigation > .Navigation-Main > .Navigation-Button:nth-child(2)')
  await page.addStyleTag({path:'./bigscreen.css'})
  await page.addStyleTag({path:'./compact.css'})
  await page.$eval('.Main-Body > div:nth-child(4) > ul:last-child', e => {
    e.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
  });
  const converter = new Converter()
  const converterInput = converter.createInputStream({
    f: "image2pipe",
    vcodec: "mjpeg",
  })
  console.log("please")

  const session = await page.target().createCDPSession();
  await session.send('Page.startScreencast', {
    format: 'jpeg',
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1
  });

  console.log("ok?")

  session.on('Page.screencastFrame', ({data,sessionId}) => {
    console.log('FRAME');
    let buff = new Buffer(data, 'base64');
    converterInput.write(buff)
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });

  console.log("hi");

  converter.createOutputToFile('./blaseball.m3u8', {
    f: "hls",
    hls_time: 10,
    hls_list_size: 40,
    hls_flags: ["delete_segments"]
  })

  console.log("hewwo")
  await converter.run()
})();
