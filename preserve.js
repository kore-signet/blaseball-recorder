//ffmpeg -ss 0 -i out.m3u8 -c:v copy out.mkv
const { Converter } = require("ffmpeg-stream")
const path = require("path")

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const converter = new Converter()
  const converterInput = converter.createInputFromFile('./blaseball.m3u8',{
    f: "hls",
    ss: 0,
    t: process.argv[2]
  })
  const converterOut = converter.createOutputToFile(path.join('./archives/',new Date().toISOString() + '.mkv'),{
    f: "matroska",
    vcodec: "libx264"
  })
  console.log("RUNNING")
  await converter.run()
  await converter.kill()
  console.log("IT IS SETTLED")
})()
