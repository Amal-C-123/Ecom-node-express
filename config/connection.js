var MongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  // const url='mongodb://localhost:27017'
  const url = process.env.MONGO_URI;
  const dbname = process.env.DB_NAME;
  MongoClient.connect(url, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  });
};

module.exports.get = function () {
  return state.db;
};
