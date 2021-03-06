const router = require("express").Router();
const GCS = require("../helpers/gcs");
const Auth = require("../middlewares/auth");
var Category = require("../model/categoryEventDetails");
var Coupon = require("../model/couponDetails");
var Query = require("../model/queryDetails");
var User = require("../model/userDetails");

const LOT_SIZE = parseInt(process.env.MSG_COUNT);

router.get("/getSettings", (req, res) => {
	let loadData = GCS.file("settings.txt").createReadStream();
	let text = "";
	loadData
		.on("data", data => {
			text += data;
		})
		.on("end", () => {
			let jsonData = JSON.parse(text);
			return res.status(200).json({
				status: true,
				message: "Settings Retrieved Successfully",
				data: jsonData,
				serverDate: new Date()
			});
		})
		.on("error", err => {
			return res.status(500).json({
				status: false,
				message: "Settings Retrieve Error",
				error: err
			});
		});
});

router.get("/getBanner", (req, res) => {
	res.attachment("banner.png");
	GCS.file("banner.png").createReadStream().pipe(res);
});

router.get("/getFile/:uid/:file", (req, res) => {
	res.attachment(req.params.file);
	GCS.file(req.params.uid + "/" + req.params.file)
		.createReadStream()
		.pipe(res);
});

//  Get all events .
router.get("/getAllEvents", Auth.authenticateAll, function (req, res) {
	Category.find({}, (err, item) => {
		if (err) {
			return res.status(500).json({
				status: false,
				message: "Events loading Failed! Server Error..",
				error: err
			});
		}
		res.status(200).json({
			status: true,
			data: item,
			message: "Events fetched successfully"
		});
	});
});

router.get("/getCategory/:id", Auth.authenticateAll, function (req, res) {
	Category.findOne({ _id: req.params.id }, (err, item) => {
		if (err) {
			return res.status(500).json({
				status: false,
				message: "Category loading Failed! Server Error..",
				error: err
			});
		}
		res.status(200).json({
			status: true,
			data: item,
			message: "Category fetched successfully"
		});
	});
});

//Get coupon individually
router.get("/getCoupon", Auth.authenticateAll, function (req, res) {
	Coupon.findOne({ email: { $regex: new RegExp("^" + req.user.email, "i") } }, (err, coupon) => {
		if (err) {
			return res.status(500).json({
				status: false,
				message: "Fetching Coupon Failed! Server Error..",
				error: err
			});
		}
		return res.status(200).json({
			status: true,
			message: "Fetched successfully",
			coupon: coupon
		});
	});
});

//Get Coupon using coupon Code
router.get("/getCoupon/:cc",Auth.authenticateAdmin,function(req,res){
	Coupon.findOne({couponCode: req.params.cc}, (err,item) => {
		if(err)
		{
			return res.status(500).json({
				status: false,
				message: "Fetching Coupon Failed! Server Error..",
				error: err
			});
		}
		console.log(item);
		return res.status(200).json({
			status: true,
			message: "Coupon fetched",
			data: item
		})
	})
})

//Get All Queries
router.get('/getAllQueries',Auth.authenticateAll, (req,res) => {
    Query.aggregate([{$project: { count: { $size: "$messages" }}}], (err1, data) => {
        if(err1)
            {
                return res.status(500).json({
                    status: false,
                    message: "Query loading Failed! Server Error..",
                    error: err1
                });
            }
        let lasts = [];
        data.forEach(d => lasts.push(d.count <= LOT_SIZE))
        Query.find({},{ messages: {$slice: -LOT_SIZE}}, (err,query)=> {
            if(err)
            {
                return res.status(500).json({
                    status: false,
                    message: "Query loading Failed! Server Error..",
                    error: err
                });
            }
            let queryData = [];
            query.forEach((q,i) => {
                let t = q.toJSON();
                t.last = lasts[i]
                queryData.push(t);
            })
            res.status(200).json({
                status: true,
                data: queryData,
                lotSize: LOT_SIZE,
                message: "Query fetched successfully"
            })
        })
    })
})

//Get Query By Category Id and Lot number
router.get('/getQuery/:id/:num',Auth.authenticateAll,function(req,res){
    const num=parseInt(req.params.num- -1)*LOT_SIZE; 
    Query.aggregate([{$project: { count: { $size: "$messages" }}}], (err1, data) => {
        if(err1)
            {
                return res.status(500).json({
                    status: false,
                    message: "Query loading Failed! Server Error..",
                    error: err1
                });
            }
        let msgCount = data.find(d => d._id == req.params.id).count;
        let remains = msgCount-(LOT_SIZE*parseInt(req.params.num));
        Query.findById(req.params.id, {  messages: { $slice: [-num, remains < LOT_SIZE ? remains : LOT_SIZE] } }, (err,query)=> {
            if(err)
            {
                return res.status(500).json({
                    status: false,
                    message: "Query loading Failed! Server Error..",
                    error: err
                });
            }
            let que = query.toJSON();
            que.last = remains <= LOT_SIZE;
            res.status(200).json({
                status: true,
                data: que,
                message: "Query fetched successfully"
            })
        })
    })
});

//Add messages in Query
router.post("/addMessage2", Auth.authenticateAll, function (req, res) {
	Query.findOne({ categoryName: req.body.categoryName }, (err, item) => {
		if (err) {
			console.log("Add Message Failed", err);
			return res.status(500).json({
				status: false,
				message: "Add Message Failed! Server Error..",
				error: err
			});
		}
		if (item) {
			var temp = req.user.name;
			if (req.user.admin) {
				temp = "ADMIN";
			}
			var message = {
				name: temp,
				email: req.user.email,
				msg: req.body.message,
				createdAt: Date.now()
			};
			item.messages = [...item.messages, message];
			item
				.save()
				.then(data => {
					res.status(200).json({
						status: true,
						message: "Message added in the query",
						data: data
					});
				})
				.catch(err2 => {
					console.log("Message Addition Failed! II Try again..", err3);
					res.status(500).json({
						status: false,
						message: "Message addition error",
						error: err2
					});
				});
		} else {
			console.log("Add Message Failed::FIND");
			return res.status(500).json({
				status: false,
				message: "Query does not exist!",
				error: "Query find error"
			});
		}
	});
});

//Add message with push in Query
router.post("/addMessage",Auth.authenticateAll,function (req,res) {
	var temp = req.user.name;
	if (req.user.admin) {
		temp = "ADMIN";
	}
	var message = {
		name: temp,
		email: req.user.email,
		msg: req.body.message,
		createdAt: Date.now()
	};
	Query.updateOne({categoryName: req.body.categoryName}, {$push: {"messages": message}}, (err,item)=> {
		if (err) {
			console.log("Add Message Failed", err);
			return res.status(500).json({
				status: false,
				message: "Add Message Failed! Server Error..",
				error: err
			});
		}
		return res.status(200).json({
            status: true,
            message: "Add Message successful"
        });
	})
})

//Delete Message in Query
router.post("/deleteMessage", Auth.authenticateAll, function (req, res) {
	const adminEmail = process.env.adminEmail.split(',');
	if(adminEmail.indexOf(req.user.email) == -1 && req.user.name != req.body.msgName)
	{
		return res.status(401).json({
			status: false,
			message: "Deleting Message Failed! Server Error..",
			error: "Access denied"
		});
	}
    Query.updateOne({ categoryName: req.body.categoryName }, { $pull: { "messages" : { "_id": req.body.msgId } } }, (err, item) => {
		if (err) {
			console.log("Delete Message Failed", err);
			return res.status(500).json({
				status: false,
				message: "Deleting Message Failed! Server Error..",
				error: err
			});
        }
        return res.status(200).json({
            status: true,
            message: "Delete Message successful",
            data: item
        });
    })
});

router.get("/list", (req, res) => {
	let listFiles = async () => {
		const [files] = await GCS.getFiles();
		let fileNames = [];
		files.forEach(f => (fileNames = [...fileNames, f.name]));
		return res.status(200).json({
			status: true,
			message: "Deleted successfully",
			user: fileNames
		});
	};
	listFiles().catch(err => {
		return res.status(500).json({
			status: false,
			message: "Cannot List Files",
			error: err
		});
	});
});

//Add OTP in User
router.get("/add_otp", function (req, res) {
    User.updateMany({}, { $set: { "otp": "" } }, (err, item) => {
		if (err) {
			console.log("OTP addition Failed", err);
			return res.status(500).json({
				status: false,
				message: "OTP Addition Failed! Server Error..",
				error: err
			});
        }
        return res.status(200).json({
            status: true,
            message: "Update Success",
            data: item
        });
    })
});

//Get registered events
router.get("/getRegEvents/:email",function(req,res){
	User.findOne({email: req.params.email}, (err,item) => {
		if(err)
		{
			console.log("Get Registered Events Failed", err);
			return res.status(500).json({
				status: false,
				message: "Get Registered Events Failed! Server Error..",
				error: err
			});
		}
		if (item == null)
		{
			return res.status(500).json({
				status : false,
				message: 'User is not registered'
			})
		}
		return res.status(200).json({
			status: true,
			message: 'Events Fetched successfully',
			data: item.events
		})
	})
})

//Get emails for registered event Id
router.get('/getRegEmails/:eventId',function(req,res){
	var count =0;
	User.find({},{email: 1, events: 1}, (err,items) => {
		if(err)
		{
			console.log("Get Registered Emails Failed", err);
			return res.status(500).json({
				status: false,
				message: "Get Registered Emails Failed! Server Error..",
				error: err
			});
		}
		if (items.length == 0)
		{
			return res.status(500).json({
				status : false,
				message: 'No user is registered'
			})
		}
		var emails = [];
		items.forEach(item => {
			Object.keys(item.events).forEach(key => {
				if( item.events[key].indexOf(req.params.eventId) != -1)
				{
					emails.push(item.email);
					count+=1;
				}
				else if( item.events[key].indexOf(req.params.eventId+'_0') != -1)
				{
					emails.push(item.email);
					count+=1;
				}
				else if( item.events[key].indexOf(req.params.eventId+'_1') != -1)
				{
					emails.push(item.email);
					count+=1;
				}
				else if( item.events[key].indexOf(req.params.eventId+'_2') != -1)
				{
					emails.push(item.email);
					count+=1;
				}
			})
		})
		return res.status(200).json({
			status: true,
			message: 'Emails fetched successfully',
			data: count,
			emails
		})
	})
})

//Get registered events
router.get("/getRegEvents/:email",function(req,res){
	User.findOne({ email: { $regex: new RegExp("^" + req.params.email, "i") } }, (err,item) => {
		if(err)
		{
			console.log("Get Registered Events Failed", err);
			return res.status(500).json({
				status: false,
				message: "Get Registered Events Failed! Server Error..",
				error: err
			});
		}
		if (item == null)
		{
			return res.status(500).json({
				status : false,
				message: 'User is not registered'
			})
		}
		return res.status(200).json({
			status: true,
			message: 'Events Fetched successfully',
			data: item.events
		})
	})
})

//Get emails for registered event Id
router.get('/getRegEmails/:eventId',function(req,res){
	var count =0;
	User.find({},{email: 1, events: 1}, (err,items) => {
		if(err)
		{
			console.log("Get Registered Emails Failed", err);
			return res.status(500).json({
				status: false,
				message: "Get Registered Emails Failed! Server Error..",
				error: err
			});
		}
		if (items.length == 0)
		{
			return res.status(500).json({
				status : false,
				message: 'No user is registered'
			})
		}
		var emails = [];
		items.forEach(item => {
			Object.keys(item.events).forEach(key => {
				if( item.events[key].indexOf(req.params.eventId) != -1)
				{
					emails.push(item.email);
					count+=1;
				}
				else if( item.events[key].indexOf(req.params.eventId+'_0') != -1)
				{
					emails.push(item.email);
					count+=1;
				}
				else if( item.events[key].indexOf(req.params.eventId+'_1') != -1)
				{
					emails.push(item.email);
					count+=1;
				}
				else if( item.events[key].indexOf(req.params.eventId+'_2') != -1)
				{
					emails.push(item.email);
					count+=1;
				}
			})
		})
		return res.status(200).json({
			status: true,
			message: 'Emails fetched successfully',
			data: count,
			emails
		})
	})
})

module.exports = router;
