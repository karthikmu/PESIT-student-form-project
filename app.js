// curl -k https://localhost:8000/
var http = require('http');
var express = require('express');
var fs = require('fs');
var md5 = require('MD5');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var busboy = require('connect-busboy'); //middleware for form/file upload

app = express();


// GET /style.css etc
app.use(express.static(__dirname + '/public'));
app.use('/css', express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/public'));
app.use('/images', express.static(__dirname + '/public'));
app.use('/fonts', express.static(__dirname + '/public'));
app.use('/forms', express.static(__dirname + '/forms'));
app.use('/source', express.static(__dirname + '/source'));
app.use(bodyParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // must use cookieParser before expressSession
app.use(busboy());
app.use(expressSession({
    secret: 'somesecrettokenhere'
}));


//Mysql Connection 
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwerty',
    database: 'forms_schema'
});
//connect to mysql
connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});


//handle database server disconnect here
connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        setTimeout(function () {
            connection.connect();
            connection.connect(function (err) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }

                console.log('connected as id ' + connection.threadId);

            });
        }, 2000); // lost due to either server restart, or a
    } else { // connnection idle timeout (the wait_timeout
        throw err; // server variable configures this)
    }
});


app.get('/download', function (req, res) {
    //console.log("downloading file  :  "+ req.query.file);
    // res.sendFile("");
    var options = {
        root: __dirname + '/public/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    var fileName = "index.html";
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        } else {
            console.log('Sent:', fileName);
        }
    });

});

app.get('/', function (req, res) {

    req.session.user = "";
    var options = {
        root: __dirname + '/public/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    var fileName = "login.html";
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        } else {
            console.log('Sent:', fileName);
        }
    });

});


app.get('/ww', function (req, res) {

    req.session.user = "";
    var options = {
        root: __dirname + '/public',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    var fileName = "test.html";
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        } else {
            console.log('Sent:', fileName);
        }
    });

});
app.post('/login', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.session.user || req.session.user == "") {
        if (!req.body.email || !req.body.role || !req.body.passwd) {
            res.redirect('/');
            return;
        }

        var x = 'SELECT * FROM forms_schema.' + req.body.role + ' where email="' + req.body.email + '" and passwd=MD5("' + req.body.passwd + '")';
        console.log(x);
        //authenticate
        connection.query(x, function (err, rows, fields) {
            if (!err) {

                console.log('The user name is: ', rows[0]);
                if (rows[0]) {
                    //set the session variable here
                    req.session.user = rows[0];

                    if (req.session.user.role == undefined) {
                        req.session.user.role = req.body.role;
                    }
                    res.redirect('/success');
                } else {
                    req.session.user = "";
                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Invalid credentials!", "Login Again!", "error");window.location.replace("/")}</script></html>');
                }
            } else {
                res.end('Error while performing Query.');
            }
        });
    } else
        res.redirect('/');
});


//adding usesrs

app.post('/adduser', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email || !req.body.role || !req.body.name || !req.body.passwd) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/adduser")}</script></html>');
        return;
    }
    var post = {
        email: req.body.email,
        name: req.body.name,
        role: req.body.role,
        passwd: md5(req.body.passwd)
    };
    var x = 'INSERT into forms_schema.users set ?';
    console.log(x);
    //authenticate
    var query = connection.query(x, post, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/adduser")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate user", "input Values", "error");window.location.replace("/adduser")}</script></html>');
        }
    });
    console.log(query.sql);

});



app.post('/addoperator', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email || !req.body.name || !req.body.passwd) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/addoperator")}</script></html>');
        return;
    }
    var post = {
        email: req.body.email,
        name: req.body.name,
        passwd: md5(req.body.passwd)
    };
    var x = 'INSERT into forms_schema.operators set ?';
    console.log(x);
    //authenticate
    var query = connection.query(x, post, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/addoperator")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate user", "input Values", "error");window.location.replace("/addoperator")}</script></html>');
        }
    });
    console.log(query.sql);

});



app.post('/removeuser', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email || !req.body.role) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/removeuser")}</script></html>');
        return;
    }

    var x = 'DELETE from forms_schema.users where email="' + req.body.email + '"';
    console.log(x);
    //authenticate
    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Deleted!", "success");window.location.replace("/removeuser")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Cannot delete user", "error!!", "error");window.location.replace("/removeuser")}</script></html>');
        }
    });
    console.log(query.sql);

});

app.post('/removeworkflow', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email || !req.body.form) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/viewworkflow")}</script></html>');
        return;
    }

    var x = 'DELETE from forms_schema.workflow where email="' + req.body.email + '" and fname="' + req.body.form + '"';
    console.log(x);
    //authenticate
    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Deleted!", "success");window.location.replace("/viewworkflow")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Cannot delete workflow", "error!!", "error");window.location.replace("/viewworkflow")}</script></html>');
        }
    });
    console.log(query.sql);

});


app.post('/createworkflow', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email || !req.body.form || req.body.l2 == undefined || req.body.l3 == undefined) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/createworkflow")}</script></html>');
        return;
    }

    var l1 = null,
        l2 = null,
        l3 = null;

    if (req.body.l1 != undefined)
        l1 = req.body.l1;
    if (req.body.l2 != undefined)
        l2 = req.body.l2;
    if (req.body.l3 != undefined)
        l3 = req.body.l3;

    var post = {
        email: req.body.email,
        fname: req.body.form,
        l1: l1,
        l2: l2,
        l3: l3
    };
    var x = 'INSERT into forms_schema.workflow set ?';
    console.log(x);
    //authenticate
    var query = connection.query(x, post, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/createworkflow")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate entry!!", "input Values", "error");window.location.replace("/createworkflow")}</script></html>');
        }
    });
    console.log(query.sql);

});



app.post('/formaccess', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email || !req.body.role || !req.body.form) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/formaccess")}</script></html>');
        return;
    }

    var post = {
        email: req.body.email,
        fname: req.body.form,
        role: req.body.role
    };
    var x = 'INSERT into forms_schema.formaccess set ?';
    console.log(x);
    //authenticate
    var query = connection.query(x, post, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/formaccess")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate entry!!", "input Values", "error");window.location.replace("/formaccess")}</script></html>');
        }
    });
    console.log(query.sql);

});


app.post('/removeoperator', function (req, res) {
    console.log(JSON.stringify(req.body));
    if (!req.body.email) {
        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/removeoperator")}</script></html>');
        return;
    }

    var x = 'DELETE from forms_schema.operators where email="' + req.body.email + '"';
    console.log(x);
    //authenticate
    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Deleted!", "success");window.location.replace("/removeoperator")}</script></html>');
        } else {

            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Cannot delete user", "error!!", "error");window.location.replace("/removeoperator")}</script></html>');
        }
    });
    console.log(query.sql);

});


app.post('/getusers', function (req, res) {
    console.log(req.body.role);

    var x = 'SELECT * FROM forms_schema.users where role="' + req.body.role + '"';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });


});


app.post('/getformdata', function (req, res) {

    var x = 'SELECT * FROM forms_schema.forms where fname="' + req.body.fname + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

});

app.post('/getsubmittedforms', function (req, res) {

    var x = 'SELECT * FROM forms_schema.formdata where email="' + req.session.user.email + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

});

app.post('/getfilledformdata', function (req, res) {

    var x = 'SELECT * FROM forms_schema.formdata where fname="' + req.body.fname + '" and email="' + req.body.email + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

    console.log("getting filled form data :" + query.sql);

});

app.post('/approve', function (req, res) {

    var x = 'SELECT * FROM forms_schema.formdata where fname="' + req.body.fname + '" and email="' + req.body.email + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {
            var level = rows[0].level + 1;
            var status = 'pending';
            var prev = rows[0].cur;
            var cur = "null";
            if (level > 3) {
                status = "approved";
            }
            var q = 'SELECT * FROM forms_schema.workflow where email="' + req.body.email + '" and fname="' + req.body.fname + '"';
            var query = connection.query(q, function (err, rows, fields) {
                if (!err) {
                    console.log("approve sql : " + JSON.stringify(rows[0]));
                    if (level == 3)
                        cur = rows[0].l3;
                    else if (level == 2)
                        cur = rows[0].l2;

                    var post = {
                        prev: prev,
                        cur: cur,
                        status: status,
                        level: level
                    };
                    var x = 'UPDATE forms_schema.formdata set ? where fname="' + req.body.fname + '" and email="' + req.body.email + '"';

                    //authenticate
                    var query = connection.query(x, post, function (err, rows, fields) {
                        if (!err) {
                            res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Rejected!", "success");window.history.back()}</script></html>');
                        }
                    });
                }
            });

        } else {
            res.end();
        }
    });

    console.log("getting filled form data :" + query.sql);

});

app.post('/reject', function (req, res) {

    console.log("reject called with data : " + req.body.email + req.body.fname + req.body.comment);

    var x = 'SELECT * FROM forms_schema.formdata where fname="' + req.body.fname + '" and email="' + req.body.email + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            console.log("data " + JSON.stringify(rows[0]));
            var status = 'rejected';
            var prev = rows[0].cur;
            var cur = "null";

            var post = {
                prev: prev,
                cur: cur,
                status: status,
                comment: req.body.comment
            };
            var x = 'UPDATE forms_schema.formdata set ? where fname="' + req.body.fname + '" and email="' + req.body.email + '"';

            //authenticate
            var query = connection.query(x, post, function (err, rows, fields) {
                if (!err) {
                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Rejected!", "success");window.history.back()}</script></html>');
                }
            });


        } else {
            res.end();
        }
    });

    console.log("getting filled form data :" + query.sql);

});

app.post('/getfilledformuser', function (req, res) {

    var x = 'SELECT * FROM forms_schema.formdata where fname="' + req.body.fname + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

});


app.post('/getforms', function (req, res) {
    console.log(req.body.role);

    var x = 'SELECT * FROM forms_schema.forms';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });


});

app.post('/getworkflowforms', function (req, res) {

    var x = 'SELECT * FROM forms_schema.workflow';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });
});

app.post('/getformstofill', function (req, res) {

    var x = 'SELECT * FROM forms_schema.workflow where email="' + req.session.user.email + '"';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });
});

app.post('/getworkflowusers', function (req, res) {

    console.log("fname:" + req.body.fname);
    var x = 'SELECT * FROM forms_schema.workflow where fname="' + req.body.fname + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });
    console.log(query.sql);


});

app.post('/getaccessforms', function (req, res) {
    console.log(req.body.role);

    var x = 'SELECT * FROM forms_schema.formaccess';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });


});


app.post('/getaccessusers', function (req, res) {
    console.log(req.body.fname);

    var x = 'SELECT * FROM forms_schema.formaccess where fname="' + req.body.fname + '"';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });


});


app.post('/getaccessrole', function (req, res) {

    console.log("role: " + req.body.email);
    var x = 'SELECT * FROM forms_schema.formaccess where email="' + req.body.email + '"';

    connection.query(x, function (err, rows, fields) {
        if (!err) {

            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });


});

app.post('/getoperators', function (req, res) {
    console.log(req.body.role);

    var x = 'SELECT * FROM forms_schema.operators';

    connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });


});

app.post('/getformnotification', function (req, res) {

    var x = 'SELECT * FROM forms_schema.formdata where email="' + req.session.user.email + '" and cur!=prev';

    connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

});

app.post('/getapprovenotification', function (req, res) {

    var x = 'SELECT * FROM forms_schema.formdata where cur="' + req.session.user.email + '"';

    connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

});


app.post('/clearnotification', function (req, res) {

    var x = 'UPDATE forms_schema.formdata set prev=cur where email="' + req.session.user.email + '" and fname="' + req.body.fname + '"';

    connection.query(x, function (err, rows, fields) {
        if (!err) {
            res.end(JSON.stringify(rows));
        } else {
            res.end();
        }
    });

});

function getNextworkflowLevel(email, form, level) {
    var x = 'SELECT * FROM forms_schema.workflow where email="' + email + '" and fname="' + form + '"';

    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {

            console.log("rows  :    " + JSON.stringify(rows));
            if (level == 1)
                return rows[0].l1;
            if (level == 2)
                return rows[0].l2;
            if (level == 3)
                return rows[0].l3;
        } else {
            console.log(err);
            return null;
        }
    });

    console.log("query=" + query.sql);
}

app.post('/fillformstudent', function (req, res) {


    //getlevel starts here
    var cur = null;
    var x = 'SELECT * FROM forms_schema.workflow where email="' + req.session.user.email + '" and fname="' + req.body.form + '"';
    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {
            console.log("rows  :    " + JSON.stringify(rows));
            cur = rows[0].l1;

            //insert into db
            console.log("cur=" + cur);
            var post = {
                fname: req.body.form,
                email: req.session.user.email,
                fdata: req.body.fdata,
                prev: req.session.user.email,
                cur: cur,
                status: "pending",
                level: 1
            };
            var x = 'INSERT into forms_schema.formdata set ?';

            //authenticate
            var query = connection.query(x, post, function (err, rows, fields) {
                if (!err) {
                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/fillformstudent")}</script></html>');
                } else {

                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate form", "input Values", "error");window.location.replace("/fillformstudent")}</script></html>');
                }
            });
            console.log(query.sql);



        } else {
            console.log(err);
            return null;
        }
    });
    console.log("query=" + query.sql);
    //get level ends here

});


app.post('/fillformprofessor', function (req, res) {


    //getlevel starts here
    var cur = null;
    var x = 'SELECT * FROM forms_schema.workflow where email="' + req.session.user.email + '" and fname="' + req.body.form + '"';
    var query = connection.query(x, function (err, rows, fields) {
        if (!err) {
            cur = rows[0].l2;
            console.log(JSON.stringify(rows[0]));
            //insert into db
            console.log("cur=" + cur);
            var post = {
                fname: req.body.form,
                email: req.session.user.email,
                fdata: req.body.fdata,
                prev: req.session.user.email,
                cur: cur,
                status: "pending",
                level: 2
            };
            var x = 'INSERT into forms_schema.formdata set ?';

            //authenticate
            var query = connection.query(x, post, function (err, rows, fields) {
                if (!err) {
                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/fillformprofessor")}</script></html>');
                } else {

                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate form", "input Values", "error");window.location.replace("/fillformprofessor")}</script></html>');
                }
            });
            console.log(query.sql);



        } else {
            console.log(err);
            return null;
        }
    });
    console.log("query=" + query.sql);
    //get level ends here

});


//global data
var formname = null,
    fdata = null,
    filepath = null;

app.post('/createform', function (req, res) {
    if (!req.session.user || req.session.user == "") {
        res.redirect('/');
        return;
    }




    if (req.busboy) {

        var fstream;

        req.busboy.on('file', function (fieldname, file, filename) {
            console.log("Uploading: " + filename);

            filepath = __dirname + '/forms/' + filename;
            //Path where image will be uploaded
            fstream = fs.createWriteStream(filepath);
            file.pipe(fstream);
            fstream.on('close', function () {
                console.log("Upload Finished of " + filename);
                //do your stuff here

                console.log(fdata);
                console.log(formname);
                console.log(filepath);

                if (fdata == null || formname == null || filepath == null) {
                    res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Input Values", "input Values", "error");window.location.replace("/annotateoperator")}</script></html>');
                    return;
                }

                var post = {
                    fname: formname,
                    fsrc: filepath,
                    fdata: fdata
                };
                var x = 'INSERT into forms_schema.forms set ?';

                //authenticate
                var query = connection.query(x, post, function (err, rows, fields) {
                    if (!err) {
                        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Success", "Added!", "success");window.location.replace("/annotateoperator")}</script></html>');
                    } else {

                        res.end('<html><head><link rel="stylesheet" href="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.css"><script src="https://cdn.rawgit.com/t4t5/sweetalert/v0.2.0/lib/sweet-alert.min.js"></script></head><body onload="myFunction()"><script>function myFunction(){swal("Duplicate form", "input Values", "error");window.location.replace("/annotateoperator")}</script></html>');
                    }
                });
                console.log(query.sql);



            });
            fstream.on('error', function (err) {
                console.log("Upload error" + err);
                filepath = null;
            });
        });

        req.busboy.on('field', function (key, value, keyTruncated, valueTruncated) {
            // use req.body
            console.log(key + value);
            if (key == 'fdata') {
                fdata = value;
            }
            if (key == 'formname') {
                formname = value;
            }
        });

        req.pipe(req.busboy);
    }


});



app.get('/success', function (req, res) {

    if (req.session.user && req.session.user != "" && req.session.user.role != "") {
        //console.log("Server ready at http://localhost:3001");
        console.log(req.session.user);

        if (req.session.user.role == 'admins')
            res.redirect('/adduser');
        else if (req.session.user.role == 'operators')
            res.redirect('/annotateoperator');
        else if (req.session.user.role == 'student')
            res.redirect('/fillformstudent');
        else if (req.session.user.role == 'professor')
            res.redirect('/fillformprofessor');
        else if (req.session.user.role == 'HOD')
            res.redirect('/approveformhod');
        else if (req.session.user.role == 'principal')
            res.redirect('/approveformprincipal');



    } else
        res.redirect('/');

});

app.get('/adduser', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/adduserAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});


app.get('/annotateoperator', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/annotateOperatorPage1.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></body></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/viewformsoperator', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/viewformsOperatorPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></body></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/printformsoperator', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/printformsOperatorPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></body></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/printformfancybox', function (req, res) {

    if (req.session.user && req.session.user != "") {


        fs.readFile('./public/printformfancybox.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>var form ="' + req.query.form + '",email="' + req.query.email + '";</script></body></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/viewformfancybox', function (req, res) {

    if (req.session.user && req.session.user != "") {
        console.log("fancy called + " + req.query.form)

        fs.readFile('./public/viewformfancybox.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>var form ="' + req.query.form + '",email="' + req.session.user.email + '";</script></body></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});


app.get('/approveformfancybox', function (req, res) {

    if (req.session.user && req.session.user != "") {
        console.log("fancy called + " + req.query.form)

        fs.readFile('./public/approveformfancybox.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>var form ="' + req.query.form + '",email="' + req.query.email + '";</script></body></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});


app.get('/addoperator', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/addoperatorAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/removeuser', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/removeuserAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/createworkflow', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/createworkflowAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});


app.get('/viewworkflow', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/viewworkflowAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/fillformstudent', function (req, res) {

    if (req.session.user && req.session.user != "") {
        console.log("fillform : " + JSON.stringify(req.session.user));
        fs.readFile('./public/fillformStudentPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/fillformprofessor', function (req, res) {

    if (req.session.user && req.session.user != "") {
        fs.readFile('./public/fillformProfessorPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/approveformhod', function (req, res) {

    if (req.session.user && req.session.user != "") {
        fs.readFile('./public/approveformHODPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/approveformprincipal', function (req, res) {

    if (req.session.user && req.session.user != "") {
        fs.readFile('./public/approveformPrincipalPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/viewformstudent', function (req, res) {

    if (req.session.user && req.session.user != "") {
        console.log("fillform : " + JSON.stringify(req.session.user));
        fs.readFile('./public/viewformStudentPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/approveformprofessor', function (req, res) {

    if (req.session.user && req.session.user != "") {
        console.log("fillform : " + JSON.stringify(req.session.user));
        fs.readFile('./public/approveformProfessorPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/viewformprofessor', function (req, res) {

    if (req.session.user && req.session.user != "") {
        console.log("fillform : " + JSON.stringify(req.session.user));
        fs.readFile('./public/viewformProfessorPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});





app.get('/formaccess', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/formaccessAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});


app.get('/removeoperator', function (req, res) {

    if (req.session.user && req.session.user != "") {

        fs.readFile('./public/removeoperatorAdminPage.html', function (error, content) {
            if (error) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });

                res.write(content, 'utf-8');
                res.end('<script>$(document).ready(function() { $(".role").each(function () {$(this).html("' + req.session.user.role + '"); });    $(".user-name").each(function () {$(this).html("' + req.session.user.name + '"); });      $(".profile-pic").each(function () {$(this).attr("src","/images/profile.png"); });    });</script></html>', 'utf-8');
            }

        });
    } else
        res.redirect('/');

});

app.get('/logout', function (req, res) {
    //console.log("Server ready at http://localhost:3001");
    req.session.destroy();
    res.redirect('/');
});

app.get('/login', function (req, res) {
    //console.log("Server ready at http://localhost:3001");
    res.redirect('/');
});

http.createServer(app).listen(3001, function () {
    console.log("Server ready at http://localhost:3001");
});