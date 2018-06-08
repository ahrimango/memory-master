var dappAddress = "n1jqghpg18veuEVGLYkeB9fmJX7Dz2dq8TE";

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb();

var HttpRequest = nebulas.HttpRequest;

//neb.setRequest(new HttpRequest("https://testnet.nebulas.io"));
neb.setRequest(new HttpRequest("http://127.0.0.1:8685"));

var NebPay = require("nebpay")
var nebPay = new NebPay();

var serialNumber
//var callbackUrl = NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
//var callbackUrl = NebPay.config.testnetUrl;
var callbackUrl = "http://127.0.0.1:8685";

/**
 * 提交分数
 * @param name
 * @param time
 */
function save(name, time){
    $(".layer").fadeIn(400);
    var to = dappAddress;
    var value = "0";
    var callFunction = "save";
    var callArgs = "[\"" + name + "\",\"" + time + "\"]";

    serialNumber = nebPay.call(to, value, callFunction, callArgs, {    //使用nebpay的call接口去调用合约,
        listener: saveResult,       //设置listener, 处理交易返回信息
        callback: callbackUrl
    });

/*    nebPay.call(dappAddress, '0', 'save', callArgs, {
        listener: saveResult
    });*/

    intervalQuery = setInterval(function () {
        funcIntervalQuery();
    }, 5000);
}

var intervalQuery;

function funcIntervalQuery() {
    var options = {
        callback: callbackUrl
    };
    nebPay.queryPayInfo(serialNumber,options)   //search transaction result from server (result upload to server by app)
        .then(function (resp) {
            console.log("tx result: " + resp);  //resp is a JSON string
            var respObject = JSON.parse(resp);
            if(respObject.code === 0){
                clearInterval(intervalQuery);
                //alert(`set ${$("#search_value").val()} succeed!`);
                $(".layer").fadeOut(400);
                getRank(resp);
            }
        })
        .catch(function (err) {
            console.log(err);
        });
}


function saveResult(res) {
    console.log("return of rpc call resp: " + res);
    if (res) {
        var txhash = res.txhash;
        if(txhash) {
            testTransitionStatus(txhash, function () {
                clearInterval(intervalQuery);
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
            }).catch(function (err) {
                console.log(err);
            });
        } catch (e) {

        }
    },5000)
}


/**
 * 获取榜单
 */
function getRank() {

    var from = Account.NewAccount().getAddressString();
    var value = "0";
    var nonce = "0";
    var gas_price = "1000000";
    var gas_limit = "2000000";
    var callArgs = "[\"\"]";
    var callFunction = "getRank";
    var contract = {
        "function": callFunction,
        "args": callArgs
    };

    neb.api.call(from,dappAddress,value,nonce,gas_price,gas_limit,contract).then(function (resp) {
        rankResult(resp);
    }).catch(function (err) {
        console.log("error:" + err.message);
    })

/*    nebPay.simulateCall(to, '0', 'getRank', callArgs, { // simulateCall 执行 get 查询, 模拟执行.不发送交易,不上链
        listener: rankResult //指定回调函数
    });*/
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
                        '        <a class="again" href="index.html">我要上榜</a>' +
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

