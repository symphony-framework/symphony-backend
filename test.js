require('dotenv').config();

const AWS = require('aws-sdk');
const region = process.env.REGION || 'us-east-1';

// get cache cluster nodes for the replication group
const getCacheClusters = async () => {
  const elasticache = new AWS.ElastiCache({region});

  const replicationGroupId = process.env.REDIS_REPLICATION_GROUP_ID;
  
  if (!replicationGroupId) {
    console.log("no replication group id");
    return [];
  }

  console.log({replicationGroupId});

  const params = {
    ShowCacheNodeInfo: true,
  };

  try {
    const result = await elasticache.describeCacheClusters(params).promise();
    console.log({cachesClusters: result.CacheClusters});
    const clusters = result.CacheClusters.filter(cacheCluster => cacheCluster.ReplicationGroupId === replicationGroupId);
    return clusters;
  } catch (error) {
    console.error('Error fetching cache clusters:', error);
    return [];
  }
};

const getEndpoints = async () => {
  const primaryNodes = [];
  const readerNodes = [];

  const cacheClusters = await getCacheClusters();

  cacheClusters.forEach((cluster) => {
    cluster.CacheNodes.forEach((node) => {
      const {Address: host, Port: port} = node.Endpoint;
      const id = host.split("-")[2];
      const isPrimary = id.startsWith("001");

      const nodeInfo = {host, port};

      if (isPrimary) {
        primaryNodes.push(nodeInfo);
      } else {
        readerNodes.push(nodeInfo);
      }
    });
  });

  return {primaryNodes, readerNodes}; 
}

module.exports = getEndpoints;