
var HttpRequest = require("nebulas").HttpRequest;
var Neb = require("nebulas").Neb;
var neb = new Neb();
//neb.setRequest(new HttpRequest("https://testnet.nebulas.io"));
neb.setRequest(new HttpRequest("http://127.0.0.1:8685"));

var NebPay = require("nebpay")
var nebPay = new NebPay();
var to = "n1jqghpg18veuEVGLYkeB9fmJX7Dz2dq8TE";

/**
 * 提交分数
 * @param name
 * @param time
 */
function save(name, time){
    $(".layer").fadeIn(400);
    var callArgs = "[\"" + name + "\",\"" + time + "\"]";
    nebPay.call(to, '0', 'save', callArgs, {
        listener: saveResult
    });
}

function saveResult(res) {
    console.log("return of rpc call resp: " + res);
    if (res) {
        var txhash = res.txhash;
        if(txhash) {
            testTransitionStatus(txhash, function () {
                $(".layer").fadeOut(400);
                getRank(res);
            });
        }
    }
}

function testTransitionStatus(txhash, callback){
    var timer = setInterval(function(){
        try {
            neb.api.getTransactionReceipt({hash: txhash}).then(function (res) {
                if (res.status === 1) {
                    clearInterval(timer)
                    if (callback) {
                        callback()
                    }
                    return;
                }
            });
        } catch (e) {

        }
    },1500)
}


/**
 * 获取榜单
 */
function getRank() {
    var callArgs = "[\"\"]";
    nebPay.simulateCall(to, '0', 'getRank', callArgs, { // simulateCall 执行 get 查询, 模拟执行.不发送交易,不上链
        listener: rankResult //指定回调函数
    });
}

/**
 * 排行榜
 * @param res
 */
function rankResult(res) {
    if(res){
        try {
            console.log(res);
            var array = JSON.parse(res.result);

            if (Array.isArray(array) && array.length > 0) {
                try {
                    var rankpage = '<div class="rank-page animated bounceInDown">\n' +
                        '        <table>\n' +
                        '            <thead>\n' +
                        '            <tr>\n' +
                        '                <th>排名</th>\n' +
                        '                <th>昵称</th>\n' +
                        '                <th>用时(s)</th>\n' +
                        '            </tr>\n' +
                        '            </thead>\n' +
                        '            <tbody>';

                    for (var i = 0; i < array.length; i++) {
                        var obj = array[i];
                        console.log("obj = " + obj);
                        rankpage += '<tr>\n' +
                            '                <td class="bg">' + (i+1) + '</td>\n' +
                            '                <td>' + obj.name + '</td>\n' +
                            '                <td>' + obj.time + '</td>\n' +
                            '            </tr>';
                    }
                    rankpage += '</tbody>\n' +
                        '        </table>\n' +
                        '        <a class="again" href="index.html">再来一局</a>' +
                        '    </div>';
                    $("#whole-wrap").html(rankpage);
                } catch (err) {
                    console.log("err: " + err);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
}

