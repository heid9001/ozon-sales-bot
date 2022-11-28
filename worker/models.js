const {Sequelize} = require('sequelize');
const {DataTypes} = require('sequelize');
const moment      = require('moment');
const STATE_QUEUE       = 0; exports.STATE_QUEUE    = STATE_QUEUE;
const STATE_PROGRESS    = 1; exports.STATE_PROGRESS = STATE_PROGRESS;
const STATE_WAITORDER   = 2; exports.STATE_PROGRESS = STATE_PROGRESS;
const STATE_DONE        = 3; exports.STATE_DONE     = STATE_DONE;
const STATE_ERROR       = 4; exports.STATE_ERROR    = STATE_ERROR;


// это чмо ожидает что в базе хранятся даты в UTC+3, при чтении он вычитает -3 от даты
const db = new Sequelize('sales-bot', 'root', '', {
    host: 'localhost',
    dialect: 'mariadb',
    logging: false,
    timezone: "Europe/Moscow",
});
exports.db = db;


const Sale = db.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: STATE_QUEUE
    },
    entry: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    current: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    at: {
        type: 'TIMESTAMP',
        allowNull: false,
    },
    atCart: {
        type: 'TIMESTAMP',
        allowNull: false,
    }
}, {
    sequelize: db,
    tableName: 'sale',
    timestamps: false,
});
exports.Sale = Sale;
