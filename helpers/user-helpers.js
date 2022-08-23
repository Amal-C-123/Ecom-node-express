var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
require("dotenv").config();
const RazorPay = require("razorpay");

var instance = new RazorPay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

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

  // isExist: (isUser) => {
  //   var user = { ...isUser.user };
  //   async function nameGetter(user) {
  //     let email = await db
  //       .get()
  //       .collection(collection.USER_COLLECTION)
  //       .findOne({ Email: user.Email });
  //     let userEmail = { ...email };
  //     if (userEmail.Email !== user.Email) {
  //       isUser.destroy();
  //     }
  //   }
  //   nameGetter(user);
  // },

  numberExist: (number) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Phone: number });
      if (user == null) {
        console.log("number doesnot exist in database");
        resolve({ userExist: false });
      } else if (user.block == true) {
        resolve({ userBlock: true });
        console.log("number is blocked");
        resolve({ status: false });
      } else {
        resolve(user);
      }
    });
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

  changeOrderStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "cancelled",
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise(async (resolve, reject) => {
      let status = order.PaymentMethod === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.PhoneNumber,
          address: order.Address,
          pincode: order.Zipcode,
          appartment: order.Apartment,
          state: order.State,
          country: order.Country,
          totalAmount: total,
        },
        userId: objectId(order.userId),
        paymentMethod: order.PaymentMethod,
        products: products,
        date: new Date().toUTCString(),
        status: status,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response);
        });
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ date: -1 })
        .toArray();
      resolve(orders);
    });
  },

  generateRazorPay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      instance.orders.create(
        {
          amount: total * 100,
          currency: "INR",
          receipt: orderId,
          notes: {
            key1: "value3",
            key2: "value2",
          },
        },
        (err, order) => {
          if (err) {
            console.log(err);
          } else {
            resolve(order);
          }
        }
      );
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: objectId(orderId),
          },
          {
            $set: { status: "placed" },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
};
