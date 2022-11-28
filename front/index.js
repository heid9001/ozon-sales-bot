// general
import 'bootstrap/dist/css/bootstrap.min.css';

// select2-plugin
import 'select2/dist/css/select2.min.css';
import 'select2-bootstrap-theme/dist/select2-bootstrap.min.css';
import 'select2';

// datetimepicker-plugin
import 'bootstrap-datetimepicker-npm/build/css/bootstrap-datetimepicker.min.css';
import DateTimePicker from 'bootstrap-datetimepicker-npm/src/js/bootstrap-datetimepicker';
(DateTimePicker($));

// timepicker plugin
import 'timepicker/jquery.timepicker.min.css';
import 'timepicker/jquery.timepicker';

import translit from 'latin-to-cyrillic';

import moment from 'moment';
const DATE_FORMAT    = 'DD.MM HH:mm';
const HOST           = 'http://localhost';
const PORT           = '3000';
const ENTRY_URL      = `${HOST}:${PORT}/entry`;
const ENTRY_LIST_URL = `${ENTRY_URL}/list`;

let sales = [];

$(document).ready(function(){
    let now = moment().toDate();
    $('#at').datetimepicker({format : DATE_FORMAT, defaultDate: now});
    $('#atCart').datetimepicker({format : DATE_FORMAT, defaultDate: now});
    $('#at').on('dp.change', function(){
        let atSale = $('#at').data("DateTimePicker").viewDate();
        let atCart = atSale.subtract(3, 'minutes').toDate();
        $('#atCart').data("DateTimePicker").date(atCart);
    });
    setInterval(function (){
        $.ajax({
            url: ENTRY_LIST_URL,
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            success: function(res) {
                sales = JSON.parse(res).data;
                render();
            }
        });
    }, 1000);

    $('#newSaleTask').on('click', function(){
        let saleTask = {
            entry: $('#entry').val(),
            at:    $('#at').data("DateTimePicker").viewDate().format(DATE_FORMAT),
            atCart:$('#atCart').data("DateTimePicker").viewDate().format(DATE_FORMAT)
        }
        $.ajax({
            url: ENTRY_URL,
            method: "POST",
            headers: {
                "Accept": "application/json"
            },
            data: saleTask,
            success: function(data) {}
        })
    });
});

function beforeNow(ts)
{
    let dt = moment(ts).diff(moment());
    return dt < 0 ? false : {
        h: Math.floor(dt / 1000 / 60 / 60 % 24),
        m: Math.floor(dt / 1000 / 60 % 60 ),
        s: Math.floor(dt / 1000 % 60),
    };
}

function render()
{
    let template = '';
    sales.forEach((sale)=>{
        let name = sale.entry.split("/")[4]; name = name[0].toUpperCase() + name.slice(1);
        name = name.replaceAll("-", " ");
        name = name.replaceAll(/[0-9]/g, " ");
        name = translit(name);
        let stateWidget = '';
        let beforeStart = beforeNow(sale.at);
        if (! beforeStart) {
            beforeStart = "скоро будет запущен";
        } else {
            beforeStart = "через "+ `${beforeStart.h} часов ${beforeStart.m} минут ${beforeStart.s} секунд`;
        }
        let beforeStart2 = beforeNow(sale.atCart);
        if (! beforeStart2) {
            beforeStart2 = "скоро будет запущен";
        } else {
            beforeStart2 = "через "+ `${beforeStart2.h} часов ${beforeStart2.m} минут ${beforeStart2.s} секунд`;
        }
        switch (sale.status) {
            case 0:{
                stateWidget = '<span style="float: right;" class="badge badge-info">В ожидании</span>';
                break;
            }
            case 1: {
                stateWidget = '<span style="float: right;" class="badge badge-warning">В работе</span>';
                break;
            }
            case 3: {
                stateWidget = '<span style="float: right;" class="badge badge-success">Успешно завершен</span>';
                break;
            }
            case 4: {
                stateWidget = '<span style="float: right;" class="badge badge-danger">Ошибка</span>';
                break;
            }
        }

        template += `
        <div class="panel panel-default">
            <div class="panel-heading">
                <span>${name}</span>
                <button data-sale-id="${sale.id}" type="button" class="deleteEntry btn btn-default btn-xs" style="float:right;">
                    <span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
                </button>
                ${stateWidget}
            </div>
            <div class="panel-body">
                <ul>
                    <li><a href="${sale.entry}">ссылка на товар</a></li>
                    <li><a href="${sale.current}">процесс</a></li>
                </ul>
                <div>до оформления заказа ${moment(sale.at).format(DATE_FORMAT)} (${beforeStart})</div>
                <div>до добавления в корзину ${moment(sale.atCart).format(DATE_FORMAT)} (${beforeStart2})</div>
            </div>
        </div>
        `
    })
    $('#saleTaskList').html(template);
    $('.deleteEntry').on('click', function(e){
        let id = $(this).data('sale-id');
        $.ajax({
            url: ENTRY_URL,
            method: "DELETE",
            headers: {
                "Accept": "application/json"
            },
            data: {id},
            success: function(data) {
                render();
            }
        })
    });
}