const readline = require("readline");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const https = require("https");

const UNCONNECTED = /Could not connect ([A-Z]?[a-z]?\d{4}) at \((\d+\.\d+), (\d+\.\d+)/;
const CONNECTED = /Connected <.*:(\d*) lat,lng=(\d+\.\d+),(\d+\.\d+)> \(([A-Z]?[a-z]?\d{4})\) to (.*) at \((\d+\.\d+), (\d+\.\d+)/;

const query = `
  query Stops($stop_code: String!) {
    stops(name:$stop_code) {
      stoptimesWithoutPatterns(timeRange:86400, numberOfDepartures:1000) {
        headsign
      }
    }
  }
}`;

const agent = new https.Agent({ keepAlive: true, maxSockets: 5 });

function distance(lat1, lon1, lat2, lon2) {
  var p = Math.PI / 180;
  var a =
    0.5 -
    Math.cos((lat2 - lat1) * p) / 2 +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;

  return 12742 * 1000 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

async function match(line, connectedStream, unconnectedStream) {
  let res = UNCONNECTED.exec(line);
  if (res != null) {
    const [stop_code, jore_lon, jore_lat] = res.slice(1);
    let departures;
    try {
      const fetchData = await fetch(
        "https://api.digitransit.fi/routing/v1/routers/finland/index/graphql",
        {
          body: JSON.stringify({ query, variables: { stop_code } }),
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          method: "POST",
          agent,
        },
      );
      if (fetchData.status !== 200) {
        const text = await fetchData.text();
        console.log(text);
      } else {
        const json = await fetchData.json();
        departures = json.data.stops[0].stoptimesWithoutPatterns.length;
      }
    } catch (e) {
      console.log(e);
    }
    unconnectedStream.write([stop_code, jore_lat, jore_lon, departures].join(",") + "\n");
    return;
  }
  res = CONNECTED.exec(line);
  if (res != null) {
    const [stop_id, jore_lat, jore_lon, stop_code, osm_node, osm_lon, osm_lat] = res.slice(1);
    const dist = distance(jore_lat, jore_lon, osm_lat, osm_lon);
    connectedStream.write(
      [stop_id, stop_code, jore_lat, jore_lon, osm_node, osm_lat, osm_lon, dist].join(",") + "\n",
    );
    return;
  }
}

module.exports = function parse(directory) {
  return new Promise(resolve => {
    const promises = [];

    const connectedStream = fs.createWriteStream(path.join(directory, "connected.csv"));
    const unconnectedStream = fs.createWriteStream(path.join(directory, "unconnected.csv"));
    connectedStream.write(
      "stop_id,stop_code,jore_lat,jore_lon,osm_node,osm_lat,osm_lon,distance\n",
    );
    unconnectedStream.write("stop_code,jore_lat,jore_lon,departures\n");

    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(directory, "taggedStops.log")),
    });

    rl.on("line", line => {
      promises.push(match(line, connectedStream, unconnectedStream));
    });

    rl.on("close", () => {
      Promise.all(promises).then(resolve);
    });
  });
};
