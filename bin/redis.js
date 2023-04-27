require('dotenv').config();

const getCacheNodeEndpoints = require("./aws_utils/getCacheNodeEndpoints.js");

const { createCluster } = require('redis');

const redisCluster = {};

const initRedis = async() => {
  const { primaryNodes, readerNodes } = await getCacheNodeEndpoints();

  const rootSubNodes = readerNodes.map(connInfo => {
    return { url: `redis://${connInfo.host}:${connInfo.port}`}
  });

  const rootPubNodes = primaryNodes.map(connInfo => {
    return { url: `redis://${connInfo.host}:${connInfo.port}`};
  });

  const sub = createCluster({
    rootNodes: rootSubNodes,
  })

  const pub = createCluster({
    rootNodes: rootPubNodes,
  })

  await sub.connect();
  await pub.connect();

  redisCluster.sub = sub;
  redisCluster.pub = pub;

  // sub
  sub.on('error', function(error) {
    console.error('Sub Redis connection error:', error);
  });

  sub.on('connect', function() {
    console.log('Sub Connecting to Redis');
  });

  sub.on('ready', function() {
    console.log("Sub Connected to Redis Cluster")
  })

  sub.on('reconnecting', function() {
    console.log(`Sub Reconnecting to Redis`);
  });

  // pub
  pub.on('error', function(error) {
    console.error('Pub Redis connection error:', error);
  });

  pub.on('connect', function() {
    console.log('Pub Connecting to Redis');
  });

  pub.on('reconnecting', function() {
    console.log(`Pub Reconnecting to Redis`);
  });

  pub.on('ready', function() {
    console.log("Pub Connected to Redis Cluster")
  })
};

redisCluster.initRedis = initRedis;

module.exports = redisCluster;

