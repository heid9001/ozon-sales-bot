const {
    Sale,
    STATE_QUEUE,
    STATE_PROGRESS,
} = require('./models');
const { Op } = require("sequelize");
const moment = require('moment-timezone');
const {process} = require('./browser');


const sleep = ms => new Promise(r => setTimeout(r, ms));


(async ()=>{
    try {
        while (true) {
            let jobs = await Sale.findAll({
                where: {
                    [Op.and]: {
                        status: STATE_QUEUE,
                        atCart: {
                            [Op.lte]: moment().toDate()
                        }
                    }
                }
            });
            for (let i = 0; i < jobs.length; i++) {
                let job = jobs[i];
                try {
                    job.status = STATE_PROGRESS
                    await job.save()
                } catch (err) {
                    console.error(err.message);
                }
                await process(job);
            }
            await sleep(1000);
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();
