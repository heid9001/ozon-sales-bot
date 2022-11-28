const {warmup} = require('./worker/browser');
const fsSync = require('fs');

// оставляем след в озоне, доказываем что не бот, сохраняем куки
(async () => {
    await warmup(60)
    if (fsSync.existsSync('./cookies.json')) {
        console.log("warmup complete!");
    } else {
        console.log("warmup failed!");
    }
})()
