const express = require('express');
const path = require('path');
const exphbs  = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

/* Setup views */
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}));
app.set('view engine', '.hbs');
app.use(express.static(path.join(__dirname, './api/public')));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/* Setup routes */
const index = require('./api/routes/index');
app.use('/', index);

const postApprovals = require('./api/routes/post_approvals');
app.use('/post_approval', postApprovals);

const pendingUploads = require('./api/routes/pending_uploads');
app.use('/pending_upload', pendingUploads);

const scriptStatistics = require('./api/routes/script_statistics');
app.use('/script_statistic', scriptStatistics);

app.use(express.static(__dirname + './api/public'));

/* Export to server.js */
module.exports = app;
