const readline = require('readline');
const fs = require('fs');

const UNCONNECTED = /Could not connect ([A-Z]?[a-z]?\d{4}) at \((\d+\.\d+), (\d+\.\d+)/
const CONNECTED = /Connected <HSL:(\d*) lat,lng=(\d+\.\d+),(\d+\.\d+)> \(([A-Z]?[a-z]?\d{4})\) at \(\d+\.\d+, \d+\.\d+, NaN\) to (.*) at \((\d+\.\d+), (\d+\.\d+)/

const connectedStream = fs.createWriteStream("connected.csv");
const unconnectedStream = fs.createWriteStream("unconnected.csv");
connectedStream.write("stopId,jore_lat,jore_lon,stop_code,osm_node,osm_lon,osm_lat\n")
unconnectedStream.write("stop_code,jore_lon,jore_lat\n")

const rl = readline.createInterface({
  input: fs.createReadStream(process.argv[2])
});

rl.on('line', (line) => {
  let res = UNCONNECTED.exec(line)
  if (res != null) {
    unconnectedStream.write(res.slice(1).join(",") + "\n")
    return
  }
  res = CONNECTED.exec(line)
  if (res != null) {
    connectedStream.write(res.slice(1).join(",") + "\n")
    return
  }
});

rl.on('close', () => {
  unconnectedStream.end()
  connectedStream.end()
})
