"use strict";

/**
 * 合约
 * @constructor
 */
var MemoryMasterContract = function() {

    LocalContractStorage.defineMapProperty(this, "each", {
        parse: function(data) {
            return new Player(data);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
};

MemoryMasterContract.prototype = {
    init: function() {},

    /**
     * 上传玩家分数
     * @param name
     * @param time
     */
    save: function(name, time) {
        name = name.trim();
        time = time.trim();
        if (!name || !time) {
            throw new Error("call contract exception");
        }

        var from = Blockchain.transaction.from;
        console.log("from : " + from);
        var player = this.each.get(from);
        console.log("player : " + player);
        if (player) {
            var oldTime = player.time;
            if (parseInt(oldTime) > parseInt(time)) {
                player.time = time;
                player.name = name;
            }
        } else {
            player = new Player();
            player.name = name;
            player.address = from;
            player.time = time
            console.log("player : " + player);
        }
        this.each.put(from, player.toString());

        // 获取排行榜
        var rankList = LocalContractStorage.get("rank") || new Array();

        console.log("rankList: " + rankList);

        // 打榜
        var ranked = new Rank(rankList).add(player);

        LocalContractStorage.set("rank", rankList);

        return ranked;
    },

    /**
     * 获取榜单
     */
    getRank: function() {
        return LocalContractStorage.get("rank");
    }
};


/**
 * 玩家对象
 * @param data
 * @constructor
 */
var Player = function(data) {
    if (data) {
        var obj = JSON.parse(data);
        this.name = obj.name;
        this.address = obj.address;
        this.time = obj.time;
    }
};

Player.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

/**
 * 榜单对象
 * @param rankList
 * @constructor
 */
var Rank = function (rankList) {
    this.MAX_NUM = 10;
    this.rankList = rankList;
};

Rank.prototype = {

    /**
     * 新增
     * @return true 表示本次打榜成功
     * false 表示本次打榜失败
     */
    add: function (player) {
        var index = this._getMyHistoryDataIndexInRank(player.address);
        console.log("index = " + index);
        if (index !== undefined) {
            // 已入榜
            var oldTime = this.rankList[index].time;
            if (parseInt(oldTime) > parseInt(player.time)) {
                // 更新分数
                this.rankList[index].time = player.time;
                // 榜单重排
                this._resort();
                return true;
            } else {
                return false;
            }
        } else {
            this.rankList.push(player);
            this._resort(); // 榜单重排
            if (this.rankList.length > this.MAX_NUM) {
                this.rankList.length = this.MAX_NUM;
                return player.time >= this.rankList[this.MAX_NUM].time ? false : true;
            }
        }
    },

    /**
     * 榜单重排序
     * @private
     */
    _resort: function () {
        //榜单重排
        this.rankList.sort(function(o1, o2) {
            if (parseInt(o1.time) < parseInt(o2.time)) {
                return -1;
            } else if (parseInt(o1.time) > parseInt(o2.time)) {
                return 1;
            } else {
                return 0;
            }
        });
    },

    /**
     * 是否已入榜
     * @private
     */
    _getMyHistoryDataIndexInRank: function (from) {
        for (var i = 0; i < this.rankList.length; i++) {
            console.log("this.rankList[i].address = " + this.rankList[i].address);
            console.log("from = " + from);
            if (this.rankList[i].address === from) {
                return i;
            }
        }
        return undefined;
    }
};

module.exports = MemoryMasterContract;