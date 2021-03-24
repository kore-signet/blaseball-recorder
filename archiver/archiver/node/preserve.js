//ffmpeg -ss 0 -i out.m3u8 -c:v copy out.mkv
const { Converter } = require("ffmpeg-stream")
const path = require("path")
const zmq = require("zeromq")

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const sock = new zmq.Pair
  sock.connect("ipc://blaseball-archiver")

  const converter = new Converter()
  const converterInput = converter.createInputFromFile('/stream/blaseball.m3u8',{
    allowed_extensions: 'mjpeg',
    ss: 0,
    live_start_index: 0,
    t: process.argv[2]
  })

  await sock.send("CREATED INPUT")

  const converterOut = converter.createOutputToFile(path.join('/archives/',new Date().toISOString() + '.mp4'),{
    vcodec: "libx264"
  })

  await sock.send("CREATED OUTPUT")

  await sock.send("RUNNING")

  let started = new Date()
  await sock.send(`STARTED:${started.getTime()}`)

  converter.run().then(async () => {
    await sock.send(`DONE:${new Date().getTime()}`)
    await sock.close()
  })

  for await (const [msg] of sock) {
    m = msg.toString()
    if (m == 'INTERRUPT') {
      await converter.kill()
      await sock.send(`DONE:${new Date().getTime()}`)
      await sock.close()
    }
  }
})()
