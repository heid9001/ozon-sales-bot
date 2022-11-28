const {Sale} = require('./worker/models');


(async ()=>{
    try {
        await Sale.sync({force: true});
    } catch (err) {
        console.error(err.message);
    }
})();
