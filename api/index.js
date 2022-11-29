const express       = require('express');
const bodyParser    = require('body-parser');
const moment        = require('moment-timezone');
const fs      = require('fs');
const {Sale, STATE_QUEUE}  = require('../worker/models');
const app     = express()
const port    = 3000
const DATE_FORMAT    = 'DD.MM HH:mm';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('front'));

app.get('/', (req, res) => {
    res.send(fs.readFileSync('./front/index.html').toString());
});

app.get('/entry/list', async (req, res)=>{
    try {
        let sales = await Sale.findAll();
        res.send(JSON.stringify({status: "ok", data: sales}));
    } catch (error) {
        res.send(JSON.stringify({status:"error", msg: error.message}));
    }
});

app.post('/entry', async (req, res) => {
    console.log(moment(req.body["at"], DATE_FORMAT));
    // wrong console.log(moment.utc(req.body["at"], DATE_FORMAT).tz('Europe/Moscow').format());
    try {
        let sale = await Sale.create({
            status: STATE_QUEUE,
            entry: req.body.entry,
            at:    moment(req.body["at"], DATE_FORMAT).toDate(),
            atCart:moment(req.body["atCart"], DATE_FORMAT).toDate()
        });
        res.send(JSON.stringify({status: "ok", data: sale}));
    } catch (error) {
        res.send(JSON.stringify({status:"error", msg: error.message}));
    }
});

app.delete('/entry', async (req, res)=>{
    try {
        await Sale.destroy({
            where: {
                id: parseInt(req.body.id)
            }
        });
        res.send(JSON.stringify({"status": "ok", "data": sale}));
    } catch (error) {
        res.send(JSON.stringify({status:"error", msg: error.message}));
    }
});

app.listen(port, '0.0.0.0', ()=>{
    console.log(`running on port:` + port);
});
