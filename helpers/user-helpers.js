var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");

module.exports = {
  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (email) {
        console.log("same email");
        response.status = true;
        resolve(response);
      } else {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
        console.log("user data inserted in database");
        resolve({ status: false });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });


      if (user) {
        
        if (user.block == true) {
          resolve({ userBlock: true });
        }
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login Success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },

  isExist: (isUser) => {
    var user = { ...isUser.user };
    async function nameGetter(user) {
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: user.Email });
      let userEmail = { ...email };
      if (userEmail.Email !== user.Email) {
        isUser.destroy();
      }
    }
    nameGetter(user);
  },

  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            //updating user for blocking feature
            $set: { block: true },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  unblockUser: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { block: false },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
};
