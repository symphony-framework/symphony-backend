const snapshotDelay = process.env.SNAPSHOT_DELAY ? Number(process.env.SNAPSHOT_DELAY) : 30000;

const docs = new Map();
const dashboard = {active: false, eventsUrl:""};

const SERVER = {dashboard, docs, snapshotDelay}

module.exports = SERVER;