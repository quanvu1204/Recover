const app = require('./app');
const port = 3000;

const https = require('https');
const fs = require("fs");

const privateKey  = fs.readFileSync('./key.pem', 'utf8');
const certificate = fs.readFileSync('./cert.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({success: false, code: err.message});
});

//const server = https.createServer(credentials, app);

app.listen(port, () => console.log('Server listening on port '+port+'!'));
