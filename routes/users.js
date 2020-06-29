const sha1 = require("sha1");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");

var User = require("../model/userDetails");
var Config = require("../model/configs");
const Auth = require("../middlewares/auth");
const GCS = require("../helpers/gcs");

var express = require("express");
var router = express.Router();

const getNewRCID = () => {
	return new Promise((resolve, reject) => {
		Config.findOne({}, (err, rcInfo) => {
			if(err)
				reject({ status: false, err });
			resolve({ status: true, rcid: rcInfo.RCID })
		});
	});
}

const setNewRCID = (res, newUser) => {
	Config.updateOne({},{ $inc : { RCID : 1 } }, (err, rcInfo) => {
		if(err || !rcInfo)
			return res.status(500).json({
				status: false,
				message: "RC ID update error",
				error: err || "Unknown"
			});
		return res.status(200).json({
			status: true,
			message: "Registration Successful :)",
			user: newUser
		});
	});
}

// var transporter = nodemailer.createTransport({
// 	service: 'gmail',
// 	auth: {
// 		user: process.env.SENDER_EMAIL,
// 		pass: process.env.SENDER_PASS
// 	}
// });

const uploadFile = multer({ storage: multer.memoryStorage() });

router.get('/bye',(req, res) => {
    new Config({})
			.save()
			.then(c => {
				if (c)
					return res.status(200).json({
						status: true,
						message: "Registration Successful :)",
						user: c
					});
				else
					return res.status(500).json({
						status: false,
						message: "Registration Failed! Try again..",
						error: "Unknown"
					});
			})
			.catch(err => {
				return res.status(500).json({
					status: false,
					message: "Registration Failed! Server Error..",
					error: err
				});
			});
})

//check deadline function
const checkDeadline = (req, res, next) => {
	let loadData = GCS.file("settings.txt").createReadStream();
	let text = "";
	loadData
		.on("data", data => {
			text += data;
		})
		.on("end", () => {
			let jsonData = JSON.parse(text);
			let startTime = new Date(jsonData.startTime).getTime();
			let endTime = new Date(jsonData.endTime).getTime();
			let currentTime = new Date().getTime();
			if (startTime > currentTime && !req.user.admin)
				return res.status(500).json({
					status: false,
					message: "Sorry :/ Competition has not started yet",
					err: {}
				});
			else if (endTime < currentTime && !req.user.admin)
				return res.status(500).json({
					status: false,
					message: "Sorry :/ Competition has already ended",
					err: {}
				});
			else next();
		})
		.on("error", err => {
			return res.status(500).json({
				status: false,
				message: "Image Verify Error",
				error: err
			});
		});
};

/* GET users listing. */
router.get("/", function (req, res, next) {
	res.send("respond with a resource Link incomplete!");
});

//Fetch All Emails
router.get("/fetchEmails", (req, res) => {
	User.find({}, { email: 1 }, (err, users) => {
		if (err)
			return res.status(500).json({
				status: false,
				message: "Fetching Emails Failed! Server Error..",
				error: err
			});
		return res.status(200).json({
			status: true,
			message: "Fetched successfully",
			user: users
		});
	});
});

//Fetch All Emails and Contacts
router.get("/fetchEmailsContacts", (req, res) => {
	User.find({}, { contact: 1, email: 1 }, (err, users) => {
		if (err)
			return res.status(500).json({
				status: false,
				message: "Fetching Emails Failed! Server Error..",
				error: err
			});
		return res.status(200).json({
			status: true,
			message: "Fetched successfully",
			user: users
		});
	});
});

//Register User
router.post("/register", function (req, res) {
	var userData = req.body;
	userData.password = sha1(req.body.password);
	getNewRCID().then(r => {
		userData.rcid = r.rcid;
		new User(userData)
			.save()
			.then(newUser => {
				if (newUser) {
					setNewRCID(res, newUser);
				}
				else
					return res.status(500).json({
						status: false,
						message: "Registration Failed! Try again..",
						error: "Unknown"
					});
			})
			.catch(err => {
				return res.status(500).json({
					status: false,
					message: "Registration Failed! Server Error..",
					error: err
				});
			});
	}).catch(e => {
		return res.status(500).json({
			status: false,
			message: "Registration Failed! Server Error..",
			error: e.err
		});
	});
});

//Login
router.post("/login", function (req, res) {
	User.findOne({ email: req.body.email }, (err, item) => {
		if (err) {
			console.log(err);
			return res.status(500).json({
				status: false,
				message: "Login Failed! Server Error..",
				error: err
			});
		}
		if (item == null) {
			res.status(401).json({
				status: false,
				message: "User does not exist"
			});
		} else {
			if (item.password == sha1(req.body.password)) {
				jwt.sign(item.toJSON(), process.env.secretKey, { expiresIn: "1d" }, (err, token) => {
					if (err) {
						res.status(500).json({
							status: false,
							message: "Problem signing in"
						});
					}
					res.status(200).json({
						status: true,
						token,
						user: item,
						message: "Logged in successfully"
					});
				});
			} else {
				res.status(401).json({
					status: false,
					message: "Incorrect password"
				});
			}
		}
	});
});

//Forgot Password
// router.get("/forgotPassword/:email",function(req,res){
// 	User.findOne({ email: req.params.email }, (err, item) => {
// 		if (err) {
// 			console.log(err);
// 			return res.status(500).json({
// 				status: false,
// 				message: "Forgot Password Failed! Server Error..",
// 				error: err
// 			});
// 		}
// 		if (item == null) {
// 			res.status(500).json({
// 				status: false,
// 				message: "Email is not registered!"
// 			});
// 		} else {
// 			//Secret Key generate for 6 digits
// 			let secret = '';
// 			let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// 			for ( let i = 0; i < 6; i++ )
// 				secret += characters.charAt(Math.floor(Math.random() * (characters.length + 1)) + 0);
// 			console.log(secret);
// 			const mailOptions = {
// 				from: 'Edge 2k20 <'+process.env.SENDER_EMAIL+'>',
// 				to: req.params.email,
// 				subject: "OTP for Change Password Request",
// 				html: "<p>Your OTP for Change Password Request is <b>"+secret+"</b>. <i>Do not share your OTP with anyone.<i></p>"
// 			};
// 			item.otp=secret;
// 			item.save().then(data=> {
// 				//Send OTP to registered mail
// 				transporter.sendMail(mailOptions).then(info => {
// 					res.status(200).json({
// 						status:true,
// 						secret: secret,
// 						data: info,
// 						message: "OTP Sent to your registered email"
// 					})
// 				}).catch(err => {
// 					res.status(500).json({
// 						status:false,
// 						secret: secret,
// 						error: err,
// 						message: "Error in sending mail"
// 					})
// 				})
// 			}).catch(err => {
// 				res.status(500).json({
// 					status:false,
// 					error: err,
// 					message: "Error in generating otp"
// 				})
// 			})
// 		}
// 	});
	
// })

//Reset Password
// router.post("/resetPassword",(req,res)=>{
// 	if(req.body.otp == "")
// 	{
// 		return res.status(401).json({
// 			status: false,
// 			message:"Unauthorized!! OTP cannot be blank"
// 		})
// 	}
// 	User.findOneAndUpdate({email: req.body.email, otp: req.body.otp},{password: sha1(req.body.password), otp: ""},(err,item) =>{
// 		if(err)
// 		{
// 			console.log(err);
// 			return res.status(500).json({
// 				status: false,
// 				message: "Reset Password Failed! Server Error..",
// 				error: err
// 			});
// 		}
// 		if(item == null)
// 		{
// 			return res.status(500).json({
// 				status: true,
// 				message: "Incorrect OTP",
// 				data: item,
// 			})
// 		}
// 		else{
// 			return res.status(200).json({
// 				status: true,
// 				message: "Password reset completed! Login with new password",
// 				data: item,
// 			})
// 		}
// 	})
// })

//Event Registration
router.post("/eventRegister", Auth.authenticateAll, uploadFile.array("files[]", 2), function (
	req,
	res
) {
	User.findOne({ email: req.user.email }, (err, item) => {
		if (err) {
			console.log(err);
			return res.status(500).json({
				status: false,
				message: "Event Register Failed! Server Error..",
				error: err
			});
		}
		if (item) {
			var registerEvents = JSON.parse(req.body.registerEvents);
			// console.log(item);
			let firstRegistration = Object.keys(item.events).length > 0 ? false : true;
			// console.log("Is this first Registration" + firstRegistration);
			// console.log(registerEvents);
			if (!firstRegistration) {
				Object.keys(registerEvents).map(cat => {
					console.log(registerEvents[cat]);
					registerEvents[cat].map(event => {
						if (item.events.hasOwnProperty(cat)) {
							item.events[cat].push(event);
						} else {
							item.events[cat] = [event];
						}
					});
				});
			} else {
				item.events = registerEvents;
			}
			var len = item.eventRegDetails.total.length - -1;
			item.eventRegDetails.total.push(req.body.total);
			// console.log(item.events);
			item.verified = false;
			item.eventRegDetails.upiId.push(req.body.upiId);
			item.couponApplied = item.couponApplied - -req.body.couponApplied;
			item.eventRegDetails.receipt.push(req.files[0].originalname.split(".")[1]);
			if (req.files.length > 1) {
				item.couponPhoto = req.files[1].originalname.split(".")[1];
			}
			// console.log(item);
			User.findByIdAndUpdate(item._id, { $set: { events: item.events } }, err => {
				if (err) {
					console.log(err);
					return res.status(500).json({
						status: false,
						message: "Event Register Failed! Server Error..",
						error: err
					});
				} else {
					item
						.save()
						.then(data => {
							//Upload Payment Receipt
							const bs = GCS.file(
								item._id + "/receipt" + len + "." + req.files[0].originalname.split(".")[1]
							).createWriteStream({ resumable: false });
							bs.on("finish", () => {
								console.log(`https://storage.googleapis.com/${GCS.name}`);
								if (req.files.length > 1) {
									//Upload Coupon Photo
									const bs = GCS.file(
										item._id + "/couponPhoto." + req.files[1].originalname.split(".")[1]
									).createWriteStream({ resumable: false });
									bs.on("finish", () => {
										console.log(`https://storage.googleapis.com/${GCS.name}`);
										res.status(200).json({
											status: true,
											message: "Event Registration successful",
											msg: "Coupon added",
											user: data
										});
									})
										.on("error", err => {
											return res.status(500).json({
												status: false,
												message: "Payment Receipt Upload Error",
												error: err
											});
										})
										.end(req.files[1].buffer);
								} else {
									res.status(200).json({
										status: true,
										message: "Event Registration successful",
										user: data
									});
								}
							})
								.on("error", err => {
									return res.status(500).json({
										status: false,
										message: "Payment Receipt Upload Error",
										error: err
									});
								})
								.end(req.files[0].buffer);
						})
						.catch(err => {
							res.status(500).json({
								status: false,
								message: "Event Registration failed",
								error: err
							});
						});
				}
			});
		} else {
			res.status(200).json({
				status: true,
				message: "You are already registered for events",
				data: item
			});
			// item.events=req.body.registerEvents;
			// item.total=req.body.total;
			// item.save().then(data=> {
			//   res.status(200).json({
			//     'status':true,
			//     'message':"Event Registration successful",
			//     'data':data
			//   })
			// }).catch(err=> {
			//   res.status(200).json({
			//     'status':false,
			//     'message':"Event Registration failed",
			//     'data':err
			//   })
			// })
		}
	});
});

//Change Password
router.post("/changePassword", Auth.authenticateAll, function(req,res) {
  User.findById(req.body.id, (err, item) => {
		if (err) {
			console.log(err);
			return res.status(500).json({
				status: false,
				message: "Change Password Failed! Server Error..",
				error: err
			});
		}
		if (item == null) {
			res.status(401).json({
				status: false,
				message: "User does not exist"
			});
		} else {
			if (item.password == sha1(req.body.oldPassword)) {
        item.password = sha1(req.body.newPassword);
        item.save().then(data => {
          res.status(200).json({
            status: true,
            message: "Password Changed for user "+data.name,
            data: data
          });
        }).catch(err => {
          res.status(401).json({
            status: false,
            message: "Error in saving Password",
            error: err
          });
        })
			} else {
				res.status(200).json({
					status: false,
					message: "Incorrect Old password"
				});
			}
		}
	});
})

module.exports = router;
