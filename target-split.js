const vRequire23 = require("../config/db");
function f66(p1091, p1092) {
  const vF31 = f79();
  f66 = function (p1093, p1094) {
    p1093 = p1093 - 0;
    let v4 = vF31[p1093];
    if (f66.RYCoJt === undefined) {
      f66.Uwatmv = f67;
      p1091 = arguments;
      f66.RYCoJt = true;
    }
    const v946 = vF31[0];
    const v947 = p1093 + v946;
    const v948 = p1091[v947];
    if (!v948) {
      v4 = f66.Uwatmv(v4);
      p1091[v947] = v4;
    } else {
      v4 = v948;
    }
    return v4;
  };
  return f66(p1091, p1092);
}
undefined;
const vRequire24 = require("moment");
const v950 = vRequire23.sequelize;
const vRequire25 = require("colors");
const vRequire26 = require("../util/utils");
const vRequire27 = require("../util/utils");
const vRequire28 = require("../../../util_cus");
const vRequire29 = require("../../../config/log");
const vRequire30 = require("../util/status-code");
const {
  UPLOAD_TYPE,
  FLOW_TYPE,
  PROJECT_INFO,
  USER_INFO,
  WEBFUNNY_CONFIG_URI,
  PRODUCT_INFO_URI,
  MONITOR_LOCAL_SERVER,
  EVENT_LOCAL_SERVER
} = require("../config/consts");
const vRequire31 = require("node-fetch");
const vRequire32 = require("jsonwebtoken");
const vRequire33 = require("../config/secret");
const vRequire34 = require("node-xlsx");
const fs = require("fs");
const vRequire35 = require("nodemailer");
const vRequire36 = require("formidable");
const vRequire37 = require("../config/AccountConfig");
const vRequire38 = require("child_process");
const vRequire39 = require("getmac");
const ip2 = require("ip");
const vRequire40 = require("systeminformation");
const {
  spawn,
  exec,
  execFile
} = require("child_process");
const {
  accountInfo
} = vRequire37;
const {
  feiShuConfig,
  idsConfig
} = require("../../../sso");
const vRequire41 = require("../config/consts");
const {
  PROJECT_API,
  LOCAL_SERVER,
  ALARM_INDEX_ENUM
} = vRequire41;
const v951 = {
  monitor: "监控",
  event: "埋点"
};
const vRequire42 = require("../../../alarm/dingding");
const vRequire43 = require("../../../alarm/feishu");
const vRequire44 = require("../../../alarm/weixin");
const {
  UserTokenModel,
  AlarmItemModel,
  AlarmRuleModel,
  ApplicationConfigModel,
  CommonTableModel,
  AlarmTriggerModel,
  CompanyModel,
  ConfigModel,
  FlowDataInfoByDayModel,
  FlowDataInfoByHourModel,
  MenuPermissionsModel,
  MessageModel,
  NoticeTemplateModel,
  NoticeSettingModel,
  OrderInfoModel,
  ProductModel,
  TeamModel,
  TriggerConditionModel,
  UserModel
} = require("../modules/models.js");
function f74(p1125, p1126) {
  const vF312 = f79();
  f74 = function (p1127, p1128) {
    p1127 = p1127 - 0;
    let v952 = vF312[p1127];
    if (f74.VePTDI === undefined) {
      function f75(p1129) {
        const v953 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
        let v954 = "";
        let v955 = "";
        for (let v956 = 0, v957, v958, v959 = 0; v958 = p1129.charAt(v959++); ~v958 && (v957 = v956 % 4 ? v957 * 64 + v958 : v958, v956++ % 4) ? v954 += String.fromCharCode(v957 >> (v956 * -2 & 6) & 255) : 0) {
          v958 = v953.indexOf(v958);
        }
        for (let v960 = 0, v961 = v954.length; v960 < v961; v960++) {
          v955 += "%" + ("00" + v954.charCodeAt(v960).toString(16)).slice(-2);
        }
        return decodeURIComponent(v955);
      }
      const vF = function (p1130, p1131) {
        let v962 = [];
        let v963 = 0;
        let v964;
        let v965 = "";
        p1130 = f75(p1130);
        let v966;
        for (v966 = 0; v966 < 256; v966++) {
          v962[v966] = v966;
        }
        for (v966 = 0; v966 < 256; v966++) {
          v963 = (v963 + v962[v966] + p1131.charCodeAt(v966 % p1131.length)) % 256;
          v964 = v962[v966];
          v962[v966] = v962[v963];
          v962[v963] = v964;
        }
        v966 = 0;
        v963 = 0;
        for (let v967 = 0; v967 < p1130.length; v967++) {
          v966 = (v966 + 1) % 256;
          v963 = (v963 + v962[v966]) % 256;
          v964 = v962[v966];
          v962[v966] = v962[v963];
          v962[v963] = v964;
          v965 += String.fromCharCode(p1130.charCodeAt(v967) ^ v962[(v962[v966] + v962[v963]) % 256]);
        }
        return v965;
      };
      f74.fkhFZW = vF;
      p1125 = arguments;
      f74.VePTDI = true;
    }
    const v968 = vF312[0];
    const v969 = p1127 + v968;
    const v970 = p1125[v969];
    if (!v970) {
      if (f74.XldlMP === undefined) {
        f74.XldlMP = true;
      }
      v952 = f74.fkhFZW(v952, p1128);
      p1125[v969] = v952;
    } else {
      v952 = v970;
    }
    return v952;
  };
  return f74(p1125, p1126);
}
undefined;
class C20 {
  static async create(p1136) {
    let v972 = p1136.request.body;
    if (v972.title && v972.author && v972.content && v972.category) {
      let v973 = await UserTokenModel.createUserToken(v972);
      let v974 = await UserTokenModel.getUserTokenDetail(v973.id);
      p1136.response.status = 200;
      p1136.body = vRequire30.SUCCESS_200("创建信息成功", v974);
    } else {
      p1136.response.status = 412;
      p1136.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async getAllTokens() {
    const v975 = await UserTokenModel.getAllTokens();
    return v975;
  }
  static async getUserTokenDetailByToken(p1137) {
    const v976 = await UserTokenModel.getUserTokenDetailByToken(p1137);
    return v976;
  }
  static async ["getUserTokenFromNetworkByToken"](p1138) {
    const v977 = {
      MzZiH: "创建信息成功"
    };
    let v978 = p1138.request.body;
    const v979 = await UserTokenModel.getUserTokenDetailByToken(v978.token);
    p1138.response.status = 200;
    p1138.body = vRequire30.SUCCESS_200(v977.MzZiH, v979);
  }
  static async checkToken(p1139) {
    const v980 = {
      cZFsZ: function (p1140, p1141) {
        return p1140 ^ p1141;
      },
      wmIlh: function (p1142, p1143) {
        return p1142 ^ p1143;
      }
    };
    p1139.response.status = v980.cZFsZ(197153, 197353);
    p1139.body = vRequire30.SUCCESS_200("Token验证通过！", v980.wmIlh(963480, 963480));
  }
}
class C21 {
  static async getAlarmCountOverview(p1149) {
    const v981 = {
      XgRDk: "count()",
      RuOOz: function (p1150, p1151) {
        return p1150(p1151);
      }
    };
    const {
      companyId: _0x2f1e90
    } = p1149.user;
    const v982 = await AlarmTriggerModel.getTotalHighCount(_0x2f1e90);
    const v983 = await AlarmTriggerModel.getTotalMediumCount(_0x2f1e90);
    const v984 = await AlarmTriggerModel.getTotalLowCount(_0x2f1e90);
    const vNumber5 = Number(v982[0][v981.XgRDk]);
    const v985 = v981.RuOOz(Number, v983[0]["count()"]);
    const vNumber6 = Number(v984[0][v981.XgRDk]);
    const v986 = vNumber5 + v985 + vNumber6;
    p1149.response.status = 200;
    p1149.body = vRequire30.SUCCESS_200("查询成功", {
      highCount: vNumber5,
      mediumCount: v985,
      lowCount: vNumber6,
      total: v986
    });
  }
  static async getOverviewTrend(p1152) {
    const v987 = {
      Gsmke: function (p1153, p1154) {
        return p1153(p1154);
      },
      MpkGS: "YYYY-MM-DD",
      bwGus: function (p1155, p1156) {
        return p1155 ^ p1156;
      },
      hEmjM: function (p1157, p1158) {
        return p1157 ^ p1158;
      }
    };
    const {
      startTime: _0x577593,
      endTime: _0xd1c4e5
    } = JSON.parse(p1152.request.body);
    const {
      companyId: _0x3ca45a
    } = p1152.user;
    const v988 = vRequire24(_0xd1c4e5).diff(v987.Gsmke(vRequire24, _0x577593), "days");
    const v989 = new Map();
    const v990 = {
      highTrend: [[], []],
      mediumTrend: [[], []],
      lowTrend: [[], []]
    };
    const v991 = await AlarmTriggerModel.getAlarmTrendByDay(_0x577593, _0xd1c4e5, _0x3ca45a);
    for (let vV988 = v988; vV988 >= 0; vV988--) {
      const v992 = v987.Gsmke(vRequire24, _0xd1c4e5).subtract(vV988, "days").format(v987.MpkGS);
      v990.lowTrend[0].push(v992);
      v990.mediumTrend[0].push(v992);
      v990.highTrend[0].push(v992);
      const v993 = v991.filter(p1159 => p1159.day === v992 && p1159.ruleLevel === 1);
      const v994 = v991.filter(p1160 => p1160.day === v992 && p1160.ruleLevel === 2);
      const v995 = v991.filter(p1161 => p1161.day === v992 && p1161.ruleLevel === 3);
      if (v993 && v993.length) {
        v990.lowTrend[1].push(v993[0].count);
      } else {
        v990.lowTrend[v987.bwGus(564940, 564941)].push(0);
      }
      if (v994 && v994.length) {
        v990.mediumTrend[1].push(v994[0].count);
      } else {
        v990.mediumTrend[v987.hEmjM(594071, 594070)].push(0);
      }
      if (v995 && v995.length) {
        v990.highTrend[1].push(v995[0].count);
      } else {
        v990.highTrend[1].push(0);
      }
    }
    p1152.response.status = 200;
    p1152.body = vRequire30.SUCCESS_200("查询成功", v990);
  }
  static async ["getAlarmLatestTop10"](p1162) {
    const v996 = {
      CLIgW: "查询成功"
    };
    const {
      companyId: _0x32c7c0
    } = p1162.user;
    const v997 = await AlarmTriggerModel.getLatest10AlarmTrigger(_0x32c7c0);
    const v998 = [];
    for (const v999 of v997) {
      const {
        alarmContent: _0x4b80e7,
        triggerTime: _0x405816,
        dataId: _0x31c42b,
        ruleLevel: _0x5aee60,
        application: _0x41142b
      } = v999;
      const v1000 = {
        content: _0x4b80e7,
        application: _0x41142b,
        level: _0x5aee60,
        happenTime: _0x405816,
        id: _0x31c42b
      };
      v998.push(v1000);
    }
    p1162.response.status = 200;
    p1162.body = vRequire30.SUCCESS_200(v996.CLIgW, v998);
  }
  static async getAlarmApplicationTop10(p1163) {
    const v1001 = {
      ApCfS: function (p1164, p1165) {
        return p1164 ^ p1165;
      },
      ieYiT: function (p1166, p1167) {
        return p1166 ^ p1167;
      },
      HRCTz: function (p1168, p1169) {
        return p1168 ^ p1169;
      },
      UqVwA: function (p1170, p1171) {
        return p1170 ^ p1171;
      },
      ofDSU: function (p1172, p1173) {
        return p1172 + p1173;
      },
      tgOuD: "mediumCount",
      ccPmx: function (p1174, p1175) {
        return p1174 ^ p1175;
      },
      ucxDY: "total",
      zrfDU: "查询成功"
    };
    const {
      companyId: _0x3b1ff0
    } = p1163.user;
    const v1002 = await AlarmTriggerModel.getAlarmTriggerRuleAndApplication(_0x3b1ff0);
    const v1003 = new Map();
    for (const v1004 of v1002) {
      const {
        application: _0x2edade,
        ruleLevel: _0x636119
      } = v1004;
      const v1005 = v1003.get(_0x2edade);
      switch (_0x636119) {
        case 1:
          {
            if (!v1005) {
              v1003.set(_0x2edade, {
                lowCount: 1
              });
            } else {
              const {
                lowCount: _0x59cd04
              } = v1005;
              v1003.set(_0x2edade, {
                ...v1005,
                lowCount: _0x59cd04 ? _0x59cd04 + v1001.ApCfS(118660, 118661) : v1001.ieYiT(397597, 397596)
              });
            }
            break;
          }
        case 2:
          {
            if (!v1005) {
              v1003.set(_0x2edade, {
                mediumCount: 1
              });
            } else {
              const {
                mediumCount: _0x4e2490
              } = v1005;
              v1003.set(_0x2edade, {
                ...v1005,
                mediumCount: _0x4e2490 ? _0x4e2490 + 1 : 1
              });
            }
            break;
          }
        case 3:
          {
            if (!v1005) {
              v1003.set(_0x2edade, {
                highCount: 1
              });
            } else {
              const {
                highCount: _0x1d3eae
              } = v1005;
              v1003.set(_0x2edade, {
                ...v1005,
                highCount: _0x1d3eae ? _0x1d3eae + v1001.HRCTz(589344, 589345) : 1
              });
            }
          }
      }
    }
    for (const v1006 of v1003.entries()) {
      const v1007 = v1006[1];
      let {
        lowCount: _0x1b804c,
        mediumCount: _0x2ab1eb,
        highCount: _0x5c303a
      } = v1007;
      _0x1b804c = _0x1b804c ? _0x1b804c : 0;
      _0x2ab1eb = _0x2ab1eb ? _0x2ab1eb : v1001.UqVwA(488155, 488155);
      _0x5c303a = _0x5c303a ? _0x5c303a : 0;
      const v1008 = v1001.ofDSU(_0x1b804c, _0x2ab1eb) + _0x5c303a;
      v1007.total = v1008;
      v1003.set(v1006[0], v1007);
    }
    const v1009 = [];
    for (const v1010 of v1003.entries()) {
      const v1011 = {
        application: v1010[0],
        highCount: v1010[1].highCount,
        mediumCount: v1010[1][v1001.tgOuD],
        lowCount: v1010[v1001.ccPmx(211560, 211561)].lowCount,
        total: v1010[v1001.ccPmx(382703, 382702)][v1001.ucxDY]
      };
      v1009.push(v1011);
    }
    p1163.response.status = 200;
    p1163.body = vRequire30.SUCCESS_200(v1001.zrfDU, v1009);
  }
}
class C22 {
  static ["alarmCycleCountMap"] = new Map();
  static ["AlarmIndexEnum"] = {
    pvCount: "\u8BBF\u95EE\u91CF",
    uvCount: "\u8BBF\u95EE\u4EBA\u6570",
    healthScore: "\u5065\u5EB7\u5206",
    jsErrorCount: "\u4EE3\u7801\u9519\u8BEF\u91CF",
    jsErrorPer: "\u4EE3\u7801\u9519\u8BEF\u7387",
    consoleErrorCount: "\u81EA\u5B9A\u4E49\u9519\u8BEF\u91CF",
    consoleErrorPer: "\u81EA\u5B9A\u4E49\u9519\u8BEF\u7387",
    resourceErrorCount: "\u9759\u6001\u8D44\u6E90\u9519\u8BEF\u91CF",
    resourceErrorPer: "\u9759\u6001\u8D44\u6E90\u9519\u8BEF\u7387",
    httpErrorCount: "\u63A5\u53E3\u9519\u8BEF\u91CF",
    httpErrorPer: "\u63A5\u53E3\u9519\u8BEF\u7387"
  };
  static async getAlarmList(p1176) {
    const v1012 = {
      qhmTq: function (p1177, p1178) {
        return p1177 < p1178;
      },
      oxFmd: function (p1179, p1180) {
        return p1179 - p1180;
      },
      szpga: function (p1181, p1182) {
        return p1181 * p1182;
      },
      zxZpc: function (p1183, p1184) {
        return p1183 ^ p1184;
      },
      MLTIP: function (p1185, p1186) {
        return p1185 ^ p1186;
      }
    };
    let v1013 = vRequire26.parseQs(p1176.request.url);
    const {
      page = 1,
      pageSize = 10,
      applicationId: _0xe784c8,
      level: _0x2ad8c5,
      keyword: _0x52dc3a,
      status: _0x34f72a
    } = v1013;
    const {
      userId: _0x2d460c,
      userType: _0x52fac6,
      companyId: _0x31bdd0
    } = p1176.user;
    const v1014 = await AlarmItemModel.getAlarmItemDetails(_0x31bdd0, _0x2ad8c5, _0x52dc3a, page, pageSize);
    const v1015 = await UserModel.getUserList();
    const v1016 = await TeamModel.getTeamList(_0x2d460c, _0x52fac6, _0x31bdd0);
    const v1017 = await vRequire26.ajaxInside("get", "" + MONITOR_LOCAL_SERVER + PROJECT_API.GET_PROJECT_LIST_ALL);
    const v1018 = v1017.data;
    for (let v1019 = 0; v1012.qhmTq(v1019, v1014.length); v1019++) {
      const v1020 = v1014[v1019];
      const v1021 = v1018.filter(p1187 => p1187.webMonitorId === v1020.applicationId);
      if (v1021 && v1021.length) {
        v1020.application = v1021[0].projectName;
      } else {
        v1020.application = "unknown";
      }
      const v1022 = await TriggerConditionModel.getTriggerConditionsById(v1020.ruleId);
      v1020.triggerConditions = v1022;
      const v1023 = await AlarmTriggerModel.getAlarmItemTrendForMinutes(20, v1020.id);
      const v1024 = [];
      for (let v1025 = 0; v1025 < 20; v1025++) {
        const v1026 = new Date(v1012.oxFmd(new Date().getTime(), v1012.szpga(v1025 * 60, 1000))).Format("yyyy-MM-dd hh:mm");
        const v1027 = v1023.filter(p1188 => p1188.minutes === v1026);
        if (v1027 && v1027.length) {
          v1024.push(v1027[0].count);
        } else {
          v1024.push(0);
        }
      }
      v1020.trendArray = v1024.reverse();
      const v1028 = await AlarmTriggerModel.getNewestAlarmItem(v1020.applicationId, v1020.ruleId);
      if (v1028 && v1028.length) {
        const v1029 = v1028[v1012.zxZpc(215606, 215606)];
        v1020.happenTime = v1029.triggerTime;
      }
      const v1030 = await NoticeSettingModel.getNoticeSettingsById(v1020.noticeId);
      for (const v1031 of v1030) {
        const {
          noticePeopleId: _0x506a50,
          noticeTeamId: _0x37c547
        } = v1031;
        const v1032 = v1015.find(p1189 => p1189.userId === _0x506a50)?.nickname;
        const v1033 = v1016.find(p1190 => p1190.companyId === _0x37c547)?.teamName;
        v1031.noticePeopleName = v1032;
        v1031.noticeTeamName = v1033;
      }
      v1020.notice = v1030;
      if (v1020.ruleStatus === 0) {
        v1020.status = -1;
      }
    }
    const v1034 = await AlarmItemModel.countAlarmItem(_0x31bdd0);
    const v1035 = v1034 && v1034.length ? v1034[v1012.zxZpc(846112, 846112)].count * v1012.MLTIP(916632, 916633) : 0;
    p1176.response.status = 200;
    p1176.body = vRequire30.SUCCESS_200("查询成功", {
      alarmListResults: v1014,
      total: v1035
    });
  }
  static async getAlarmHistory(p1191) {
    const v1036 = {
      GBNcl: "查询成功"
    };
    const {
      startTime: _0x38843f,
      endTime: _0x4f8cd6,
      id: _0x597b0f
    } = JSON.parse(p1191.request.body);
    const v1037 = await AlarmTriggerModel.getAlarmItemTrendByDay(_0x38843f, _0x4f8cd6, _0x597b0f);
    const v1038 = vRequire26.handleDateResult(v1037, 30);
    p1191.response.status = 200;
    p1191.body = vRequire30.SUCCESS_200(v1036.GBNcl, v1038);
  }
  static async getAlarmTriggerListBySize(p1192) {
    const v1039 = {
      hgqeM: "查询成功"
    };
    const {
      webMonitorId: _0x15fb4f,
      size = 3
    } = p1192.request.body;
    const v1040 = await AlarmTriggerModel.getAlarmTriggerListBySize(_0x15fb4f, size);
    p1192.response.status = 200;
    p1192.body = vRequire30.SUCCESS_200(v1039.hgqeM, v1040);
  }
  static async convergenceAlarm({
    alarmContent: _0x36a5e7,
    ruleId: _0x6b7651,
    weekDay: _0x12f03b,
    curTime: _0x19d92c,
    projectName: _0x15e245,
    projectId: _0x372163,
    alarmTriggerId: _0x46d17a
  }) {
    const v1041 = {
      gCQie: function (p1193, p1194) {
        return p1193 ^ p1194;
      },
      oWQQP: function (p1195, p1196) {
        return p1195 ^ p1196;
      },
      zrOYl: "alarmCount",
      xDNEk: "seriousCount",
      jJrbP: "warningCount",
      OABvP: "triggerConditions",
      EHdDc: "infoCount",
      YqoAg: function (p1197, p1198) {
        return p1197 ^ p1198;
      }
    };
    const v1042 = _0x372163 + "-" + _0x6b7651;
    const v1043 = C22.alarmCycleCountMap.get(v1042);
    if (v1043.continuityCount === v1041.gCQie(731855, 731854) && v1043.alarmCount === v1041.oWQQP(546500, 546500)) {
      await C22.sendAlarm(_0x36a5e7, _0x6b7651, _0x12f03b, _0x19d92c, _0x15e245, _0x372163);
      await AlarmTriggerModel.updateAlarmTrigger(_0x46d17a, {
        pushStatus: 1
      });
      v1043.alarmCount += 1;
    } else if (v1043.continuityCount === Math.pow(2, v1043[v1041.zrOYl])) {
      await C22.sendAlarm(_0x36a5e7, _0x6b7651, _0x12f03b, _0x19d92c, _0x15e245, _0x372163);
      await AlarmTriggerModel.updateAlarmTrigger(_0x46d17a, {
        pushStatus: 1
      });
      v1043[v1041.zrOYl] += 1;
    }
    for (let v1044 = 0; v1044 < v1043.triggerConditions.length; ++v1044) {
      v1043.triggerConditions[v1044][v1041.xDNEk] = 0;
      v1043.triggerConditions[v1044][v1041.jJrbP] = 0;
      v1043[v1041.OABvP][v1044][v1041.EHdDc] = 0;
    }
    if (_0x19d92c === "00:00:01") {
      v1043.continuityCount = 0;
      v1043.alarmCount = v1041.YqoAg(895361, 895361);
    }
    C22.alarmCycleCountMap.set(v1042, v1043);
  }
  static async ["calculateAlarm"](p1199, p1200, p1201) {
    const v1045 = {
      TIMnC: function (p1202, p1203) {
        return p1202 ^ p1203;
      },
      Zbfqp: function (p1204, p1205) {
        return p1204 < p1205;
      },
      mWIpR: function (p1206, p1207) {
        return p1206 ^ p1207;
      },
      WtSgM: function (p1208, p1209) {
        return p1208 ^ p1209;
      },
      xdABI: "continuityCount",
      PgloT: function (p1210, p1211) {
        return p1210 === p1211;
      },
      TPYNL: function (p1212, p1213) {
        return p1212 ^ p1213;
      },
      WdyxO: function (p1214, p1215) {
        return p1214 ^ p1215;
      },
      PCJoY: function (p1216, p1217) {
        return p1216 * p1217;
      },
      cKvhN: "alarmCount",
      PkKyD: "triggerConditions",
      uGTxq: function (p1218, p1219) {
        return p1218 > p1219;
      },
      ldZap: function (p1220, p1221) {
        return p1220 > p1221;
      },
      DYSyR: function (p1222, p1223) {
        return p1222 >= p1223;
      },
      poSzv: function (p1224, p1225) {
        return p1224 ^ p1225;
      },
      XOAdv: function (p1226, p1227) {
        return p1226 + p1227;
      },
      fYuAy: function (p1228, p1229) {
        return p1228 * p1229;
      },
      CCyiL: function (p1230, p1231) {
        return p1230 ^ p1231;
      },
      mOzaY: "tempConditionRes2",
      KxhJq: function (p1232, p1233) {
        return p1232 ^ p1233;
      }
    };
    const v1046 = await AlarmItemModel.getAlarmItem();
    for (let v1047 = v1045.TIMnC(390971, 390971); v1045.Zbfqp(v1047, v1046.length); v1047++) {
      const v1048 = v1046[v1047];
      const {
        applicationId: _0x499c48,
        ruleId: _0x4baba7,
        alarmStatus: _0x1e58f7,
        latestHappen: _0xd31aae,
        id: _0x14784e,
        companyId: _0x48b66d
      } = v1048;
      const v1049 = await vRequire26.ajaxInside("post", "" + MONITOR_LOCAL_SERVER + PROJECT_API.MONITOR_PROJECT_SIMPLE_LIST_BY_WEBMONITOR_IDS, {
        webMonitorIds: _0x499c48
      });
      const v1050 = v1049.data;
      if (v1050 && v1050.length === 0) {
        continue;
      }
      const v1051 = v1050[v1045.mWIpR(701680, 701680)];
      const {
        projectName: _0x291f59
      } = v1051;
      const v1052 = await AlarmRuleModel.getAlarmRuleByRuleId(_0x4baba7);
      const v1053 = await NoticeTemplateModel.getNoticeTemplateById(v1052.relatedNoticeId);
      const v1054 = v1053 && v1053.length ? v1053[v1045.WtSgM(481083, 481083)] : {};
      const {
        alarmLevel: _0x5091ab,
        alarmContent: _0x315577,
        status: _0x1e1a0d
      } = v1052;
      if (!_0x1e1a0d) {
        const v1055 = C22.alarmCycleCountMap.get(_0x499c48 + "-" + _0x4baba7);
        if (v1055 && v1055[v1045.xdABI]) {
          v1055.continuityCount = 0;
        }
        if (v1055 && v1055.alarmCount) {
          v1055.alarmCount = 0;
        }
        continue;
      }
      const v1056 = await TriggerConditionModel.getTriggerConditionsById(_0x4baba7);
      const {
        conditionMeetWay: _0x2a48e9,
        timeInterval: _0x1476f5,
        statCycle: _0x597696
      } = v1056[0];
      const v1057 = p1201.substring(3, 5) * 1;
      if (!v1045.PgloT(v1057 % _0x597696, 0)) {
        console.log("时间不符合计算周期，跳过", v1057, _0x597696);
        continue;
      }
      const v1058 = vRequire26.getUuid();
      if (_0x2a48e9 === v1045.WtSgM(398519, 398518)) {
        const v1059 = v1056.length;
        let v1060 = 0;
        for (let v1061 = 0; v1061 < v1059; ++v1061) {
          const v1062 = await C22.checkIfTriggerCondition(v1056, v1061, p1199, _0x499c48, _0x4baba7);
          console.log("tempConditionRes", v1062);
          const {
            resultFlag: _0x190528,
            durationComplete: _0x56c820
          } = v1062;
          if (_0x56c820 === false) {
            console.log("未满计算周期，跳过");
            break;
          }
          if (_0x190528) {
            v1060++;
          }
        }
        const v1063 = C22.alarmCycleCountMap.get(_0x499c48 + "-" + _0x4baba7);
        if (!v1063.continuityCount) {
          v1063.continuityCount = 0;
        }
        if (!v1063.alarmCount) {
          v1063.alarmCount = v1045.TPYNL(978750, 978750);
        }
        console.log("触发条件判断：", v1060, v1059, v1060 !== v1059, _0x1e58f7);
        if (v1060 !== v1059) {
          if (v1045.PgloT(_0x1e58f7 * v1045.WdyxO(387637, 387636), 2)) {
            continue;
          }
          if (v1054.noticeType.indexOf("2") !== -1) {
            await C22.sendAlarm("【告警已恢复】" + _0x315577 + ("已连续告警 " + v1045.PCJoY(v1063.alarmCount, v1045.TIMnC(174476, 174477)) + " 次;"), _0x4baba7, p1200, p1201, _0x291f59, _0x499c48);
          }
          await AlarmItemModel.updateAlarmItem(_0x14784e, {
            alarmStatus: 2
          });
          v1063[v1045.xdABI] = 0;
          v1063[v1045.cKvhN] = 0;
          continue;
        }
        if (v1060 === v1059) {
          const v1064 = v1063[v1045.xdABI];
          v1063.continuityCount = v1064 + v1045.mWIpR(170120, 170121);
          await AlarmItemModel.updateAlarmItem(_0x14784e, {
            alarmStatus: 1
          });
        }
        const v1065 = vRequire24().format("YYYY-MM-DD HH:mm:ss");
        let v1066 = v1045.TIMnC(476191, 476186);
        for (let v1067 = 0; v1045.Zbfqp(v1067, v1063.triggerConditions.length); ++v1067) {
          const {
            seriousCount: _0x33ae16,
            warningCount: _0x2fa072,
            infoCount: _0x6ab5fd
          } = v1063[v1045.PkKyD][v1067];
          if (_0x33ae16 > 0) {
            v1066 = 1;
          } else if (v1045.uGTxq(_0x2fa072, 0) && v1066 >= 2) {
            v1066 = 2;
          } else if (v1045.ldZap(_0x6ab5fd, 0) && v1045.DYSyR(v1066, v1045.poSzv(258366, 258365))) {
            v1066 = 3;
          } else if (v1066 >= 4) {
            v1066 = 4;
          }
        }
        console.log("存储告警记录");
        await AlarmTriggerModel.createAlarmTrigger({
          dataId: v1058,
          companyId: _0x48b66d,
          alarmContent: _0x315577,
          pushStatus: 2,
          seriousLevel: v1066,
          triggerTime: v1065,
          ruleId: _0x4baba7,
          alarmItemId: _0x14784e,
          ruleLevel: _0x5091ab,
          applicationId: _0x499c48,
          application: _0x291f59
        });
        C22.convergenceAlarm({
          alarmContent: v1045.XOAdv(_0x315577, "已连续告警 " + (v1045.fYuAy(v1063.alarmCount, 1) + v1045.CCyiL(599253, 599252)) + " 次;"),
          ruleId: _0x4baba7,
          weekDay: p1200,
          curTime: p1201,
          projectName: _0x291f59,
          projectId: _0x499c48,
          alarmTriggerId: v1058
        });
      } else {
        let v1068 = false;
        let v1069 = -v1045.poSzv(494976, 494977);
        for (let v1070 = 0; v1070 < v1056.length; ++v1070) {
          const v1071 = await C22.checkIfTriggerCondition(v1056, v1070, p1199, _0x499c48, _0x4baba7);
          console.log(v1045.mOzaY, v1071);
          const {
            resultFlag: _0x3f98b5,
            durationComplete: _0x48899d
          } = v1071;
          if (_0x48899d === false) {
            console.log("未满计算周期，跳过2");
            continue;
          }
          if (_0x3f98b5) {
            v1068 = true;
            break;
          }
        }
        const v1072 = C22.alarmCycleCountMap.get(_0x499c48 + "-" + _0x4baba7);
        if (!v1072.continuityCount) {
          v1072.continuityCount = v1045.WdyxO(905121, 905121);
        }
        if (!v1072[v1045.cKvhN]) {
          v1072.alarmCount = 0;
        }
        if (!v1068) {
          if (v1054.noticeType.indexOf("2") !== -1 && v1072[v1045.cKvhN] > 0) {
            await C22.sendAlarm("【告警已恢复】" + _0x315577 + ("已连续告警 " + v1072.alarmCount + " 次;"), _0x4baba7, p1200, p1201, _0x291f59, _0x499c48);
          }
          await AlarmItemModel.updateAlarmItem(_0x14784e, {
            alarmStatus: 2
          });
          v1072[v1045.xdABI] = 0;
          v1072.alarmCount = 0;
          continue;
        }
        const v1073 = v1072.continuityCount;
        v1072.continuityCount = v1073 + 1;
        await AlarmItemModel.updateAlarmItem(_0x14784e, {
          alarmStatus: 1
        });
        const v1074 = vRequire24().format("YYYY-MM-DD HH:mm:ss");
        let v1075 = v1045.KxhJq(278091, 278094);
        await AlarmTriggerModel.createAlarmTrigger({
          dataId: v1058,
          companyId: _0x48b66d,
          alarmItemId: _0x14784e,
          alarmContent: _0x315577,
          pushStatus: 2,
          seriousLevel: v1075,
          triggerTime: v1074,
          ruleId: _0x4baba7,
          applicationId: _0x499c48,
          application: _0x291f59,
          ruleLevel: _0x5091ab
        });
        C22.convergenceAlarm({
          alarmContent: _0x315577 + ("已连续告警 " + (v1072.alarmCount * 1 + 1) + " 次;"),
          ruleId: _0x4baba7,
          weekDay: p1200,
          curTime: p1201,
          projectName: _0x291f59,
          projectId: _0x499c48,
          alarmTriggerId: v1058
        });
      }
    }
  }
  static async ["checkIfTriggerCondition"](p1234, p1235, p1236, p1237, p1238) {
    const v1076 = {
      SrtiC: function (p1239, p1240) {
        return p1239 !== p1240;
      },
      lJpzC: function (p1241, p1242) {
        return p1241 === p1242;
      },
      QPsJX: function (p1243, p1244) {
        return p1243 * p1244;
      },
      KsXXE: function (p1245, p1246) {
        return p1245 < p1246;
      },
      vNjzF: function (p1247, p1248) {
        return p1247 * p1248;
      },
      sBcFi: function (p1249, p1250) {
        return p1249 ^ p1250;
      },
      IzPwi: function (p1251, p1252) {
        return p1251 === p1252;
      },
      wgyFa: function (p1253, p1254) {
        return p1253 >= p1254;
      },
      mpBjv: function (p1255, p1256) {
        return p1255 >= p1256;
      },
      zcGgN: function (p1257, p1258) {
        return p1257 >= p1258;
      },
      DQsAz: function (p1259, p1260) {
        return p1259 < p1260;
      },
      eAfuU: "triggerConditions",
      GHmra: "seriousCount",
      fjQxf: function (p1261, p1262) {
        return p1261 ^ p1262;
      },
      VbHeo: "warningCount",
      OlkOF: "infoCount",
      eBwQN: function (p1263, p1264) {
        return p1263 + p1264;
      },
      tMkgC: function (p1265, p1266) {
        return p1265 + p1266;
      },
      RUycI: "effectCount"
    };
    let v1077 = false;
    let v1078 = false;
    const {
      statCycle: _0x2df06f,
      commonData: _0x52d57e,
      duration: _0x690387,
      timeInterval: _0x443452,
      alarmIndex: _0x5654d4,
      calculateType: _0xae1589,
      conditionSymbol: _0x341a72,
      seriousData: _0xdffd6a,
      warningData: _0x59e6d5,
      infoData: _0x30de69
    } = p1234[p1235];
    const v1079 = "avg";
    const v1080 = await vRequire26.ajaxInside("postJson", "" + MONITOR_LOCAL_SERVER + PROJECT_API.CHECK_ALARM_RESULT, {
      webMonitorId: p1237,
      alarmRule: {
        type: v1079,
        statCycle: _0x2df06f
      },
      type: _0x5654d4
    });
    const {
      data: _0x146a31
    } = v1080;
    let v1081 = 0;
    const v1082 = C22.alarmCycleCountMap.get(p1237 + "-" + p1238);
    if (v1076.SrtiC(_0x52d57e, undefined) && v1076.SrtiC(_0x52d57e, null)) {
      if (v1076.lJpzC(_0x341a72, "大于等于") && _0x146a31 * 1 >= v1076.QPsJX(_0x52d57e, 1) || _0x341a72 === "小于" && v1076.KsXXE(v1076.vNjzF(_0x146a31, v1076.sBcFi(644072, 644073)), v1076.vNjzF(_0x52d57e, 1))) {
        console.log("满足条件，开始记录！");
        if (!v1082) {
          v1081 = 1;
          if (v1076.IzPwi(_0x690387 * 1, 1)) {
            v1077 = true;
            v1078 = true;
            v1081 = 0;
          }
        } else {
          let {
            effectCount: _0x122a7f
          } = v1082.triggerConditions[p1235];
          if (!_0x122a7f) {
            _0x122a7f = 1;
          } else {
            _0x122a7f++;
          }
          if (v1076.wgyFa(_0x122a7f, _0x690387 * 1)) {
            v1077 = true;
            v1078 = true;
            console.log("满足触发周期，发起告警！连续性记录归零");
            v1081 = v1076.sBcFi(453391, 453391);
          } else {
            v1081 = _0x122a7f;
          }
        }
      } else {
        v1081 = 0;
        v1077 = false;
        v1078 = true;
      }
    } else {
      let v1083 = v1076.sBcFi(356007, 356007);
      let v1084 = 0;
      let v1085 = 0;
      if (_0x341a72 === "大于等于") {
        if (v1076.mpBjv(_0x146a31, _0xdffd6a)) {
          v1083++;
        } else if (v1076.wgyFa(_0x146a31, _0x59e6d5)) {
          v1084++;
        } else if (v1076.zcGgN(_0x146a31, _0x30de69)) {
          v1085++;
        }
      } else if (_0x341a72 === "小于") {
        if (_0x146a31 < _0xdffd6a) {
          v1083++;
        } else if (v1076.DQsAz(_0x146a31, _0x59e6d5)) {
          v1084++;
        } else if (_0x146a31 < _0x30de69) {
          v1085++;
        }
      }
      if (v1083 || v1084 || v1085) {
        if (!v1082) {
          v1081 = 1;
        } else {
          let {
            effectCount: _0x1e1448
          } = v1082[v1076.eAfuU][p1235];
          if (!_0x1e1448) {
            _0x1e1448 = 1;
          } else {
            _0x1e1448++;
          }
          if (_0x1e1448 >= _0x690387) {
            v1077 = true;
            v1078 = true;
            console.log("分级数据满足触发周期，发起告警！连续性记录归零");
            v1081 = 0;
          } else {
            v1081 = _0x1e1448;
          }
        }
      } else {
        v1081 = 0;
      }
      const v1086 = v1082?.triggerConditions?.[p1235]?.[v1076.GHmra] ? v1082?.["triggerConditions"]?.[p1235]?.["seriousCount"] : v1076.fjQxf(543174, 543174);
      const v1087 = v1082?.triggerConditions?.[p1235]?.warningCount ? v1082?.[v1076.eAfuU]?.[p1235]?.[v1076.VbHeo] : v1076.fjQxf(141006, 141006);
      const v1088 = v1082?.triggerConditions?.[p1235]?.[v1076.OlkOF] ? v1082?.["triggerConditions"]?.[p1235]?.infoCount : 0;
      p1234[p1235].seriousCount = v1086 + v1083;
      p1234[p1235][v1076.VbHeo] = v1076.eBwQN(v1087, v1084);
      p1234[p1235].infoCount = v1076.tMkgC(v1088, v1085);
    }
    if (!v1082) {
      p1234[p1235][v1076.RUycI] = v1081;
      C22.alarmCycleCountMap.set(p1237 + "-" + p1238, {
        triggerConditions: p1234
      });
    } else {
      const v1089 = "4|2|3|1|0".split("|");
      let v1090 = 0;
      while (true) {
        switch (v1089[v1090++]) {
          case "0":
            C22.alarmCycleCountMap.set(p1237 + "-" + p1238, {
              triggerConditions: p1234,
              ...v1082
            });
            continue;
          case "1":
            v1082.triggerConditions[p1235][v1076.OlkOF] = p1234[p1235][v1076.OlkOF];
            continue;
          case "2":
            v1082.triggerConditions[p1235].seriousCount = p1234[p1235][v1076.GHmra];
            continue;
          case "3":
            v1082.triggerConditions[p1235].warningCount = p1234[p1235].warningCount;
            continue;
          case "4":
            v1082[v1076.eAfuU][p1235][v1076.RUycI] = v1081;
            continue;
        }
        break;
      }
    }
    return {
      resultFlag: v1077,
      durationComplete: v1078
    };
  }
  static async sendAlarm(p1267, p1268, p1269, p1270, p1271, p1272, p1273) {
    const v1091 = {
      exHgj: function (p1274, p1275) {
        return p1274 === p1275;
      },
      spvoK: function (p1276, p1277) {
        return p1276 === p1277;
      },
      oyjKe: function (p1278, p1279) {
        return p1278 ^ p1279;
      },
      KdGUv: function (p1280, p1281) {
        return p1280 > p1281;
      },
      gGpia: function (p1282, p1283) {
        return p1282 > p1283;
      },
      mDPwR: "alarmIndex",
      lJRvC: function (p1284, p1285) {
        return p1284 > p1285;
      },
      DvvcH: function (p1286, p1287) {
        return p1286 > p1287;
      },
      egioq: "email",
      YGZOl: function (p1288, p1289) {
        return p1288 + p1289;
      },
      DLGao: "feishu",
      aDxto: "weixin"
    };
    const v1092 = await AlarmRuleModel.getAlarmRuleByRuleId(p1268);
    const {
      relatedNoticeId: _0x5383eb,
      ruleName: _0x4453ca
    } = v1092;
    const v1093 = await NoticeSettingModel.getNoticeSettingsById(_0x5383eb);
    let vP1267 = p1267;
    let v1094 = "";
    const v1095 = C22.alarmCycleCountMap.get(p1272 + "-" + p1268);
    if (!p1273) {
      for (let v1096 = v1091.oyjKe(829162, 829162); v1096 < v1095.triggerConditions.length; ++v1096) {
        const v1097 = v1095.triggerConditions[v1096];
        let {
          seriousCount: _0x3d6ea4,
          warningCount: _0x5cfd92,
          infoCount: _0x3a63b1,
          seriousData: _0x1323a0,
          warningData: _0x15063d,
          infoData: _0x28ab84,
          statCycle: _0x468f33,
          calculateType: _0x25b305,
          conditionSymbol: _0x3cb363,
          alarmIndex: _0x26d967,
          commonData: _0x93b6e4
        } = v1097;
        const v1098 = C22.AlarmIndexEnum[_0x26d967];
        if (_0x93b6e4) {
          vP1267 = vP1267.replace(new RegExp("\\{alarmName\\}", ""), _0x4453ca).replace(new RegExp("\\{urgency\\}", ""), v1098).replace(new RegExp("\\{threshold\\}", ""), _0x93b6e4).replace(new RegExp("\\{happenCount\\}", ""), _0x468f33);
        } else {
          while (v1091.KdGUv(_0x3d6ea4--, 0)) {
            v1094 += v1098 + "在统计周期" + _0x468f33 + "分钟内" + _0x25b305 + _0x3cb363 + _0x1323a0 + "，达到严重级别\n";
          }
          while (_0x5cfd92-- > 0) {
            v1094 += v1098 + "在统计周期" + _0x468f33 + "分钟内" + _0x25b305 + _0x3cb363 + _0x15063d + "，达到警告级别\n";
          }
          while (v1091.gGpia(_0x3a63b1--, 0)) {
            v1094 += v1098 + "在统计周期" + _0x468f33 + "分钟内" + _0x25b305 + _0x3cb363 + _0x28ab84 + "，达到提示级别\n";
          }
          if (v1094) {
            vP1267 = v1094;
          }
        }
      }
    } else {
      let {
        seriousCount: _0x564b2e,
        warningCount: _0x30238b,
        infoCount: _0x5060f3,
        seriousData: _0x104088,
        warningData: _0x291277,
        infoData: _0x1a0198,
        statCycle: _0x2b9463,
        calculateType: _0x14cdeb,
        conditionSymbol: _0x5ce581,
        alarmIndex: _0x1560a0,
        commonData: _0x38d97b
      } = p1273;
      const v1099 = C22.AlarmIndexEnum[_0x1560a0];
      if (_0x38d97b) {
        vP1267 = vP1267.replace(v1091.mDPwR, _0x4453ca);
      } else {
        while (_0x564b2e-- > 0) {
          v1094 += vP1267`${v1099}在统计周期${_0x2b9463}分钟内${_0x14cdeb}${_0x5ce581}${_0x104088}，达到严重级别\n`;
        }
        while (v1091.lJRvC(_0x30238b--, 0)) {
          v1094 += v1099 + "在统计周期" + _0x2b9463 + "分钟内" + _0x14cdeb + _0x5ce581 + _0x291277 + "，达到警告级别\n";
        }
        while (v1091.DvvcH(_0x5060f3--, 0)) {
          v1094 += v1099 + "在统计周期" + _0x2b9463 + "分钟内" + _0x14cdeb + _0x5ce581 + _0x1a0198 + "，达到提示级别\n";
        }
        vP1267 = v1094;
      }
    }
    for (const v1100 of v1093) {
      const {
        noticePeopleId: _0xf55d96,
        noticeTeamId: _0x5327a5,
        channel: _0x434a5b,
        cycle: _0x508507,
        slienceTime: _0x565d33
      } = v1100;
      let v1101 = [];
      let v1102 = [];
      if (_0x5327a5 && _0x5327a5 !== null) {
        const v1103 = await TeamModel.getTeamMemberIds(_0x5327a5);
        const {
          members: _0x42e55d
        } = v1103;
        for (const v1104 of _0x42e55d.split(",")) {
          const v1105 = await UserModel.getUserInfo(v1104);
          v1101.push(v1105);
        }
      }
      const v1106 = await UserModel.getUserListByMembers(_0xf55d96);
      if (v1106 && v1106.length) {
        v1101 = [...v1101, ...v1106];
        v1106.forEach(p1290 => {
          const v1107 = v1101.filter(p1291 => p1291.userId === p1290.userId);
          if (!v1107 || !v1107.length) {
            v1101.push(p1290);
          }
        });
        v1102 = [...v1106];
      }
      if (_0x565d33) {
        const v1108 = _0x565d33.split(",");
        const v1109 = [];
        for (const v1110 of v1108) {
          v1109.push(v1110.split("-"));
        }
        const v1111 = v1109.some(p1292 => vRequire24(p1270, "HH:mm:ss").isAfter(vRequire24(p1292[0], "HH:mm:ss")) && vRequire24(p1270, "HH:mm:ss").isBefore(vRequire24(p1292[1], "HH:mm:ss")));
        if (v1111) {
          continue;
        }
      }
      const v1112 = _0x508507.split(",");
      const v1113 = v1112.includes("" + p1269);
      if (!v1113) {
        continue;
      }
      const v1114 = JSON.parse(_0x434a5b);
      const {
        normal: _0x10a803,
        WebHook: _0x4cddba
      } = v1114;
      if (_0x10a803.indexOf(v1091.egioq) !== -1) {
        v1101.forEach(p1293 => {
          if (p1293.emailName) {
            vRequire28.sendEmail(p1293.emailName, _0x4453ca + " 告警！", vP1267);
          }
        });
      }
      if (_0x4cddba && _0x4cddba.way) {
        const {
          way: _0x376b40,
          callback: _0x2a7a23
        } = _0x4cddba;
        v1102.forEach(p1294 => {
          if (p1294.phone && v1091.exHgj(p1294.phone.length, 11) && v1091.spvoK(vRequire42.config.at.atMobiles.indexOf(p1294.phone), -1)) {
            vRequire42.config.at.atMobiles.push(p1294.phone);
            vRequire44.config.text.mentioned_mobile_list.push(p1294.phone);
          }
        });
        switch (_0x376b40) {
          case "dingding":
            vRequire42.config.text.content = v1091.YGZOl("【" + p1271 + "】", vP1267);
            await vRequire26.postJson(_0x2a7a23, vRequire42.config);
            break;
          case v1091.DLGao:
            vRequire43.config.content.text = "【" + p1271 + "】" + vP1267;
            await vRequire26.postJson(_0x2a7a23, vRequire43.config);
            break;
          case v1091.aDxto:
            vRequire44.config.text.content = "【" + p1271 + "】" + vP1267;
            await vRequire26.postJson(_0x2a7a23, vRequire44.config);
            break;
          default:
            break;
        }
      }
    }
  }
  static changeMap(p1295) {
    C22.alarmCycleCountMap.set("count", p1295);
  }
  static async getAlarmTriggerByAlarmId(p1301) {
    const v1115 = {
      yjcSg: function (p1302, p1303) {
        return p1302 ^ p1303;
      },
      JmCkv: function (p1304, p1305) {
        return p1304 * p1305;
      },
      SnqqC: function (p1306, p1307) {
        return p1306(p1307);
      },
      cKewR: function (p1308, p1309) {
        return p1308(p1309);
      }
    };
    let v1116 = JSON.parse(p1301.request.body);
    const {
      page = 1,
      pageSize = v1115.yjcSg(470282, 470272),
      id: _0x25fad0,
      curDate: _0x4a59f2,
      filters: _0x41e19
    } = v1116;
    let v1117 = v1115.JmCkv(v1115.SnqqC(Number, page) - 1, Number(pageSize));
    let v1118 = v1115.cKewR(Number, pageSize);
    const {
      status: _0x58bd83,
      level: _0x569001
    } = _0x41e19;
    let v1119;
    if (!_0x4a59f2) {
      v1119 = await AlarmTriggerModel.pageAlarmTrigger(v1117, v1118, _0x25fad0, _0x58bd83);
    } else {
      v1119 = await AlarmTriggerModel.pageAlarmTriggerWithCurDate(v1117, v1118, _0x25fad0, _0x4a59f2);
    }
    const v1120 = await AlarmTriggerModel.countAlarmTrigger(_0x25fad0, _0x58bd83);
    p1301.response.status = 200;
    p1301.body = vRequire30.SUCCESS_200("查询触发告警成功", {
      alarmTriggers: v1119,
      total: v1120.length
    });
  }
  static async getAlarmDetailById(p1310) {
    const v1121 = p1310.request.body;
    const {
      id: _0x7eba4
    } = v1121;
  }
}
class C23 {
  static async ["getAlarmRule"](p1311) {
    const v1122 = {
      uRRYD: function (p1312, p1313) {
        return p1312 === p1313;
      },
      IvTFU: function (p1314, p1315) {
        return p1314 ^ p1315;
      },
      LsMPv: function (p1316, p1317) {
        return p1316 === p1317;
      },
      BOENL: function (p1318, p1319) {
        return p1318 * p1319;
      },
      GwibK: function (p1320, p1321) {
        return p1320 ^ p1321;
      },
      jpVZk: "triggerConditions",
      NSKTy: "canNotDelete"
    };
    let v1123 = vRequire26.parseQs(p1311.request.url);
    const {
      page = 1,
      pageSize = 10,
      level: _0x4e5690,
      keyword: _0x5c3c2b
    } = v1123;
    let v1124;
    let v1125;
    if (v1122.uRRYD(page, -v1122.IvTFU(352354, 352355)) || v1122.LsMPv(pageSize, -v1122.IvTFU(738682, 738683))) {
      v1124 = 0;
      v1125 = 100000;
    } else {
      v1124 = (Number(page) - 1) * Number(pageSize);
      v1125 = Number(pageSize);
    }
    const {
      userId: _0x415ba2,
      userType: _0x33f72b,
      companyId: _0x38518a
    } = p1311.user;
    const v1126 = await AlarmRuleModel.pageAlarmRule(v1124, v1125, _0x38518a);
    const v1127 = await AlarmRuleModel.countAlarmRule(_0x38518a);
    const v1128 = v1127 && v1127.length ? v1122.BOENL(v1127[0].count, v1122.GwibK(864842, 864843)) : 0;
    const v1129 = await UserModel.getUserList();
    const v1130 = await TeamModel.getTeamList(_0x415ba2, _0x33f72b, _0x38518a);
    const v1131 = [];
    for (const v1132 of v1126) {
      const {
        relatedNoticeId: _0x37ee4e,
        ruleId: _0x539714,
        processorId: _0x301910,
        alarmLevel: _0x334219,
        ruleName: _0x4dc8d4
      } = v1132;
      if (_0x4e5690 && _0x334219 != _0x4e5690 || _0x5c3c2b && !_0x4dc8d4.includes(_0x5c3c2b)) {
        continue;
      }
      const v1133 = await TriggerConditionModel.getTriggerConditionsById(_0x539714);
      v1132[v1122.jpVZk] = v1133;
      const v1134 = await NoticeSettingModel.getNoticeSettingsById(_0x37ee4e);
      for (const v1135 of v1134) {
        const {
          noticePeopleId: _0x4c3bc5,
          noticeTeamId: _0x346374
        } = v1135;
        const v1136 = v1129.find(p1322 => p1322.userId === _0x4c3bc5)?.nickname;
        const v1137 = v1130.find(p1323 => p1323.companyId === _0x346374)?.teamName;
        v1135.noticePeopleName = v1136;
        v1135.noticeTeamName = v1137;
      }
      v1132.notice = v1134;
      const v1138 = v1129.find(p1324 => p1324.userId === _0x301910);
      const v1139 = v1138 ? v1138.nickname : "unknown";
      v1132.processorName = v1139;
      const v1140 = await NoticeTemplateModel.getNoticeTemplateById(_0x37ee4e);
      const v1141 = v1140[0];
      const {
        templateName: _0x5d6c2b
      } = v1141;
      v1132.templateName = _0x5d6c2b;
      const v1142 = await AlarmItemModel.getAlarmItemByRuleId(_0x539714);
      if (v1142.length > 0) {
        v1132[v1122.NSKTy] = true;
      }
      v1131.push(v1132);
    }
    p1311.response.status = 200;
    p1311.body = vRequire30.SUCCESS_200("查询成功", {
      alarmRules: v1131,
      total: v1128
    });
  }
  static async createAlarmRule(p1325) {
    const v1143 = {
      CUljh: "规则名称不能重复！",
      IKxcw: function (p1326) {
        return p1326();
      },
      QGhXK: "YYYY-MM-DD HH:mm:ss",
      kNmBt: function (p1327, p1328) {
        return p1327 ^ p1328;
      }
    };
    const {
      ruleName: _0x23e7f1,
      ruleDesc: _0xabe910,
      alarmLevel: _0x57861b,
      noticeTemplateId: _0x210177,
      suggestion: _0x2dc3ba,
      status: _0x550628,
      triggers: _0x50977c,
      visibleRange: _0x1a0f72,
      processorId: _0x244bad
    } = JSON.parse(p1325.request.body);
    const {
      companyId: _0x554df3,
      userId: _0x8bbb0a
    } = p1325.user;
    const v1144 = await AlarmRuleModel.getAlarmRuleByRuleName(_0x23e7f1);
    if (v1144 && v1144.length > 0) {
      p1325.response.status = 412;
      p1325.body = vRequire30.ERROR_412(v1143.CUljh, 0);
      return;
    }
    let v1145 = "";
    _0x50977c.forEach(p1329 => {
      v1145 += ALARM_INDEX_ENUM[p1329.alarmIndex] + "在" + p1329.statCycle + "分钟内，" + p1329.calculateType + p1329.conditionSymbol + p1329.commonData + "已经达到阈值，并且连续持续了" + p1329.statCycle + "个周期；";
    });
    let v1146 = "【" + _0x23e7f1 + "】告警；\n" + v1145 + "\n请相关人员及时处理！\n";
    const v1147 = vRequire26.getUuid();
    await AlarmRuleModel.createAlarmRule({
      companyId: _0x554df3,
      createUser: _0x8bbb0a,
      ruleId: v1147,
      ruleName: _0x23e7f1,
      ruleDesc: _0xabe910,
      alarmLevel: _0x57861b,
      suggestion: _0x2dc3ba,
      alarmContent: v1146,
      relatedNoticeId: _0x210177,
      status: _0x550628,
      lastModified: v1143.IKxcw(vRequire24).format(v1143.QGhXK),
      processorId: _0x244bad,
      visibleRange: _0x1a0f72
    });
    for (const v1148 of _0x50977c) {
      const {
        alarmIndex: _0xc8a609,
        statCycle: _0x59a756,
        calculateType: _0x123ac6,
        conditionSymbol: _0x39dd82,
        seriousData: _0x59ea93,
        warningData: _0x431761,
        infoData: _0x584bb6,
        commonData: _0x5a41bc,
        duration: _0x5062b1,
        interval: _0x1bfecf,
        conditionMeetWay: _0x4bc815
      } = v1148;
      TriggerConditionModel.createTriggerCondition({
        ruleId: v1147,
        alarmIndex: _0xc8a609,
        statCycle: _0x59a756,
        calculateType: _0x123ac6,
        conditionSymbol: _0x39dd82,
        seriousData: _0x59ea93,
        warningData: _0x431761,
        infoData: _0x584bb6,
        commonData: _0x5a41bc,
        duration: _0x5062b1,
        timeInterval: _0x1bfecf,
        conditionMeetWay: _0x4bc815
      });
    }
    p1325.response.status = v1143.kNmBt(689811, 689755);
    p1325.body = vRequire30.SUCCESS_200("创建规则成功", 0);
  }
  static async ["getAlarmRuleById"](p1330) {
    let v1149 = vRequire26.parseQs(p1330.request.url);
    const {
      id: _0x2aec57
    } = v1149;
    const v1150 = await AlarmRuleModel.getAlarmRuleById(_0x2aec57);
    const {
      ruleId: _0x1f9413,
      ruleName: _0x53b254,
      ruleDesc: _0x49bf79,
      suggestion: _0x533c07,
      alarmContent: _0x54e816,
      visibleRange: _0x586f2c,
      alarmLevel: _0x104b51,
      relatedNoticeId: _0x227db9,
      status: _0x44fd47
    } = v1150;
    const v1151 = await TriggerConditionModel.getTriggerConditionsById(_0x1f9413);
    const v1152 = {
      ruleName: _0x53b254,
      ruleDesc: _0x49bf79,
      id: _0x2aec57,
      suggestion: _0x533c07,
      alarmContent: _0x54e816,
      visibleRange: _0x586f2c,
      alarmLevel: _0x104b51,
      noticeTemplateId: _0x227db9,
      status: _0x44fd47,
      triggers: v1151
    };
    p1330.response.status = 200;
    p1330.body = vRequire30.SUCCESS_200("根据ID查询成功", v1152);
  }
  static async ["deleteAlarmRule"](p1331) {
    const v1153 = {
      MOaYp: "删除成功"
    };
    const {
      ruleId: _0xc48d4a
    } = JSON.parse(p1331.request.body);
    await AlarmRuleModel.deleteAlarmRule(_0xc48d4a);
    await TriggerConditionModel.deleteTriggerCondition(_0xc48d4a);
    p1331.response.status = 200;
    p1331.body = vRequire30.SUCCESS_200(v1153.MOaYp, 0);
  }
  static async ["updateAlarmRuleStatus"](p1332) {
    const v1154 = {
      OGTFU: function (p1333, p1334) {
        return p1333 ^ p1334;
      },
      pYNAM: "更新成功",
      AWopx: function (p1335, p1336) {
        return p1335 ^ p1336;
      }
    };
    const {
      status: _0x195cc7,
      id: _0x2d0173
    } = JSON.parse(p1332.request.body);
    await AlarmRuleModel.updateAlarmRule(_0x2d0173, {
      status: _0x195cc7
    });
    p1332.response.status = v1154.OGTFU(275276, 275332);
    p1332.body = vRequire30.SUCCESS_200(v1154.pYNAM, v1154.AWopx(411881, 411881));
  }
  static async ["updateAlarmRule"](p1337) {
    const v1155 = {
      iNdeM: function (p1338) {
        return p1338();
      }
    };
    const {
      ruleName: _0x21e21e,
      ruleDesc: _0x3fd2bb,
      visibleRange: _0x996047,
      alarmLevel: _0x31cf39,
      triggers: _0x2ae3bf,
      processorId: _0x19e0f2,
      status: _0x2806af,
      id: _0x1d8eb5,
      noticeTemplateId: _0x1def23,
      suggestion: _0x5d8d8b,
      ruleId: _0x519df6
    } = JSON.parse(p1337.request.body);
    let v1156 = "";
    _0x2ae3bf.forEach(p1339 => {
      v1156 += ALARM_INDEX_ENUM[p1339.alarmIndex] + "在" + p1339.statCycle + "分钟内，" + p1339.calculateType + p1339.conditionSymbol + p1339.commonData + "已经达到阈值，并且连续持续了" + p1339.duration + "个周期；";
    });
    let v1157 = "【" + _0x21e21e + "】告警；\n" + v1156 + "\n请相关人员及时处理！\n";
    await AlarmRuleModel.updateAlarmRule(_0x1d8eb5, {
      ruleName: _0x21e21e,
      ruleDesc: _0x3fd2bb,
      visibleRange: _0x996047,
      alarmLevel: _0x31cf39,
      processorId: _0x19e0f2,
      status: _0x2806af,
      relatedNoticeId: _0x1def23,
      alarmContent: v1157,
      suggestion: _0x5d8d8b,
      lastModified: v1155.iNdeM(vRequire24).format("YYYY-MM-DD HH:mm:ss")
    });
    await TriggerConditionModel.deleteTriggerCondition(_0x519df6);
    for (const v1158 of _0x2ae3bf) {
      const {
        alarmIndex: _0x30336d,
        statCycle: _0x8c40e7,
        calculateType: _0x4887c7,
        conditionSymbol: _0x275728,
        seriouData: _0x10c78c,
        warningData: _0x344b1d,
        infoData: _0x4f34d1,
        commonData: _0x2e6d26,
        duration: _0x4e2bd5,
        interval: _0x347bc6,
        conditionMeetWay: _0x4c6ec9
      } = v1158;
      TriggerConditionModel.createTriggerCondition({
        ruleId: _0x519df6,
        alarmIndex: _0x30336d,
        statCycle: _0x8c40e7,
        calculateType: _0x4887c7,
        conditionSymbol: _0x275728,
        seriouData: _0x10c78c,
        warningData: _0x344b1d,
        infoData: _0x4f34d1,
        commonData: _0x2e6d26,
        duration: _0x4e2bd5,
        timeInterval: _0x347bc6,
        conditionMeetWay: _0x4c6ec9
      });
    }
    p1337.response.status = 200;
    p1337.body = vRequire30.SUCCESS_200("更新成功", 0);
  }
  static async ["addRuleForApplication"](p1340) {
    const v1159 = {
      XmAeL: function (p1341) {
        return p1341();
      },
      IEJuV: "绑定规则成功"
    };
    let v1160 = {};
    if (typeof p1340.request.body === "object") {
      v1160 = p1340.request.body;
    } else {
      v1160 = JSON.parse(p1340.request.body);
    }
    const {
      companyId: _0x535431
    } = p1340.user;
    const {
      applicationId: _0x4973cb,
      ruleIds: _0x4ed514
    } = v1160;
    const v1161 = _0x4ed514.split(",");
    const v1162 = await AlarmItemModel.getRuleIds(_0x4973cb);
    const v1163 = v1162.map(p1342 => p1342.ruleId);
    for (const v1164 of v1163) {
      if (!v1161.includes(v1164)) {
        await AlarmItemModel.deleteAlarmItem(_0x4973cb, v1164);
      }
    }
    for (const v1165 of v1161) {
      if (!v1163.includes(v1165) && v1165) {
        await AlarmItemModel.createAlarmItem({
          companyId: _0x535431,
          applicationId: _0x4973cb,
          ruleId: v1165,
          alarmStatus: 1,
          latestHappen: v1159.XmAeL(vRequire24).format("YYYY-MM-DD HH:mm:ss")
        });
      }
    }
    p1340.response.status = 200;
    p1340.body = vRequire30.SUCCESS_200(v1159.IEJuV, 0);
  }
  static async ["getRulesOfApplication"](p1343) {
    const {
      applicationId: _0x39b831
    } = JSON.parse(p1343.request.body);
    const v1166 = await AlarmItemModel.getRuleIds(_0x39b831);
    const v1167 = v1166.map(p1344 => p1344.ruleId);
    const v1168 = [];
    for (const v1169 of v1167) {
      const v1170 = await AlarmRuleModel.getAlarmRuleByRuleId(v1169);
      const {
        ruleName: _0x34c649
      } = v1170;
      v1168.push(_0x34c649);
    }
    const v1171 = v1167.map((p1345, p1346) => ({
      ruleId: p1345,
      ruleName: v1168[p1346]
    }));
    p1343.response.status = 200;
    p1343.body = vRequire30.SUCCESS_200("获取规则成功", v1171);
  }
}
class C24 {
  static async ["createTable"](p1347 = 0) {
    const v1172 = vRequire26.addDays(p1347);
    const v1173 = v1172.substring(0, 4);
    CommonTableModel.createInfoTableByYear(v1173);
  }
  static async ["checkFreeLicense"]() {
    let v1174 = false;
    const v1175 = await vRequire26.postJson("" + MONITOR_LOCAL_SERVER + PROJECT_API.MONITOR_BASE_INFO, {}).catch(p1348 => {
      console.error(p1348);
    });
    const v1176 = await vRequire26.getJson("" + EVENT_LOCAL_SERVER + PROJECT_API.GET_EVENT_SYS_INFO, {}).catch(p1349 => {
      console.error(p1349);
    });
    const v1177 = v1175.data;
    const v1178 = v1176.data;
    if (v1177.totalProjectCount <= 3 && v1178.totalProjectCount <= 3) {
      v1174 = true;
    }
    return v1174;
  }
}
class C25 {
  static async ["getAlarmTrigger"](p1350) {
    const v1180 = {
      eoMHr: function (p1351, p1352) {
        return p1351 ^ p1352;
      },
      CRqPw: function (p1353, p1354) {
        return p1353 * p1354;
      }
    };
    let v1181 = vRequire26.parseQs(p1350.request.url);
    const {
      page = v1180.eoMHr(728823, 728822),
      pageSize = 10,
      noticeType: _0x53b90e,
      keywork: _0x5a34cc
    } = v1181;
    let v1182 = v1180.CRqPw(Number(page) - 1, Number(pageSize));
    let vNumber7 = Number(pageSize);
    const v1183 = await AlarmTriggerModel.pageAlarmRule(v1182, vNumber7);
    p1350.response.status = 200;
    p1350.body = vRequire30.SUCCESS_200("查询触发告警成功", v1183);
  }
}
class C26 {
  static async create(p1355) {
    const v1184 = {
      vshUK: function (p1356, p1357) {
        return p1356 ^ p1357;
      },
      zVyzx: "创建信息失败，请求参数不能为空！"
    };
    let v1185 = p1355.request.body;
    if (v1185.title && v1185.author && v1185.content && v1185.category) {
      let v1186 = await ApplicationConfigModel.createApplicationConfig(v1185);
      let v1187 = await ApplicationConfigModel.getApplicationConfigDetail(v1186.id);
      p1355.response.status = 200;
      p1355.body = vRequire30.SUCCESS_200("创建信息成功", v1187);
    } else {
      p1355.response.status = v1184.vshUK(830803, 830671);
      p1355.body = vRequire30.ERROR_412(v1184.zVyzx);
    }
  }
  static async updateSysConfigInfo(p1358) {
    let v1188 = JSON.parse(p1358.request.body);
    const {
      serverDomain: _0x177fff,
      adminDomain: _0x44a1c4,
      editType: _0x5099f3
    } = v1188;
    const v1189 = await ApplicationConfigModel.getApplicationConfigByConfigName(_0x5099f3);
    if (v1189 && v1189.length) {
      await ApplicationConfigModel.updateApplicationConfig(_0x5099f3, {
        configValue: JSON.stringify({
          serverDomain: _0x177fff,
          adminDomain: _0x44a1c4
        })
      });
    } else {
      await ApplicationConfigModel.createApplicationConfig({
        systemName: _0x5099f3,
        configValue: JSON.stringify({
          serverDomain: _0x177fff,
          adminDomain: _0x44a1c4
        })
      });
    }
    p1358.response.status = 200;
    p1358.body = vRequire30.SUCCESS_200("创建信息成功", 0);
  }
  static async setInitSysConfigInfo(p1359, p1360, p1361) {
    const v1190 = {
      gteAV: function (p1362, p1363) {
        return p1362 === p1363;
      }
    };
    const v1191 = await ApplicationConfigModel.getApplicationConfigByConfigName(p1361);
    if (v1191 && v1190.gteAV(v1191.length, 0)) {
      await ApplicationConfigModel.createApplicationConfig({
        systemName: p1361,
        configValue: JSON.stringify({
          serverDomain: p1359,
          adminDomain: p1360
        })
      });
    }
  }
  static async getSysConfigInfo(p1364) {
    const v1192 = {
      llHrV: "创建信息成功"
    };
    const {
      monitorServerDomain: _0x483917,
      monitorAssetsDomain: _0x395c8f,
      eventServerDomain: _0x3f774e,
      eventAssetsDomain: _0x47245f,
      emailNeeded: _0x56c32d,
      phoneNeeded: _0x46604e,
      activationRequired: _0x32fa8b,
      showEndTime: _0x2cf135
    } = accountInfo;
    const v1193 = {
      monitor: {
        serverDomain: _0x483917,
        adminDomain: _0x395c8f
      },
      event: {
        serverDomain: _0x3f774e,
        adminDomain: _0x47245f
      },
      emailNeeded: _0x56c32d,
      phoneNeeded: _0x46604e,
      activationRequired: _0x32fa8b,
      showEndTime: _0x2cf135
    };
    p1364.response.status = 200;
    p1364.body = vRequire30.SUCCESS_200(v1192.llHrV, v1193);
  }
  static async handleAllApplicationConfig() {
    const v1194 = await ApplicationConfigModel.getAllApplicationConfig();
    let v1195 = {};
    let v1196 = {};
    v1194.forEach(p1365 => {
      const v1197 = JSON.parse(p1365.configValue);
      switch (p1365.systemName) {
        case "monitor":
          v1195 = v1197;
          break;
        case "event":
          v1196 = v1197;
          break;
        default:
          break;
      }
    });
    return {
      monitor: v1195,
      event: v1196
    };
  }
  static async monitorBaseInfo(p1366) {
    const v1198 = await C26.handleAllApplicationConfig();
    const {
      monitor: _0xf70b81
    } = v1198;
    const v1199 = await vRequire26.ajaxInside("post", "" + LOCAL_SERVER + PROJECT_API.MONITOR_BASE_INFO, {});
    if (!v1199) {
      p1366.response.status = 412;
      p1366.body = vRequire30.ERROR_412("监控系统基本信息获取失败!");
    } else {
      p1366.response.status = 200;
      p1366.body = vRequire30.SUCCESS_200("success", v1199.data);
    }
  }
  static async ["eventBaseInfo"](p1367) {
    const v1200 = {
      UYooi: "监控系统基本信息获取失败!",
      uMXOQ: "success"
    };
    const v1201 = await C26.handleAllApplicationConfig();
    const {
      event: _0xc02e81
    } = v1201;
    const v1202 = await vRequire26.ajaxInside("post", "" + LOCAL_SERVER + PROJECT_API.EVENT_BASE_INFO, {});
    if (!v1202) {
      p1367.response.status = 412;
      p1367.body = vRequire30.ERROR_412(v1200.UYooi);
    } else {
      p1367.response.status = 200;
      p1367.body = vRequire30.SUCCESS_200(v1200.uMXOQ, v1202.data);
    }
  }
  static async getOtherAccessTokenWithCode(p1368) {
    const v1203 = {
      jjzBl: function (p1369, p1370) {
        return p1369 ^ p1370;
      },
      YzxqM: function (p1371, p1372) {
        return p1371 ^ p1372;
      },
      yDkrt: function (p1373, p1374) {
        return p1373 ^ p1374;
      },
      jeYJa: "no name",
      DREPV: function (p1375, p1376) {
        return p1375 || p1376;
      },
      yLWCD: function (p1377, p1378) {
        return p1377 ^ p1378;
      },
      vFkJi: function (p1379, p1380) {
        return p1379 ^ p1380;
      }
    };
    const {
      code: _0x5d5ae3
    } = JSON.parse(p1368.request.body);
    const {
      getTenantTokenConfig: _0x3de763,
      getUserInfoConfig: _0x390909
    } = feiShuConfig;
    const v1204 = {
      grant_type: "authorization_code",
      client_id: feiShuConfig.appId,
      client_secret: feiShuConfig.appSecret,
      redirect_uri: feiShuConfig.redirectUri,
      code: _0x5d5ae3
    };
    const v1205 = await vRequire26.postForm(_0x3de763.url, v1204).catch(p1381 => {
      p1368.response.status = 412;
      p1368.body = vRequire30.ERROR_412(p1381.msg, v1203.jjzBl(910827, 910827));
    });
    console.log(v1205);
    if (v1205 && v1205.code === 200) {
      const {
        access_token: _0xe05d81
      } = v1205.data;
      const v1206 = await vRequire26.postForm(_0x390909.url, {
        access_token: _0xe05d81
      }).catch(p1382 => {
        p1368.response.status = 412;
        p1368.body = vRequire30.ERROR_412(p1382.msg, v1203.jjzBl(555854, 555854));
      });
      console.log(v1206);
      if (v1206 && v1206.code === 200) {
        const {
          username = "",
          mobile = "",
          email = ""
        } = v1206.data;
        if (!mobile && !email) {
          p1368.response.status = v1203.YzxqM(654825, 654453);
          p1368.body = vRequire30.ERROR_412("登录失败，手机号和邮箱都为空！", v1203.yDkrt(558694, 558694));
          return;
        }
        const v1207 = await UserModel.checkUserByPhoneOrEmail(mobile, email);
        if (!v1207 || !v1207.length) {
          const v1208 = {
            companyId: "1",
            nickname: username || v1203.jeYJa,
            emailName: email || mobile,
            phone: v1203.DREPV(mobile, email),
            password: vRequire26.md5(vRequire26.getUuid()),
            userId: vRequire26.getUuid(),
            userType: "customer",
            registerStatus: 1,
            avatar: Math.floor(Math.random() * v1203.yLWCD(112355, 112357))
          };
          let v1209 = await UserModel.createUser(v1208);
          if (v1209 && v1209.id) {
            const v1210 = await C38.createSsoToken(mobile, email);
            if (v1210) {
              p1368.response.status = 200;
              p1368.body = vRequire30.SUCCESS_200("success", {
                accessToken: v1210
              });
            } else {
              p1368.response.status = v1203.vFkJi(663343, 663219);
              p1368.body = vRequire30.ERROR_412("登录失败，账号无效或不存在！", 0);
            }
          }
        }
      } else {
        console.log(v1206);
        vRequire29.printError("获取第三方用户信息失败（" + _0x390909.url + "）", v1206);
        p1368.response.status = 412;
        p1368.body = vRequire30.ERROR_412(v1205.msg, v1205.msg);
      }
    } else {
      console.log(v1205);
      vRequire29.printError("获取第三方token失败（" + _0x3de763.url + "）", v1205);
      p1368.response.status = 412;
      p1368.body = vRequire30.ERROR_412(v1205.msg, v1205.msg);
    }
  }
  static async getSignatureForFeiShu(p1383) {
    const v1211 = {
      NvXjX: " 接口报错 ：",
      pOPob: function (p1384, p1385) {
        return p1384 ^ p1385;
      },
      fHmts: function (p1386, p1387) {
        return p1386 ^ p1387;
      },
      SPwMq: "飞书配置项：",
      vVqjh: function (p1388, p1389) {
        return p1388 < p1389;
      },
      LvrHd: function (p1390, p1391) {
        return p1390 + p1391;
      },
      rmTcH: function (p1392, p1393) {
        return p1392 ^ p1393;
      },
      djpTJ: function (p1394, p1395) {
        return p1394 + p1395;
      },
      lIzsM: function (p1396, p1397) {
        return p1396 ^ p1397;
      },
      BlmlS: "success"
    };
    const {
      getAppTokenConfig: _0x479ef0,
      getJsTicketConfig: _0xf6378e,
      redirectUri: _0x41a598
    } = feiShuConfig;
    vRequire29.printInfo(v1211.SPwMq, JSON.stringify(feiShuConfig));
    const v1212 = {
      app_id: feiShuConfig.appId,
      app_secret: feiShuConfig.appSecret
    };
    const v1213 = global.centerInfo.ssoForFeiShu.appToken;
    let v1214 = false;
    if (v1213 && v1213.value) {
      if (v1211.vVqjh(new Date().getTime(), v1213.endTime)) {
        v1214 = true;
      }
    }
    let v1215 = "";
    if (!v1214) {
      vRequire29.printInfo(_0x479ef0.url + " 接口参数：", JSON.stringify(v1212));
      const v1216 = await vRequire26.postJson(_0x479ef0.url, v1212).catch(p1398 => {
        vRequire29.printInfo(_0x479ef0.url + v1211.NvXjX, p1398);
        p1383.response.status = v1211.pOPob(461112, 460964);
        p1383.body = vRequire30.ERROR_412(p1398.msg, v1211.pOPob(184738, 184738));
      });
      vRequire29.printInfo(_0x479ef0.url + " 接口结果：", JSON.stringify(v1216));
      if (v1216) {
        const {
          app_access_token: _0xf42205,
          expire: _0x1aedf5
        } = v1216;
        v1215 = _0xf42205;
        global.centerInfo.ssoForFeiShu.appToken = {
          value: v1215,
          endTime: v1211.LvrHd(new Date().getTime(), _0x1aedf5 * 1000)
        };
      }
    } else {
      v1215 = global.centerInfo.ssoForFeiShu.appToken.value;
    }
    if (!v1215) {
      p1383.response.status = 412;
      p1383.body = vRequire30.ERROR_412("token无效", v1211.rmTcH(281996, 281996));
      return;
    }
    const v1217 = {
      Authorization: "Bearer " + v1215,
      "Content-Type": "application/json"
    };
    const v1218 = global.centerInfo.ssoForFeiShu.ticket;
    let v1219 = false;
    if (v1218 && v1218.value) {
      if (new Date().getTime() < v1218.endTime) {
        v1219 = true;
      }
    }
    let v1220 = "";
    if (!v1219) {
      vRequire29.printInfo(_0xf6378e.url + " 接口参数（header）：", JSON.stringify(v1217));
      const v1221 = await vRequire26.get(_0xf6378e.url, {}, {
        customHead: v1217
      }).catch(p1399 => {
        vRequire29.printInfo(_0xf6378e.url + " 接口报错 ：", p1399);
        p1383.response.status = 412;
        p1383.body = vRequire30.ERROR_412(p1399.msg, v1211.fHmts(302161, 302161));
      });
      vRequire29.printInfo(_0xf6378e.url + " 接口结果：", JSON.stringify(v1221));
      if (v1221) {
        const {
          ticket: _0x34a847,
          expire_in: _0x2d9079
        } = v1221.data;
        v1220 = _0x34a847;
        global.centerInfo.ssoForFeiShu.ticket = {
          value: v1220,
          endTime: v1211.djpTJ(new Date().getTime(), _0x2d9079 * 1000)
        };
      }
    } else {
      v1220 = global.centerInfo.ssoForFeiShu.ticket.value;
    }
    if (!v1220) {
      p1383.response.status = 412;
      p1383.body = vRequire30.ERROR_412("ticket无效", v1211.lIzsM(387971, 387971));
      return;
    }
    const v1222 = vRequire26.getUuid().replace(new RegExp("-", "g"), "");
    const v1223 = new Date().getTime();
    const v_0x41a5982 = _0x41a598;
    const v1224 = "jsapi_ticket=" + v1220 + "&noncestr=" + v1222 + "&timestamp=" + v1223 + "&url=" + v_0x41a5982;
    const v1225 = vRequire26.sha1(v1224);
    p1383.response.status = 200;
    p1383.body = vRequire30.SUCCESS_200(v1211.BlmlS, {
      appId: feiShuConfig.appId,
      timestamp: v1223,
      nonceStr: v1222,
      signature: v1225
    });
  }
  static async getAccessTokenByCodeForFeiShu(p1400) {
    const v1226 = {
      Fyttb: function (p1401, p1402) {
        return p1401 ^ p1402;
      },
      lJLcN: " 接口报错 ：",
      cDtBp: function (p1403, p1404) {
        return p1403 ^ p1404;
      },
      qLVXU: function (p1405, p1406) {
        return p1405 + p1406;
      },
      KuuAZ: " 接口参数（header）：",
      svGSH: function (p1407, p1408) {
        return p1407 ^ p1408;
      },
      iObYX: "123456",
      EPpqD: "用户不存在，即将创建：",
      XLycV: "登录失败，账号无效或不存在1！",
      nlyDF: function (p1409, p1410) {
        return p1409 || p1410;
      },
      EwQdl: "登录失败，账号不存在或匹配到多条信息！",
      dewFT: function (p1411, p1412) {
        return p1411 ^ p1412;
      }
    };
    const {
      code: _0xa04b3b,
      grant_type: _0x56aae9
    } = vRequire26.parseQs(p1400.request.url);
    const {
      getUserTokenConfig: _0x352bb2,
      getUserInfoConfig: _0x328901
    } = feiShuConfig;
    let v1227 = "";
    const v1228 = {
      Authorization: "Bearer " + global.centerInfo.ssoForFeiShu.appToken.value,
      "Content-Type": "application/json"
    };
    vRequire29.printInfo(v1226.qLVXU(_0x352bb2.url, v1226.KuuAZ), JSON.stringify(v1228));
    const v1229 = await vRequire26.postJson(_0x352bb2.url, {
      code: _0xa04b3b,
      grant_type: _0x56aae9
    }, {
      customHead: v1228
    }).catch(p1413 => {
      vRequire29.printInfo(_0x352bb2.url + " 接口报错 ：", p1413);
      p1400.response.status = 412;
      p1400.body = vRequire30.ERROR_412(p1413.msg, v1226.Fyttb(931196, 931196));
    });
    vRequire29.printInfo(_0x352bb2.url + " 接口结果：", JSON.stringify(v1229));
    if (v1229) {
      const {
        access_token: _0x1ef89b
      } = v1229.data;
      v1227 = _0x1ef89b;
    }
    if (!v1227) {
      p1400.response.status = v1226.svGSH(342385, 342253);
      p1400.body = vRequire30.ERROR_412("token无效", 0);
      return;
    }
    const v1230 = {
      Authorization: "Bearer " + v1227
    };
    vRequire29.printInfo(_0x328901.url + " 接口参数（header）：", JSON.stringify(v1230));
    const v1231 = await vRequire26.get(_0x328901.url, {}, {
      customHead: v1230
    }).catch(p1414 => {
      vRequire29.printInfo(_0x328901.url + v1226.lJLcN, p1414);
      p1400.response.status = 412;
      p1400.body = vRequire30.ERROR_412(p1414.msg, v1226.cDtBp(999168, 999168));
    });
    vRequire29.printInfo(_0x328901.url + " 接口结果：", JSON.stringify(v1231));
    const {
      email = "",
      mobile = "",
      name = ""
    } = v1231.data;
    const v1232 = mobile.replace(new RegExp("\\+86", "g"), "");
    if (email || v1232) {
      const v1233 = await UserModel.checkUserByPhoneOrEmail(v1232, email);
      if (!v1233 || !v1233.length) {
        const v1234 = name || "no name";
        const v1235 = email || v1232;
        const v1236 = v1232 || email;
        const v1237 = {
          companyId: accountInfo.defaultCompanyId,
          nickname: v1234,
          emailName: v1235,
          phone: v1236,
          password: vRequire26.md5(v1226.iObYX),
          userId: vRequire26.getUuid(),
          userType: "customer",
          registerStatus: 1,
          avatar: Math.floor(Math.random() * 6)
        };
        vRequire29.printInfo(v1226.EPpqD, JSON.stringify(v1237));
        let v1238 = await UserModel.createUser(v1237);
        if (v1238 && v1238.id) {
          const v1239 = await C38.createSsoToken(v1236, v1235);
          if (v1239) {
            p1400.response.status = 200;
            p1400.body = vRequire30.SUCCESS_200("success", {
              accessToken: v1239
            });
            vRequire29.printInfo("生成token：", JSON.stringify(v1239));
          } else {
            vRequire29.printInfo("生成token失败：", JSON.stringify(v1239));
            p1400.response.status = 412;
            p1400.body = vRequire30.ERROR_412(v1226.XLycV, 0);
          }
        }
      } else {
        const v1240 = email || v1232;
        const v1241 = v1226.nlyDF(v1232, email);
        vRequire29.printInfo("用户已存在，用户信息：", JSON.stringify({
          phone: v1241,
          emailName: v1240
        }));
        const v1242 = await C38.createSsoToken(v1241, v1240);
        if (v1242) {
          p1400.response.status = 200;
          p1400.body = vRequire30.SUCCESS_200("success", {
            accessToken: v1242
          });
          vRequire29.printInfo("生成token：", JSON.stringify(v1242));
        } else {
          vRequire29.printInfo("生成token失败：", JSON.stringify(v1242));
          p1400.response.status = 412;
          p1400.body = vRequire30.ERROR_412(v1226.EwQdl, v1226.Fyttb(289436, 289436));
        }
      }
    } else {
      p1400.response.status = v1226.dewFT(570304, 569948);
      p1400.body = vRequire30.ERROR_412("未获取到手机号或邮箱", v1226.cDtBp(597817, 597817));
    }
  }
  static async getAccessTokenByCodeForIds(p1415) {
    const v1243 = {
      auBTM: "userRes:",
      yQKkB: "accessToken接口报错：:",
      sKOvC: "token参数:",
      QAOIE: "POST"
    };
    const {
      code: _0x4278a5,
      grant_type: _0x1c46f8
    } = vRequire26.parseQs(p1415.request.url);
    const {
      getAccessTokenConfig: _0x46d3ea,
      clientId: _0x587261,
      clientSecret: _0x3cbcdb,
      redirectUri: _0x420482
    } = idsConfig;
    const v1244 = {
      client_id: _0x587261,
      client_secret: _0x3cbcdb,
      redirect_uri: _0x420482,
      code: _0x4278a5,
      grant_type: _0x1c46f8
    };
    const v1245 = vRequire26.qs(v1244).replace(new RegExp("\\?", "g"), "");
    console.log(v1243.sKOvC, v1245);
    await vRequire31(_0x46d3ea.url + "?idsServiceType=federatedAuth&method=accessToken", {
      method: v1243.QAOIE,
      body: v1245,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      }
    }).then(async p1416 => {
      const v1246 = {
        rXDtt: v1243.auBTM,
        ONSbJ: function (p1417, p1418, p1419) {
          return p1417(p1418, p1419);
        },
        QFURt: "POST"
      };
      await p1416.json().then(async p1420 => {
        const v1247 = {
          IecSJ: v1246.rXDtt,
          NdUtV: function (p1421, p1422) {
            return p1421 === p1422;
          },
          RKNgS: "userId:",
          KIuRZ: function (p1423, p1424) {
            return p1423 ^ p1424;
          }
        };
        const {
          access_token: _0xd1c29f,
          token_type: _0x582a98,
          expires_in: _0x5b9659
        } = p1420;
        const v1248 = {
          client_id: _0x587261,
          client_secret: _0x3cbcdb,
          access_token: _0xd1c29f,
          token_type: "bearer"
        };
        const v1249 = vRequire26.qs(v1248).replace(new RegExp("\\?", "g"), "");
        console.log("user参数:", v1249);
        await v1246.ONSbJ(vRequire31, _0x46d3ea.url + "?idsServiceType=federatedAuth&method=getUser", {
          method: v1246.QFURt,
          body: v1249,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
          }
        }).then(async p1425 => {
          await p1425.json().then(async p1426 => {
            console.log(v1247.IecSJ, p1426);
            const {
              nickName = "",
              email = "",
              userId = "",
              userName: _0x2e6710
            } = v1247.NdUtV(typeof p1426, "string") ? JSON.parse(p1426) : p1426;
            console.log("nickName:", nickName, "email:", email, v1247.RKNgS, userId, "userName:", _0x2e6710);
            if (email) {
              const v1250 = await UserModel.checkUserByPhoneOrEmail("", email);
              console.log("用户是否存在:", v1250);
              if (!v1250 || !v1250.length) {
                const vEmail3 = email;
                const v1251 = "";
                const v1252 = {
                  companyId: accountInfo.defaultCompanyId,
                  nickname: nickName || _0x2e6710,
                  emailName: vEmail3,
                  phone: v1251,
                  password: vRequire26.md5("123456"),
                  userId: userId || vRequire26.getUuid(),
                  userType: "customer",
                  registerStatus: 1,
                  avatar: Math.floor(Math.random() * v1247.KIuRZ(799258, 799260))
                };
                console.log("用户不存在，即将创建：", JSON.stringify(v1252));
                let v1253 = await UserModel.createUser(v1252);
                if (v1253 && v1253.id) {
                  const v1254 = await C38.createSsoToken(v1251, vEmail3);
                  if (v1254) {
                    p1415.response.status = v1247.KIuRZ(570235, 570291);
                    p1415.body = vRequire30.SUCCESS_200("success", {
                      accessToken: v1254
                    });
                    console.log("生成token：", JSON.stringify(v1254));
                  } else {
                    console.log("生成token失败：", JSON.stringify(v1254));
                    p1415.response.status = 412;
                    p1415.body = vRequire30.ERROR_412("登录失败，账号无效或不存在1！", 0);
                  }
                }
              } else {
                const vEmail4 = email;
                const v1255 = "";
                console.log("用户已存在，用户信息：", JSON.stringify({
                  phone: v1255,
                  emailName: vEmail4
                }));
                const v1256 = await C38.createSsoToken(v1255, vEmail4);
                console.log("获取登录token:", v1256);
                if (v1256) {
                  p1415.response.status = v1247.KIuRZ(181754, 181554);
                  p1415.body = vRequire30.SUCCESS_200("success", {
                    accessToken: v1256
                  });
                  console.log("生成token：", JSON.stringify(v1256));
                } else {
                  console.log("生成token失败：", JSON.stringify(v1256));
                  p1415.response.status = 412;
                  p1415.body = vRequire30.ERROR_412("登录失败，账号不存在或匹配到多条信息！", 0);
                }
              }
            } else {
              p1415.response.status = 412;
              p1415.body = vRequire30.ERROR_412("未获取到邮箱", 0);
            }
          });
        }).catch(p1427 => {
          console.log("getUser接口报错:", p1427);
        });
      });
    }).catch(p1428 => {
      console.log(v1243.yQKkB, p1428);
    });
  }
  static async apiIdsNotice(p1429) {
    const v1257 = p1429.request.body;
    console.log("apiIdsNotice params", v1257);
  }
  static async getMachineFingerprint() {
    const v1258 = {
      dskqL: function (p1430, p1431) {
        return p1430 ^ p1431;
      },
      gccAS: "crypto",
      Eiqth: "hex"
    };
    const v1259 = ip2.address().split(".");
    const v1260 = v1259[0] + "." + v1259[v1258.dskqL(807977, 807976)];
    const v1261 = await vRequire40.cpu();
    const v1262 = await vRequire40.baseboard();
    const v1263 = await vRequire40.diskLayout();
    const v1264 = (await vRequire40.networkInterfaces()).find(p1432 => !p1432.internal)?.mac;
    const v1265 = v1261.manufacturer + "-" + v1261.brand + "-" + v1264;
    const v1266 = v1261.manufacturer + "-" + v1261.brand + "-" + v1260;
    const v1267 = require(v1258.gccAS).createHash("sha256").update(v1265).digest("hex");
    const v1268 = require("crypto").createHash("sha256").update(v1266).digest(v1258.Eiqth);
    const v1269 = v1267.substring(0, v1258.dskqL(733427, 733437));
    const v1270 = v1268.substring(0, v1258.dskqL(157592, 157590));
    const v1271 = v1267.substring(v1258.dskqL(614782, 614777), 21);
    const v1272 = v1268.substring(7, 21);
    const v1273 = "\n╔═══════════════════════机器码信息══════════════════════╗\n║                                                       ║\n║ 【提示】请复制机器码，并联系客服生成授权码            ║\n║                                                       ║                                                     ║\n║ 【监控机器码】" + v1269 + "-" + v1270 + "           ║\n║ 【埋点机器码】" + v1271 + "-" + v1272 + "           ║\n║                                                       ║\n║ 【提示】请复制机器码，并联系客服生成授权码            ║\n║                                                       ║\n╚═══════════════════════════════════════════════════════╝\n";
    console.warn(v1273.yellow);
    return {
      machineId: v1269,
      machineId2: v1270
    };
  }
}
class C27 {
  static async updateCompany(p1433) {
    const v1274 = {
      zHXqG: function (p1434, p1435) {
        return p1434 && p1435;
      }
    };
    const {
      userId: _0x3ff6a1,
      companyName: _0x4f104d,
      companyTax: _0x3f1994,
      bankName: _0x206ce9,
      bankNumber: _0x18cf40,
      companyAddress: _0x3f9f63,
      companyPhone: _0x4283f2
    } = JSON.parse(p1433.request.body);
    const {
      companyId: _0x1803f2
    } = p1433.user;
    let v1275 = 0;
    if (v1274.zHXqG(_0x4f104d, _0x3f1994)) {
      v1275 = 1;
    }
    await CompanyModel.updateCompany(_0x1803f2, {
      ownerId: _0x3ff6a1,
      companyName: _0x4f104d,
      companyTax: _0x3f1994,
      companyAddress: _0x3f9f63,
      companyPhone: _0x4283f2,
      bankName: _0x206ce9,
      bankNumber: _0x18cf40,
      isComplete: v1275
    });
    p1433.response.status = 200;
    p1433.body = vRequire30.SUCCESS_200("创建信息成功", 0);
  }
  static async ["getCompanyInfo"](p1436) {
    const {
      companyId: _0x2c35c6
    } = JSON.parse(p1436.request.body);
    const v1276 = await CompanyModel.getCompanyInfo(_0x2c35c6);
    p1436.response.status = 200;
    p1436.body = vRequire30.SUCCESS_200("查询成功", v1276);
  }
  static async ["getCompanyList"](p1437) {
    const v1277 = {
      TiENc: function (p1438, p1439) {
        return p1438 ^ p1439;
      }
    };
    const v1278 = await CompanyModel.getCompanyList();
    p1437.response.status = v1277.TiENc(110368, 110568);
    p1437.body = vRequire30.SUCCESS_200("查询成功", v1278);
  }
  static async ["getProjectCountByCompanyId"](p1440) {
    const v1279 = {
      qqEdt: function (p1441, p1442) {
        return p1441 ^ p1442;
      },
      bYuSI: function (p1443, p1444) {
        return p1443 ^ p1444;
      },
      rEEFi: function (p1445, p1446) {
        return p1445 * p1446;
      }
    };
    const {
      companyId: _0x18373c
    } = p1440.request.body;
    let v1280 = 0;
    let v1281 = v1279.qqEdt(821545, 821545);
    const v1282 = await vRequire26.postJson("" + MONITOR_LOCAL_SERVER + PROJECT_API.GET_MONITOR_PROJECT_COUNT_BY_COMPANY_ID, {
      companyId: _0x18373c
    }).catch(p1447 => {
      console.error(p1447);
    });
    if (v1282) {
      v1280 = v1282.data * v1279.bYuSI(312121, 312120);
    }
    const v1283 = await vRequire26.postJson("" + EVENT_LOCAL_SERVER + PROJECT_API.GET_EVENT_PROJECT_COUNT_BY_COMPANY_ID, {
      companyId: _0x18373c
    }).catch(p1448 => {
      console.error(p1448);
    });
    if (v1283) {
      v1281 = v1279.rEEFi(v1283.data, 1);
    }
    const v1284 = v1280 + v1281;
    const v1285 = await ProductModel.getProductDetailByCompanyId(_0x18373c);
    p1440.response.status = v1279.bYuSI(721186, 721386);
    p1440.body = vRequire30.SUCCESS_200("查询成功", {
      totalProjectCount: v1284,
      productInfo: v1285
    });
  }
  static async ["getProductInfoByCompanyId"](p1449) {
    const v1286 = {
      hXNTc: function (p1450, p1451) {
        return p1450 ^ p1451;
      },
      pUaFt: "查询成功"
    };
    const {
      companyId: _0x2ad76c
    } = p1449.request.body;
    const v1287 = await ProductModel.getProductDetailByCompanyId(_0x2ad76c);
    p1449.response.status = v1286.hXNTc(374137, 374193);
    p1449.body = vRequire30.SUCCESS_200(v1286.pUaFt, v1287);
  }
}
class C28 {
  static async createFlowDataInfoByHour(p1452) {
    const v1288 = {
      Pajma: function (p1453, p1454) {
        return p1453 < p1454;
      },
      kGlzS: function (p1455, p1456) {
        return p1455 ^ p1456;
      }
    };
    const v1289 = p1452.request.body;
    const {
      flowArray: _0x50d37c,
      dayName = ""
    } = v1289;
    let v1290 = "";
    for (let v1291 = 0; v1288.Pajma(v1291, _0x50d37c.length); v1291++) {
      const {
        flowCount: _0x52a959
      } = _0x50d37c[v1291];
      if (_0x52a959 === 0) {
        continue;
      }
      v1290 += C28.handleFlowArray(_0x50d37c[v1291]);
    }
    v1290 = v1290.substring(0, v1290.length - 1);
    const v1292 = dayName.replace(new RegExp("-", "g"), "");
    const v1293 = "FlowDataInfoByHour" + v1292;
    let v1294 = "";
    if (v1290) {
      v1294 = "INSERT INTO " + v1293 + " (companyId, projectId, projectName, flowOrigin, productType, flowType, hourName, flowCount, createdAt, updatedAt)\n      VALUES\n      " + v1290 + "\n      ";
    }
    if (v1294) {
      FlowDataInfoByHourModel.createFlowDataInfosByHour(v1294);
    }
    p1452.response.status = 200;
    p1452.body = vRequire30.SUCCESS_200("创建信息成功", v1288.kGlzS(514040, 514040));
  }
  static handleFlowArray(p1457) {
    const v1295 = new Date().Format("yyyy-MM-dd hh:mm:ss");
    const vV1295 = v1295;
    const {
      companyId: _0x37bb34,
      projectId: _0x5ac354,
      projectName: _0x12ea2c,
      productType: _0x23bdfb,
      flowType: _0x1a9f69,
      hourName: _0x5e868f,
      flowCount: _0x13a6b0
    } = p1457;
    const vF86 = "subscribe";
    let v1296 = "('" + _0x37bb34 + "', '" + _0x5ac354 + "', '" + _0x12ea2c + "', '" + vF86 + "', '" + _0x23bdfb + "', '" + _0x1a9f69 + "', '" + _0x5e868f + "', " + _0x13a6b0 + ", '" + v1295 + "', '" + vV1295 + "'),";
    return v1296;
  }
  static async getHourFlowTrendData(p1508) {
    const v1297 = {
      yXXra: "hourName",
      bUjzJ: "monitor",
      POIZt: "查询信息列表成功！"
    };
    const {
      companyId: _0x2067a1,
      projectIds = "",
      productType = v1297.bUjzJ
    } = p1508.wfParam;
    const v1298 = await FlowDataInfoByHourModel.getHourFlowTrendDataForCompanyId(_0x2067a1, productType, projectIds);
    const v1299 = projectIds.split(",");
    let v1300 = {};
    if (v1298 && v1298.length) {
      v1299.forEach(p1509 => {
        let vInitCurDayTrendData2 = initCurDayTrendData({
          count: 0,
          productType: productType,
          projectId: p1509
        }, v1297.yXXra);
        v1300[p1509] = vInitCurDayTrendData2.map(p1510 => {
          let v1301 = {
            ...p1510
          };
          const {
            projectId: _0x4624b0,
            hourName: _0x33c2b4
          } = p1510;
          const v1302 = v1298.find(p1511 => p1511.projectId === _0x4624b0 && _0x33c2b4 === p1511.hourName) || null;
          if (v1302) {
            v1301.count = v1302.count;
          }
          return v1301;
        });
      });
    }
    p1508.response.status = 200;
    p1508.body = vRequire30.SUCCESS_200(v1297.POIZt, v1300);
  }
}
class C29 {
  static async ["createFlowDataInfoByDay"](p1512) {
    const v1303 = {
      NflrE: function (p1513, p1514) {
        return p1513 ^ p1514;
      },
      QoMlU: function (p1515, p1516) {
        return p1515 ^ p1516;
      },
      kPqzS: function (p1517, p1518) {
        return p1517 ^ p1518;
      },
      baukS: function (p1519, p1520) {
        return p1519 ^ p1520;
      },
      TodbS: function (p1521, p1522) {
        return p1521 ^ p1522;
      },
      tPZqo: "创建信息成功"
    };
    const v1304 = p1512.request.body;
    const {
      flowArray: _0xdf877b,
      dayName = ""
    } = v1304;
    let v1305 = "";
    for (let v1306 = 0; v1306 < _0xdf877b.length; v1306++) {
      const {
        flowCount: _0x327770
      } = _0xdf877b[v1306];
      if (_0x327770 === v1303.NflrE(584172, 584172)) {
        continue;
      }
      v1305 += C29.handleFlowArray(_0xdf877b[v1306]);
    }
    v1305 = v1305.substring(v1303.QoMlU(617205, 617205), v1305.length - v1303.QoMlU(731446, 731447));
    const v1307 = dayName.substring(v1303.kPqzS(572781, 572781), v1303.baukS(463761, 463765));
    const v1308 = "FlowDataInfoByDay" + v1307;
    let v1309 = "";
    if (v1305) {
      v1309 = "INSERT INTO " + v1308 + " (companyId, projectId, projectName, productType, flowType, monthName, dayName, flowCount, createdAt, updatedAt) \n      VALUES\n      " + v1305 + "\n      ";
    }
    if (v1309) {
      FlowDataInfoByDayModel.createFlowDataInfosByHour(v1309);
    }
    p1512.response.status = v1303.TodbS(113357, 113157);
    p1512.body = vRequire30.SUCCESS_200(v1303.tPZqo, 0);
  }
  static async ["getTotalFlowData"](p1523) {
    const v1310 = {
      cePSl: function (p1524, p1525) {
        return p1524 + p1525;
      },
      cyOzk: function (p1526, p1527) {
        return p1526 < p1527;
      },
      fGUEy: function (p1528, p1529) {
        return p1528 + p1529;
      },
      yXSdh: "yyyy-MM-dd",
      weOvQ: function (p1530, p1531) {
        return p1530(p1531);
      },
      JwKUd: function (p1532, p1533) {
        return p1532 ^ p1533;
      },
      WIGTZ: function (p1534, p1535) {
        return p1534 === p1535;
      }
    };
    const {
      companyId: _0x21d2f4
    } = p1523.wfParam;
    const v1311 = new Date();
    let v1312 = v1310.cePSl(v1311.getMonth(), 1);
    v1312 = v1310.cyOzk(v1312, 10) ? "0" + v1312 : v1312;
    let v1313 = v1311.getDate();
    v1313 = v1313 < 10 ? v1310.fGUEy("0", v1313) : v1313;
    const v1314 = v1311.Format(v1310.yXSdh);
    const v1315 = await FlowDataInfoByDayModel.getTotalFlowCountByCompany(_0x21d2f4);
    const v1316 = v1315 && v1315.length ? v1310.weOvQ(parseInt, v1315[v1310.JwKUd(727467, 727467)].count) : 0;
    const v1317 = await FlowDataInfoByDayModel.getTotalFlowCountByCompanyForDay(_0x21d2f4, v1314);
    const v1318 = v1317 && v1317.length ? parseInt(v1310.WIGTZ(v1317[v1310.JwKUd(510806, 510806)].count, null) ? 0 : v1317[0].count) : 0;
    const v1319 = await ProductModel.getProductDetailByCompanyId(_0x21d2f4);
    const v1320 = v1319 ? v1319.maxFlowCount * 1 : 0;
    p1523.response.status = 200;
    p1523.body = vRequire30.SUCCESS_200("查询信息列表成功！", {
      todayFlow: v1318,
      maxFlowCount: v1320,
      totalFlow: v1316
    });
  }
  static async getFlowTrendData(p1536) {
    const v1321 = {
      zngRQ: "查询信息列表成功！"
    };
    const {
      companyId: _0x8497f,
      startDate = "",
      endDate = ""
    } = p1536.wfParam;
    const v1322 = await FlowDataInfoByDayModel.getFlowTrendDataForCompanyIdByDate(_0x8497f, startDate, endDate);
    const v1323 = await FlowDataInfoByDayModel.getFlowDistributeDataForCompanyIdByDate(_0x8497f, startDate, endDate);
    const v1324 = [];
    if (v1323 && v1323.length) {
      v1323.forEach(p1537 => {
        const {
          productType: _0x3a22bf,
          count: _0x5ef669
        } = p1537;
        if (v951[_0x3a22bf]) {
          v1324.push({
            productType: _0x3a22bf,
            value: _0x5ef669,
            name: v951[_0x3a22bf]
          });
        }
      });
    }
    p1536.response.status = 200;
    p1536.body = vRequire30.SUCCESS_200(v1321.zngRQ, {
      flowTrend: v1322,
      flowDistribute: v1324
    });
  }
  static async getFlowTableListData(p1538) {
    const v1325 = {
      XBJiM: function (p1539, p1540) {
        return p1539(p1540);
      },
      ZeutB: function (p1541, p1542) {
        return p1541 ^ p1542;
      }
    };
    const {
      companyId: _0x459f23,
      productType = "monitor",
      projectName = "",
      page = 1,
      pageSize = 10
    } = p1538.wfParam;
    let v1326 = 0;
    const v1327 = await FlowDataInfoByDayModel.getFlowTotalCountForCompanyId(_0x459f23, productType, projectName);
    if (v1327 && v1327.length) {
      v1327.forEach(p1543 => {
        v1326 += v1325.XBJiM(Number, p1543.count);
      });
    }
    const v1328 = await FlowDataInfoByDayModel.getFlowTableListDataForCompanyId({
      companyId: _0x459f23,
      productType: productType,
      projectName: projectName,
      page: page,
      pageSize: pageSize
    });
    let v1329 = v1328 && v1328.length ? v1328 : [];
    p1538.response.status = v1325.ZeutB(123312, 123256);
    p1538.body = vRequire30.SUCCESS_200("查询信息列表成功！", {
      list: v1329,
      total: v1326
    });
  }
  static async getFlowListByCompanyIdAndProjectIds(p1544) {
    const v1330 = {
      bipTD: function (p1545, p1546) {
        return p1545 ^ p1546;
      }
    };
    const {
      companyId: _0x17bf6a,
      projectIds = "",
      startDate = "",
      endDate = "",
      productType: _0x114eba
    } = p1544.wfParam;
    const v1331 = await FlowDataInfoByDayModel.getFlowListByCompanyIdAndProjectIds(_0x17bf6a, projectIds, startDate, endDate, _0x114eba);
    const v1332 = projectIds.split(",");
    const v1333 = v1331 && v1331.length ? v1331 : [];
    p1544.response.status = v1330.bipTD(835331, 835531);
    p1544.body = vRequire30.SUCCESS_200("查询信息列表成功！", v1333);
  }
  static async getLimitCompanyIdForCloud(p1547) {
    const v1334 = {
      kHUgB: "查询信息列表成功！"
    };
    const v1335 = await FlowDataInfoByDayModel.getLimitCompanyIdForCloud();
    p1547.response.status = 200;
    p1547.body = vRequire30.SUCCESS_200(v1334.kHUgB, v1335);
  }
  static async getTotalFlowCountByCompanyForDay(p1548) {
    const v1336 = {
      MnSZD: function (p1549, p1550) {
        return p1549 ^ p1550;
      },
      NtVbU: function (p1551, p1552) {
        return p1551 ^ p1552;
      }
    };
    let v1337 = "1";
    const v1338 = await CompanyModel.getFirstCompany();
    if (v1338 && v1338.length) {
      v1337 = v1338[0].companyId;
    }
    const v1339 = new Date().Format("yyyy-MM-dd");
    const v1340 = await FlowDataInfoByDayModel.getTotalFlowCountByCompanyForDay(v1337, v1339);
    let v1341 = 0;
    if (v1340 && v1340.length) {
      v1341 = v1340[v1336.MnSZD(257851, 257851)].count * v1336.NtVbU(661933, 661932);
    }
    p1548.response.status = 200;
    p1548.body = vRequire30.SUCCESS_200("success", v1341);
  }
}
class C30 {
  static async createOrder(p1553) {
    const v1342 = {
      Kzvvg: function (p1554, p1555) {
        return p1554 ^ p1555;
      }
    };
    const {
      orderId: _0x1ffd42,
      productType: _0x526ae4,
      maxFlowCount: _0x1b2c84,
      projectCount: _0x480c00,
      price: _0x1059b1,
      phone: _0x2b8100,
      year: _0x6849b,
      enableDataExport: _0x47b33c,
      saveDays: _0x1f81e7
    } = JSON.parse(p1553.request.body);
    const {
      userId: _0x5de080,
      companyId: _0x38c228,
      emailName: _0x51b1e0
    } = p1553.user;
    const v1343 = await OrderInfoModel.createOrderInfo({
      companyId: _0x38c228,
      userId: _0x5de080,
      orderId: _0x1ffd42,
      productType: _0x526ae4,
      maxFlowCount: _0x1b2c84,
      projectCount: _0x480c00,
      phone: _0x2b8100,
      email: _0x51b1e0,
      price: _0x1059b1,
      year: _0x6849b,
      isPay: 0,
      invoice: 0,
      enableDataExport: _0x47b33c,
      saveDays: _0x1f81e7
    });
    p1553.response.status = v1342.Kzvvg(378457, 378513);
    p1553.body = vRequire30.SUCCESS_200("查询成功", v1343);
  }
  static async ["getOrderInfoList"](p1556) {
    const v1344 = {
      PrJVy: function (p1557, p1558) {
        return p1557 < p1558;
      },
      SHDEj: function (p1559, p1560) {
        return p1559 < p1560;
      },
      mekcR: function (p1561, p1562) {
        return p1561 * p1562;
      },
      qBVkp: function (p1563, p1564) {
        return p1563 ^ p1564;
      },
      hajOi: "查询成功"
    };
    const {
      userId: _0x19ff33,
      companyId: _0x170fd1
    } = p1556.user;
    const v1345 = await OrderInfoModel.getOrderInfoListByUserId(_0x19ff33);
    const v1346 = [];
    for (let v1347 = 0; v1344.PrJVy(v1347, v1345.length); v1347++) {
      if (v1345[v1347].isPay === 0) {
        v1346.push(v1345[v1347]);
      }
    }
    for (let v1348 = 0; v1344.SHDEj(v1348, v1346.length); v1348++) {
      const {
        orderId: _0x1f1aea,
        productType: _0x15f7b,
        maxFlowCount: _0xf92586,
        projectCount: _0x45e97f,
        year: _0x196244,
        enableDataExport = false,
        saveDays = 30
      } = v1346[v1348];
      const v1349 = new Date(new Date().getTime() + v1344.mekcR(_0x196244 * 366 * v1344.qBVkp(946280, 946288), 3600) * 1000).Format("yyyy-MM-dd 00:00:00");
      const v1350 = await vRequire26.postJson("http://www.webfunny.cn/config/paiPaymentCheck", {
        orderNum: _0x1f1aea
      }).catch(p1565 => {
        console.error(p1565);
      });
      if (v1350 && v1350.data === true) {
        await OrderInfoModel.updateByOrderId(_0x1f1aea, {
          isPay: 1,
          payTime: new Date().Format("yyyy-MM-dd hh:mm:ss"),
          endDate: v1349
        });
        await ProductModel.updateProductByCompanyId(_0x170fd1, {
          isValid: 0
        });
        await ProductModel.createProduct({
          companyId: _0x170fd1,
          orderId: _0x1f1aea,
          productType: _0x15f7b,
          usedFlowCount: 0,
          maxFlowCount: _0xf92586 * 10000,
          projectCount: _0x45e97f,
          endDate: v1349,
          isValid: 1,
          enableDataExport: enableDataExport,
          saveDays: saveDays
        });
      }
    }
    const v1351 = await OrderInfoModel.getOrderInfoListByUserId(_0x19ff33);
    p1556.response.status = 200;
    p1556.body = vRequire30.SUCCESS_200(v1344.hajOi, v1351);
  }
  static async ["checkSameOrder"](p1566) {
    const v1352 = {
      ibjKA: function (p1567, p1568) {
        return p1567 > p1568;
      }
    };
    const {
      productType: _0x24ead8,
      maxFlowCount: _0x25b9dd,
      price: _0x4f2614
    } = JSON.parse(p1566.request.body);
    const {
      userId: _0x5599cc
    } = p1566.user;
    const v1353 = await OrderInfoModel.checkSameOrder(_0x5599cc, _0x24ead8, _0x25b9dd, _0x4f2614);
    const v1354 = v1353 && v1352.ibjKA(v1353.length, 0);
    p1566.response.status = 200;
    p1566.body = vRequire30.SUCCESS_200("查询成功", v1354);
  }
  static async applyInvoice(p1569) {
    const v1355 = {
      GOilM: function (p1570, p1571) {
        return p1570 * p1571;
      },
      sIdOz: function (p1572, p1573) {
        return p1572 ^ p1573;
      },
      ASWtb: "请完善公司信息后，再开票！【点击头像 - 公司名称】",
      UWOsV: function (p1574, p1575) {
        return p1574 - p1575;
      },
      yvfYc: function (p1576, p1577) {
        return p1576 < p1577;
      },
      RFCmh: "success"
    };
    const {
      orderId: _0x281cbd,
      invoiceType: _0x1a1dc4
    } = JSON.parse(p1569.request.body);
    const {
      companyId: _0x78ab08
    } = p1569.user;
    const v1356 = await CompanyModel.getCompanyInfo(_0x78ab08);
    if (v1355.GOilM(v1356.isComplete, v1355.sIdOz(862808, 862809)) === v1355.sIdOz(615886, 615886)) {
      p1569.response.status = 412;
      p1569.body = vRequire30.ERROR_412(v1355.ASWtb);
      return;
    }
    const v1357 = await OrderInfoModel.getOrderDetail(_0x281cbd);
    const v1358 = v1355.UWOsV(new Date().getTime(), new Date(v1357.latestInvoiceTime).getTime());
    if (v1355.yvfYc(v1358, 86400000)) {
      p1569.response.status = v1355.sIdOz(418764, 418384);
      p1569.body = vRequire30.ERROR_412("开票请求已发起，请勿频繁操作哦！");
      return;
    }
    await OrderInfoModel.updateByOrderId(_0x281cbd, {
      latestInvoiceTime: new Date().getTime()
    });
    vRequire42.config.text.content = "客户发票申请！\n开票金额：" + v1357.price + "元\n开票类型：" + _0x1a1dc4 + "\n开票内容：技术服务费\n\n公司名称：" + v1356.companyName + "\n公司税号：" + v1356.companyTax + "\n开户银行：" + v1356.bankName + "\n银行账号：" + v1356.bankNumber + "\n注册地址：" + v1356.companyAddress + "\n注册电话：" + v1356.companyPhone + "\n\n联系电话：" + v1357.phone + "\n联系邮箱：" + v1357.email + "\n        ";
    await vRequire26.postJson(accountInfo.invoiceHookForDingding, vRequire42.config);
    p1569.response.status = 200;
    p1569.body = vRequire30.SUCCESS_200(v1355.RFCmh, {});
  }
}
class C31 {
  static async create(p1588) {
    let v1359 = p1588.request.body;
    await MenuPermissionsModel.createMenuPermissions(v1359);
  }
  static async updateMenuPermission(p1589) {
    const v1360 = {
      ysOCf: "permissionRes",
      UcYTU: function (p1590, p1591) {
        return p1590 ^ p1591;
      }
    };
    const {
      teamId: _0x3f10ee,
      targetUserId: _0x13ea95,
      chooseMonitorMenus: _0x528184,
      chooseEventMenus: _0xf96a6a
    } = JSON.parse(p1589.request.body);
    console.log(_0x3f10ee, _0x13ea95, _0x528184, _0xf96a6a);
    const v1361 = _0x528184.join(",");
    const v1362 = _0xf96a6a.join(",");
    const v1363 = await MenuPermissionsModel.getMenuPermissionsFromTeam(_0x3f10ee, _0x13ea95);
    console.log(v1360.ysOCf, v1363);
    if (v1363) {
      await MenuPermissionsModel.updateMenuPermissions(v1363.id, {
        teamId: _0x3f10ee,
        userId: _0x13ea95,
        monitorMenu: v1361,
        eventMenu: v1362
      });
    } else {
      await MenuPermissionsModel.createMenuPermissions({
        teamId: _0x3f10ee,
        userId: _0x13ea95,
        monitorMenu: v1361,
        eventMenu: v1362
      });
    }
    p1589.response.status = v1360.UcYTU(277448, 277248);
    p1589.body = vRequire30.SUCCESS_200("success", v1360.UcYTU(429146, 429146));
  }
  static async getMenuPermissionsByProject(p1592) {
    const v1364 = {
      YfdGx: function (p1593, p1594) {
        return p1593 === p1594;
      },
      oxiDj: "success"
    };
    const {
      projectId: _0xde77f
    } = JSON.parse(p1592.request.body);
    const {
      userId: _0x1524cd,
      userType: _0x446a0d
    } = p1592.user;
    let v1365 = "";
    let v1366 = "";
    if (!v1364.YfdGx(_0x446a0d, "superAdmin") && _0x446a0d !== "admin") {
      const v1367 = await TeamModel.getTeamByProjectId(_0xde77f);
      if (v1367 && v1367.length) {
        const {
          id: _0x31077f
        } = v1367[0];
        const v1368 = await MenuPermissionsModel.getMenuPermissionsFromTeam(_0x31077f, _0x1524cd);
        if (v1368) {
          v1365 = v1368.monitorMenu;
          v1366 = v1368.eventMenu;
        }
      }
    }
    p1592.response.status = 200;
    p1592.body = vRequire30.SUCCESS_200(v1364.oxiDj, {
      monitorMenuPermissions: v1365,
      eventMenuPermissions: v1366
    });
  }
}
class C32 {
  static async ["create"](p1595) {
    let v1369 = p1595.request.body;
    const v1370 = await ProductModel.createProduct(v1369);
    p1595.response.status = 200;
    p1595.body = vRequire30.SUCCESS_200("创建信息成功", v1370);
  }
  static async getProjectByCompanyIdForMonth(p1596) {
    const v1371 = {
      kEAVy: "创建信息成功"
    };
    const {
      companyId: _0x3967fc
    } = p1596.wfParam;
    const v1372 = new Date().Format("yyyy-MM");
    const v1373 = await ProductModel.getProjectByCompanyIdForMonth(_0x3967fc, v1372);
    p1596.response.status = 200;
    p1596.body = vRequire30.SUCCESS_200(v1371.kEAVy, v1373);
  }
  static async ["createNewProduct"](p1597) {
    let v1374 = p1597.request.body;
    const v1375 = await ProductModel.createProduct(v1374);
    p1597.response.status = 200;
    p1597.body = vRequire30.SUCCESS_200("创建信息成功", v1375);
  }
  static async ["batchCreateOrUpdateProduct"](p1598) {
    const v1376 = {
      ZOUBr: "批量创建或者批量更新流量套餐产品成功！！！"
    };
    const v1377 = WEBFUNNY_CONFIG_URI + "/config/getProductList";
    const v1378 = await vRequire26.postJson(v1377);
    const {
      data = {}
    } = v1378;
    let v1379 = [];
    let v1380 = [];
    let v1381 = [];
    const v1382 = data.newProductList || [];
    const v1383 = data.expireOrderIds || [];
    if (v1382.length) {
      v1379 = v1382.map(p1599 => {
        const {
          productType: _0x52e349,
          companyId: _0x29ae0c,
          endDate: _0x2a0a11,
          flowCount: _0x34811f,
          orderId: _0x1792a5,
          month: _0x4a2c7c
        } = p1599;
        v1380.push(_0x1792a5);
        return {
          companyId: _0x29ae0c,
          endDate: _0x2a0a11,
          orderId: _0x1792a5,
          month: _0x4a2c7c,
          productType: _0x52e349,
          maxFlowCount: _0x34811f,
          usedFlowCount: 0,
          isValid: 1
        };
      });
    }
    if (v1383.length) {
      v1381 = data.expireOrderIds;
      v1380 = [...v1380, ...v1381];
    }
    if (v1380.length) {
      const v1384 = await ProductModel.batchQueryProductByOrderId(v1380);
      const v1385 = new Date().Format("yyyy-MM");
      v1379 = v1379.filter(p1600 => {
        const {
          orderId: _0x59733c,
          month: _0x28ede7,
          companyId: _0x3ead2b
        } = p1600;
        if (v1384.length) {
          return !v1384.find(p1601 => p1601.orderId === _0x59733c && p1601.companyId === _0x3ead2b && p1601.month === _0x28ede7);
        } else {
          return true;
        }
      });
      if (v1383.length) {
        const v1386 = v1384.filter(p1602 => p1602.month === v1385 && v1383.includes(p1602.orderId));
        v1379 = v1379.map(p1603 => {
          const {
            month: _0x30155a,
            companyId: _0x28e747
          } = p1603;
          let v1387 = {
            ...p1603
          };
          const v1388 = v1386.find(p1604 => p1604.month === _0x30155a && p1604.companyId === _0x28e747) || null;
          if (v1388) {
            v1387.usedFlowCount += v1388.usedFlowCount || 0;
            v1387.maxFlowCount += v1388.maxFlowCount || 0;
          }
          return v1387;
        });
      }
      if (v1381.length) {
        await ProductModel.batchUpdateProductByOrderId(v1381, {
          isValid: 0
        });
      }
      if (v1379.length) {
        await ProductModel.batchCreateProduct(v1379);
      }
      console.log(v1376.ZOUBr);
    }
  }
  static async ["batchCreateProduct"](p1605) {
    const v1389 = {
      HvbcO: function (p1606, p1607) {
        return p1606 ^ p1607;
      },
      aVqWV: "批量创建信息成功"
    };
    let v1390 = p1605.request.body;
    const v1391 = await ProductModel.batchCreateProduct(v1390);
    p1605.response.status = v1389.HvbcO(432483, 432555);
    p1605.body = vRequire30.SUCCESS_200(v1389.aVqWV, v1391);
  }
  static async batchUpdateProduct(p1608) {
    const v1392 = {
      xaZon: "批量更新信息成功"
    };
    const {
      ids: _0x377bbd
    } = p1608.wfParam;
    const v1393 = await ProductModel.batchUpdateProductByOrderId(_0x377bbd, {
      isValid: 1
    });
    p1608.response.status = 200;
    p1608.body = vRequire30.SUCCESS_200(v1392.xaZon, v1393);
  }
  static async ["getValidProduct"](p1609) {
    const v1394 = {
      mgkDD: function (p1610, p1611) {
        return p1610 ^ p1611;
      },
      DgrVm: "success"
    };
    const {
      companyId: _0x2e4da8
    } = p1609.user;
    const v1395 = await ProductModel.getValidProduct(_0x2e4da8);
    const v1396 = v1395 && v1395.length ? v1395[0] : {};
    const v1397 = new Date().Format("yyyy-MM-dd");
    const v1398 = await FlowDataInfoByDayModel.getFlowCountForCompanyIdByDayName(_0x2e4da8, v1397);
    const v1399 = v1398 && v1398.length ? v1398[v1394.mgkDD(896271, 896271)].count : 0;
    v1396.usedFlowCount = v1399;
    p1609.response.status = 200;
    p1609.body = vRequire30.SUCCESS_200(v1394.DgrVm, v1396);
  }
}
class C33 {
  static async create(p1612) {
    let v1400 = p1612.request.body;
    if (v1400.title && v1400.author && v1400.content && v1400.category) {
      let v1401 = await TeamModel.createTeam(v1400);
      let v1402 = await TeamModel.getTeamDetail(v1401.id);
      p1612.response.status = 200;
      p1612.body = vRequire30.SUCCESS_200("创建信息成功", v1402);
    } else {
      p1612.response.status = 412;
      p1612.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async createNewTeam(p1613) {
    const v1403 = {
      apRcD: function (p1614, p1615) {
        return p1614 ^ p1615;
      },
      NfUMp: function (p1616, p1617) {
        return p1616 ^ p1617;
      }
    };
    let v1404 = 0;
    const v1405 = await TeamModel.getTeamCount();
    if (v1405 && v1405.length) {
      v1404 = v1405[v1403.apRcD(176493, 176493)].count * 1;
    }
    const v1406 = await C24.checkFreeLicense();
    if (v1406 === true && v1404 >= v1403.NfUMp(114869, 114868)) {
      p1613.response.status = 412;
      p1613.body = vRequire30.ERROR_412("社区版团队数量已达上限，无法继续创建！");
      return;
    }
    let v1407 = JSON.parse(p1613.request.body);
    const {
      teamName: _0x175090
    } = v1407;
    const {
      userId: _0xd64540,
      companyId: _0x4625c6
    } = p1613.user;
    const v1408 = {
      teamName: _0x175090,
      leaderId: _0xd64540,
      members: _0xd64540,
      webMonitorIds: "",
      companyId: _0x4625c6
    };
    const v1409 = await TeamModel.createTeam(v1408);
    p1613.response.status = 200;
    p1613.body = vRequire30.SUCCESS_200("创建信息成功", v1409);
  }
  static async ["createNewTeamForApi"](p1618) {
    const v1410 = {
      kuMdY: function (p1619, p1620) {
        return p1619 ^ p1620;
      },
      WmlKF: "团队名称重复！"
    };
    const {
      teamName: _0x55e61f,
      userId: _0x499674
    } = p1618.request.body;
    const v1411 = {
      teamName: _0x55e61f,
      leaderId: _0x499674,
      members: _0x499674,
      webMonitorIds: ""
    };
    const v1412 = await TeamModel.getTeamDetailByName(_0x55e61f);
    if (v1412) {
      p1618.response.status = v1410.kuMdY(474455, 474315);
      p1618.body = vRequire30.ERROR_412(v1410.WmlKF);
      return;
    }
    const v1413 = await TeamModel.createTeam(v1411);
    p1618.response.status = 200;
    p1618.body = vRequire30.SUCCESS_200("团队创建成功", v1413);
  }
  static async ["deleteTeam"](p1621) {
    const v1414 = {
      hAWRZ: function (p1622, p1623) {
        return p1622 ^ p1623;
      },
      TSJwL: "团队删除成功"
    };
    let v1415 = JSON.parse(p1621.request.body);
    const {
      id: _0x3d1cc6
    } = v1415;
    const v1416 = await TeamModel.deleteTeam(_0x3d1cc6);
    if (v1416) {
      p1621.response.status = v1414.hAWRZ(266005, 266205);
      p1621.body = vRequire30.SUCCESS_200(v1414.TSJwL, 0);
    } else {
      p1621.response.status = v1414.hAWRZ(760051, 760175);
      p1621.body = vRequire30.ERROR_412("团队删除失败！");
    }
  }
  static async moveProToTeam(p1624) {
    let v1417 = JSON.parse(p1624.request.body);
    const {
      showMoveMonitorId: _0x4f8ae0,
      chooseTeamId: _0x55bc38
    } = v1417;
    const v1418 = await TeamModel.getTeamDetail(_0x55bc38);
    const v1419 = v1418.webMonitorIds + "," + _0x4f8ae0;
    await TeamModel.updateTeam(_0x55bc38, {
      webMonitorIds: v1419
    });
    p1624.response.status = 200;
    p1624.body = vRequire30.SUCCESS_200("success", "");
  }
  static async ["handleAllApplicationConfig"]() {
    const v1420 = {
      FNapL: "monitor",
      IVWoU: "event"
    };
    const v1421 = await ApplicationConfigModel.getAllApplicationConfig();
    let v1422 = {};
    let v1423 = {};
    v1421.forEach(p1625 => {
      const v1424 = JSON.parse(p1625.configValue);
      switch (p1625.systemName) {
        case v1420.FNapL:
          v1422 = v1424;
          break;
        case v1420.IVWoU:
          v1423 = v1424;
          break;
        default:
          break;
      }
    });
    return {
      monitor: v1422,
      event: v1423
    };
  }
  static async handleTeamList(p1626, p1627, p1628, p1629) {
    const v1425 = {
      LunDJ: "post",
      Calqi: function (p1630, p1631) {
        return p1630 ^ p1631;
      },
      teveS: "event",
      HOztg: function (p1632, p1633) {
        return p1632 + p1633;
      }
    };
    const v1426 = await C33.handleAllApplicationConfig();
    const {
      monitor: _0x34782d,
      event: _0x40087f
    } = v1426;
    let v1427 = [];
    if (p1629) {
      v1427 = await TeamModel.getTeamListWithTeamId(p1626, p1627, p1628, p1629);
    } else {
      v1427 = await TeamModel.getTeamList(p1626, p1627, p1628);
    }
    for (let v1428 = 0; v1428 < v1427.length; v1428++) {
      const v1429 = v1427[v1428];
      const {
        leaderId: _0x186665,
        members: _0x583e26,
        webMonitorIds: _0x455876
      } = v1429;
      const v1430 = await UserModel.getUserListByMembers(_0x583e26);
      v1429.members = v1430;
      v1430.forEach(p1634 => {
        if (p1634.userId == _0x186665) {
          v1429.leader = p1634;
          return false;
        }
      });
      const v1431 = await vRequire26.ajaxInside(v1425.LunDJ, "" + LOCAL_SERVER + PROJECT_API.MONITOR_PROJECT_SIMPLE_LIST_BY_WEBMONITOR_IDS, {
        webMonitorIds: _0x455876
      });
      const v1432 = v1431 ? v1431.data : [];
      for (let v1433 = v1425.Calqi(321550, 321550); v1433 < v1432.length; v1433++) {
        let v1434 = v1432[v1433];
        const {
          viewers: _0x319ce0
        } = v1434;
        v1434.id = "m-" + v1434.id;
        v1434.sysType = "monitor";
        const v1435 = await UserModel.getUserListByViewers(_0x319ce0);
        v1434.viewerList = v1435;
      }
      const v1436 = await vRequire26.ajaxInside("post", "" + LOCAL_SERVER + PROJECT_API.EVENT_PROJECT_SIMPLE_LIST_BY_WEBMONITOR_IDS, {
        webMonitorIds: _0x455876
      });
      const v1437 = v1436 ? v1436.data : [];
      for (let v1438 = 0; v1438 < v1437.length; v1438++) {
        let v1439 = v1437[v1438];
        const {
          viewers: _0x1f82fb
        } = v1439;
        v1439.projectType = v1425.teveS;
        v1439.sysType = "event";
        v1439.id = v1425.HOztg("e-", v1439.id);
        const v1440 = await UserModel.getUserListByViewers(_0x1f82fb);
        v1439.viewerList = v1440;
      }
      v1429.projects = [...v1432, ...v1437];
    }
    return v1427;
  }
  static async getTeamList(p1635) {
    const v1441 = {
      dgUou: "success"
    };
    let v1442 = "";
    let v1443 = "";
    let v1444 = "";
    if (p1635.user) {
      v1442 = p1635.user.userId;
      v1443 = p1635.user.userType;
      v1444 = p1635.user.companyId;
    } else {
      const v1445 = p1635.request.body;
      v1442 = v1445.userId;
      v1443 = v1445.userType;
      v1444 = v1445.companyId;
    }
    if (!v1444) {
      p1635.response.status = 401;
      p1635.body = vRequire30.ERROR_401("没有公司ID，请重新登录");
      return;
    }
    const v1446 = await C33.handleTeamList(v1442, v1443, v1444);
    p1635.response.status = 200;
    p1635.body = vRequire30.SUCCESS_200(v1441.dgUou, v1446);
  }
  static async getSimpleTeamList(p1636) {
    const v1447 = {
      NZSrB: function (p1637, p1638) {
        return p1637 ^ p1638;
      }
    };
    let v1448 = "";
    let v1449 = "";
    let v1450 = "";
    if (p1636.user) {
      v1448 = p1636.user.userId;
      v1449 = p1636.user.userType;
      v1450 = p1636.user.companyId;
    } else {
      const v1451 = p1636.request.body;
      v1448 = v1451.userId;
      v1449 = v1451.userType;
      v1450 = v1451.companyId;
    }
    if (!v1450) {
      p1636.response.status = 401;
      p1636.body = vRequire30.ERROR_401("没有公司ID，请重新登录");
      return;
    }
    const v1452 = await TeamModel.getTeamList(v1448, v1449, v1450);
    p1636.response.status = v1447.NZSrB(773458, 773530);
    p1636.body = vRequire30.SUCCESS_200("success", v1452);
  }
  static async getTeamMemberByUser(p1639) {
    const v1453 = {
      irneO: function (p1640, p1641) {
        return p1640 ^ p1641;
      },
      JFElC: function (p1642, p1643) {
        return p1642 ^ p1643;
      }
    };
    const {
      members: _0x5aadce,
      teamId = ""
    } = JSON.parse(p1639.request.body);
    const v1454 = await UserModel.getUserListByMembers(_0x5aadce);
    if (teamId) {
      for (let v1455 = v1453.irneO(966380, 966380); v1455 < v1454.length; v1455++) {
        const {
          userId: _0x2ef054
        } = v1454[v1455];
        const v1456 = await MenuPermissionsModel.getMenuPermissionsFromTeam(teamId, _0x2ef054);
        if (v1456) {
          v1454[v1455].monitorMenu = v1456.monitorMenu;
          v1454[v1455].eventMenu = v1456.eventMenu;
        } else {
          v1454[v1455].monitorMenu = "";
          v1454[v1455].eventMenu = "";
        }
      }
    }
    p1639.response.status = v1453.JFElC(574311, 574383);
    p1639.body = vRequire30.SUCCESS_200("success", v1454);
  }
  static async ["getTeamListWithoutToken"](p1644) {
    const v1457 = p1644.request.body;
    const {
      userId: _0x216a8d,
      userType: _0xe28a94,
      companyId: _0x599b52,
      teamId: _0x4b1db1
    } = v1457;
    if (!_0x599b52) {
      p1644.response.status = 401;
      p1644.body = vRequire30.ERROR_401("没有公司ID，请重新登录");
      return;
    }
    const v1458 = await C33.handleTeamList(_0x216a8d, _0xe28a94, _0x599b52, _0x4b1db1);
    p1644.response.status = 200;
    p1644.body = vRequire30.SUCCESS_200("success", v1458);
  }
  static async getTeams(p1645) {
    let v1459 = "";
    let v1460 = "";
    let v1461 = "";
    if (p1645.user) {
      v1459 = p1645.user.userId;
      v1460 = p1645.user.userType;
      v1461 = p1645.user.companyId;
    } else {
      const v1462 = p1645.request.body;
      v1459 = v1462.userId;
      v1460 = v1462.userType;
      v1461 = v1462.companyId;
    }
    const v1463 = await TeamModel.getTeamList(v1459, v1460, v1461);
    p1645.response.status = 200;
    p1645.body = vRequire30.SUCCESS_200("success", v1463);
  }
  static async addTeamMember(p1646) {
    const v1464 = {
      jnADP: function (p1647, p1648) {
        return p1647 ^ p1648;
      }
    };
    let v1465 = JSON.parse(p1646.request.body);
    const {
      id: _0x1d5218,
      members: _0x13afb4
    } = v1465;
    await TeamModel.updateTeam(_0x1d5218, {
      members: _0x13afb4
    });
    p1646.response.status = v1464.jnADP(697596, 697396);
    p1646.body = vRequire30.SUCCESS_200("success", "");
  }
  static async updateTeamProjects(p1649) {
    const v1466 = {
      evjkh: function (p1650, p1651) {
        return p1650 ^ p1651;
      }
    };
    let v1467 = JSON.parse(p1649.request.body);
    const {
      id: _0x6c82b9,
      webMonitorIds: _0x449b18
    } = v1467;
    const v1468 = await TeamModel.getTeamDetail(_0x6c82b9);
    const v1469 = v1468 ? v1468.webMonitorIds.split(",") : "";
    const v1470 = [];
    v1469.forEach(p1652 => {
      if (_0x449b18 !== p1652) {
        v1470.push(p1652);
      }
    });
    await TeamModel.updateTeam(_0x6c82b9, {
      webMonitorIds: v1470.toString()
    });
    p1649.response.status = v1466.evjkh(720621, 720421);
    p1649.body = vRequire30.SUCCESS_200("success", "");
  }
  static async ["getAllTeamList"](p1653) {
    const v1471 = await TeamModel.getAllTeamList();
    p1653.response.status = 200;
    p1653.body = vRequire30.SUCCESS_200("success", v1471);
  }
  static async getTeamMembersByWebMonitorId(p1654) {
    const v1472 = {
      WSiJl: "success"
    };
    let v1473 = {};
    try {
      v1473 = JSON.parse(p1654.request.body);
    } catch (_0x1bc38c) {
      v1473 = p1654.request.body;
    }
    const {
      webMonitorId: _0x396707
    } = v1473;
    const v1474 = await TeamModel.getTeamMembersByWebMonitorId(_0x396707);
    const v1475 = v1474 && v1474.length > 0 ? v1474[0].members.split(",") : [];
    const v1476 = await UserModel.getUsersByUserIds(v1475);
    p1654.response.status = 200;
    p1654.body = vRequire30.SUCCESS_200(v1472.WSiJl, v1476);
  }
  static async resetTeamLeader(p1655) {
    const v1477 = {
      zKPtU: function (p1656, p1657) {
        return p1656 !== p1657;
      },
      VxlCk: function (p1658, p1659) {
        return p1658 !== p1659;
      },
      NlfNq: "您不是团长，没有权限操作！",
      EweTJ: "success"
    };
    let v1478 = JSON.parse(p1655.request.body);
    const v1479 = v1478.userId;
    const v1480 = v1478.teamId;
    const {
      userId: _0x42d4e1,
      userType: _0x118d48
    } = p1655.user;
    if (v1477.zKPtU(_0x118d48, "admin") && v1477.VxlCk(_0x118d48, "superAdmin")) {
      const v1481 = await TeamModel.checkTeamLeader(v1480, _0x42d4e1);
      if (!v1481 || !v1481.length) {
        p1655.response.status = 412;
        p1655.body = vRequire30.ERROR_412(v1477.NlfNq);
        return;
      }
    }
    const v1482 = await TeamModel.checkTeamMember(v1480, v1479);
    if (!v1482 || !v1482.length) {
      p1655.response.status = 412;
      p1655.body = vRequire30.ERROR_412("目标不是团队成员，无法执行此操作！");
      return;
    }
    await TeamModel.updateTeam(v1480, {
      leaderId: v1479
    });
    p1655.response.status = 200;
    p1655.body = vRequire30.SUCCESS_200(v1477.EweTJ, "");
  }
  static async findTeamListByLeaderId(p1660) {
    const v1483 = {
      EiQLf: "success"
    };
    let v1484 = p1660.request.body;
    const {
      userId: _0x58e651
    } = v1484;
    const v1485 = await TeamModel.findTeamListByLeaderId(_0x58e651);
    p1660.response.status = 200;
    p1660.body = vRequire30.SUCCESS_200(v1483.EiQLf, v1485);
  }
  static async getTeamDetail(p1661) {
    const v1486 = {
      dsTKF: "success"
    };
    let v1487 = JSON.parse(p1661.request.body);
    const {
      chooseTeamId: _0x5de9ba
    } = v1487;
    const v1488 = await TeamModel.getTeamDetail(_0x5de9ba);
    p1661.response.status = 200;
    p1661.body = vRequire30.SUCCESS_200(v1486.dsTKF, v1488);
  }
  static async updateTeam(p1662) {
    const v1489 = {
      eRzgY: function (p1663, p1664) {
        return p1663 + p1664;
      }
    };
    let v1490 = JSON.parse(p1662.request.body);
    const {
      id: _0x31ee5f,
      webMonitorIds: _0x70140b
    } = v1490;
    const v1491 = await TeamModel.getTeamDetail(_0x31ee5f);
    const v1492 = v1489.eRzgY(v1491.webMonitorIds + ",", _0x70140b);
    await TeamModel.updateTeam(_0x31ee5f, {
      webMonitorIds: v1492
    });
    p1662.response.status = 200;
    p1662.body = vRequire30.SUCCESS_200("success", 0);
  }
  static async addViewers(p1665) {
    const v1493 = {
      YgjCJ: "success",
      NRUVA: function (p1666, p1667) {
        return p1666 ^ p1667;
      }
    };
    const v1494 = await C33.handleAllApplicationConfig();
    const {
      monitor: _0x4ab4b7,
      event: _0x3f33ed
    } = v1494;
    const {
      webMonitorId: _0x1d12e4,
      viewerList: _0x42f2d7,
      sysType: _0x1c24a0
    } = JSON.parse(p1665.request.body);
    const v1495 = _0x42f2d7.toString();
    if (_0x1c24a0 === "monitor") {
      const v1496 = await vRequire26.ajaxInside("post", "" + LOCAL_SERVER + PROJECT_API.MONITOR_ADD_VIEWERS, {
        webMonitorId: _0x1d12e4,
        viewers: v1495
      });
      if (!v1496) {
        p1665.response.status = 412;
        p1665.body = vRequire30.ERROR_412("观察者添加失败!");
      } else {
        p1665.response.status = 200;
        p1665.body = vRequire30.SUCCESS_200(v1493.YgjCJ, v1493.NRUVA(194515, 194515));
      }
    } else if (_0x1c24a0 === "event") {
      const v1497 = await vRequire26.ajaxInside("post", "" + LOCAL_SERVER + PROJECT_API.EVENT_ADD_VIEWERS, {
        webMonitorId: _0x1d12e4,
        viewers: v1495
      });
      if (!v1497) {
        p1665.response.status = 412;
        p1665.body = vRequire30.ERROR_412("观察者添加失败!");
      } else {
        p1665.response.status = 200;
        p1665.body = vRequire30.SUCCESS_200(v1493.YgjCJ, 0);
      }
    }
  }
  static async ["forbiddenRightCheck"](p1668) {
    const v1498 = {
      ZBvji: function (p1669, p1670) {
        return p1669 === p1670;
      },
      fLJmp: "superAdmin",
      xltYC: function (p1671, p1672) {
        return p1671 === p1672;
      },
      oALUX: "admin",
      gllxD: function (p1673, p1674) {
        return p1673 ^ p1674;
      },
      zYcVX: "success"
    };
    let v1499 = JSON.parse(p1668.request.body);
    const {
      id: _0x35560a,
      webMonitorId: _0x3cd45b,
      sysType: _0x59c39b
    } = v1499;
    const {
      userId: _0x1e9c3f,
      userType: _0x6c3895
    } = p1668.user;
    let v1500 = "";
    const v1501 = await TeamModel.getTeamMembersByWebMonitorId(_0x3cd45b);
    if (v1501 && v1501.length) {
      v1500 = v1501[0].leaderId;
    }
    if (!v1498.ZBvji(_0x6c3895, v1498.fLJmp) && !v1498.xltYC(_0x6c3895, v1498.oALUX) && v1500 !== _0x1e9c3f) {
      p1668.response.status = 403;
      p1668.body = vRequire30.ERROR_403("你没有权限执行此操作！");
      return;
    }
    p1668.response.status = v1498.gllxD(611500, 611428);
    p1668.body = vRequire30.SUCCESS_200(v1498.zYcVX, 0);
  }
  static async forbiddenProject(p1675) {
    const v1502 = {
      CkQjX: function (p1676, p1677) {
        return p1676 === p1677;
      },
      HDGxQ: "admin",
      jFTkC: "你没有权限执行此操作！",
      EDMUT: function (p1678, p1679) {
        return p1678 ^ p1679;
      },
      IiPfK: "post",
      LvvSo: "禁用失败!",
      vARrz: "event"
    };
    let v1503 = JSON.parse(p1675.request.body);
    const {
      id: _0x27294a,
      webMonitorId: _0x1974ae,
      sysType: _0x41471d
    } = v1503;
    const {
      userId: _0x1912a7,
      userType: _0x159e65
    } = p1675.user;
    let v1504 = "";
    const v1505 = await TeamModel.getTeamMembersByWebMonitorId(_0x1974ae);
    if (v1505 && v1505.length) {
      v1504 = v1505[0].leaderId;
    }
    if (!v1502.CkQjX(_0x159e65, "superAdmin") && _0x159e65 !== v1502.HDGxQ && !v1502.CkQjX(v1504, _0x1912a7)) {
      p1675.response.status = 403;
      p1675.body = vRequire30.ERROR_403(v1502.jFTkC);
      return;
    }
    const v1506 = await C33.handleAllApplicationConfig();
    const {
      monitor: _0xe55eca,
      event: _0x5b4a2a
    } = v1506;
    if (_0x41471d === "monitor") {
      const v1507 = _0x27294a.split("-")[v1502.EDMUT(390010, 390011)];
      const v1508 = await vRequire26.ajaxInside(v1502.IiPfK, "" + LOCAL_SERVER + PROJECT_API.FORBIDDEN_PROJECT, {
        id: v1507
      });
      if (!v1508) {
        p1675.response.status = v1502.EDMUT(441016, 441124);
        p1675.body = vRequire30.ERROR_412(v1502.LvvSo);
      } else {
        p1675.response.status = 200;
        p1675.body = vRequire30.SUCCESS_200("success", v1502.EDMUT(638041, 638041));
      }
    } else if (_0x41471d === v1502.vARrz) {}
  }
  static async deleteProjectRightCheck(p1680) {
    const v1509 = {
      adnly: function (p1681, p1682) {
        return p1681 ^ p1682;
      },
      Rkzrq: "success"
    };
    let v1510 = JSON.parse(p1680.request.body);
    const {
      id: _0x35b922,
      webMonitorId: _0x11d3e2,
      sysType: _0x592e8e
    } = v1510;
    const {
      userId: _0x1b4dfb,
      userType: _0x2ca0a5
    } = p1680.user;
    let v1511 = "";
    const v1512 = await TeamModel.getTeamMembersByWebMonitorId(_0x11d3e2);
    if (v1512 && v1512.length) {
      v1511 = v1512[v1509.adnly(245742, 245742)].leaderId;
    }
    if (_0x2ca0a5 !== "superAdmin" && _0x2ca0a5 !== "admin" && v1511 !== _0x1b4dfb) {
      p1680.response.status = 403;
      p1680.body = vRequire30.ERROR_403("你没有权限执行此操作！");
      return;
    }
    p1680.response.status = 200;
    p1680.body = vRequire30.SUCCESS_200(v1509.Rkzrq, v1509.adnly(280098, 280098));
  }
  static async ["deleteProject"](p1683) {
    const v1513 = {
      AaBPo: "admin",
      AMgfL: function (p1684, p1685) {
        return p1684 ^ p1685;
      },
      LHFzG: function (p1686, p1687) {
        return p1686 ^ p1687;
      },
      xmftP: "success"
    };
    let v1514 = JSON.parse(p1683.request.body);
    const {
      id: _0xb6ea5e,
      webMonitorId: _0x1a57e8,
      sysType: _0x13e523
    } = v1514;
    const {
      userId: _0x3991fe,
      userType: _0x2ae634
    } = p1683.user;
    let v1515 = "";
    const v1516 = await TeamModel.getTeamMembersByWebMonitorId(_0x1a57e8);
    if (v1516 && v1516.length) {
      v1515 = v1516[0].leaderId;
    }
    if (_0x2ae634 !== "superAdmin" && _0x2ae634 !== v1513.AaBPo && v1515 !== _0x3991fe) {
      p1683.response.status = v1513.AMgfL(289360, 289731);
      p1683.body = vRequire30.ERROR_403("你没有权限执行此操作！");
      return;
    }
    const v1517 = await C33.handleAllApplicationConfig();
    const {
      monitor: _0x32e883,
      event: _0x3a7b06
    } = v1517;
    if (_0x13e523 === "monitor") {
      const v1518 = _0xb6ea5e.split("-")[1];
      const v1519 = await vRequire26.ajaxInside("post", "" + LOCAL_SERVER + PROJECT_API.DELETE_PROJECT, {
        id: v1518
      });
      if (!v1519) {
        p1683.response.status = 412;
        p1683.body = vRequire30.ERROR_412("删除失败!");
      } else {
        p1683.response.status = v1513.LHFzG(752014, 751942);
        p1683.body = vRequire30.SUCCESS_200(v1513.xmftP, 0);
      }
    } else if (_0x13e523 === "event") {}
    p1683.response.status = 200;
    p1683.body = vRequire30.SUCCESS_200("success", 0);
  }
}
class C34 {
  static ["delay"](p1688) {
    return new Promise(p1689 => setTimeout(p1689, p1688));
  }
  static async ["updateCompanyDataGeneric"](p1690) {
    const v1520 = {
      nDHBZ: "yyyy-MM",
      JaPMW: function (p1691, p1692) {
        return p1691 * p1692;
      },
      Coskg: function (p1693, p1694) {
        return p1693 ^ p1694;
      },
      BEfRh: function (p1695, p1696) {
        return p1695 ^ p1696;
      }
    };
    const {
      serverUrl: _0x3719aa,
      apiPath: _0x4f023e,
      productType: _0x2f064f,
      logPrefix: _0x342c72,
      dataListKey: _0x2079e7,
      nameListKey: _0x2f7b38
    } = p1690;
    let v1521 = [];
    if (accountInfo.isCloud === true) {
      v1521 = await CompanyModel.getAllActiveCompanyList();
    } else {
      v1521 = await CompanyModel.getAllCompanyList();
    }
    const v1522 = new Date().Format("yyyy-MM-dd");
    const v1523 = new Date().Format(v1520.nDHBZ);
    console.warn("开始串行获取所有公司的" + _0x2f064f + "数据...");
    const v1524 = [];
    for (let v1525 = 0; v1525 < v1521.length; v1525++) {
      const v1526 = v1521[v1525];
      const {
        companyId: _0x526280,
        companyName: _0x17d082
      } = v1526;
      console.warn("获取公司数据: " + _0x17d082 + " (" + (v1525 + 1) + "/" + v1521.length + ")");
      try {
        const v1527 = await vRequire26.postJson("" + _0x3719aa + _0x4f023e, {
          companyId: _0x526280
        }).catch(p1697 => {
          console.error("获取公司 " + _0x17d082 + " " + _0x2f064f + "数据失败:", p1697);
          return null;
        });
        const v1528 = v1527 ? v1527.data : {};
        const v1529 = v1528[_0x2079e7] || {};
        const v1530 = v1528[_0x2f7b38] || {};
        const v1531 = [];
        if (v1529 && v1530) {
          for (let v1532 in v1529) {
            const v1533 = v1529[v1532];
            for (let v1534 in v1533) {
              const v1535 = v1520.JaPMW(v1533[v1534], 1);
              if (v1535 > v1520.Coskg(591174, 591174)) {
                v1531.push({
                  companyId: _0x526280,
                  projectId: v1532,
                  projectName: v1530[v1532],
                  flowType: v1534,
                  flowCount: v1535,
                  productType: _0x2f064f,
                  flowOrigin: "subscribe",
                  monthName: v1523,
                  dayName: v1522
                });
              }
            }
          }
        }
        const v1536 = {
          companyId: _0x526280,
          companyName: _0x17d082,
          dataList: v1529,
          flowDataItems: v1531,
          hasData: v1531.length > v1520.Coskg(714290, 714290)
        };
        v1524.push(v1536);
        if (v1525 < v1521.length - 1) {
          console.warn("公司 " + _0x17d082 + " 数据获取完成，延迟10秒后处理下一个公司...");
          await this.delay(v1520.Coskg(738536, 746488));
        }
      } catch (_0x437cf9) {
        console.error("处理公司 " + _0x17d082 + " " + _0x2f064f + "数据时发生错误:", _0x437cf9);
        v1524.push({
          companyId: _0x526280,
          companyName: _0x17d082,
          dataList: {},
          flowDataItems: [],
          hasData: false
        });
        if (v1525 < v1521.length - 1) {
          console.warn("公司 " + _0x17d082 + " 处理出错，延迟10秒后处理下一个公司...");
          await this.delay(10000);
        }
      }
    }
    console.warn("所有公司" + _0x2f064f + "数据获取完成");
    console.warn("开始批量处理" + _0x2f064f + "数据库操作...");
    const v1537 = [];
    const v1538 = new Map();
    v1524.forEach(p1698 => {
      p1698.flowDataItems.forEach(p1699 => {
        const v1539 = p1699.projectId + "_" + p1699.flowType;
        v1537.push({
          projectId: p1699.projectId,
          flowType: p1699.flowType,
          dayName: v1522
        });
        v1538.set(v1539, p1699);
      });
    });
    const v1540 = new Map();
    if (v1537.length > v1520.BEfRh(811371, 811371)) {
      try {
        const v1541 = v1537.map(async p1700 => {
          const v1542 = p1700.projectId + "_" + p1700.flowType;
          try {
            const v1543 = await FlowDataInfoByDayModel.findByProjectIdAndDayName(p1700.projectId, p1700.dayName, p1700.flowType);
            return {
              key: v1542,
              result: v1543
            };
          } catch (_0x282760) {
            console.error("查询" + _0x2f064f + "数据 " + v1542 + " 失败:", _0x282760);
            return {
              key: v1542,
              result: null
            };
          }
        });
        const v1544 = await Promise.all(v1541);
        v1544.forEach(({
          key: _0x2cb7f5,
          result: _0x3b9185
        }) => {
          v1540.set(_0x2cb7f5, _0x3b9185);
        });
      } catch (_0x2446f0) {
        console.error("批量查询现有" + _0x2f064f + "记录失败:", _0x2446f0);
      }
    }
    const v1545 = [];
    const v1546 = [];
    v1538.forEach((p1701, p1702) => {
      const v1547 = v1540.get(p1702);
      if (v1547 && v1547.length > 0) {
        v1545.push(FlowDataInfoByDayModel.updateFlowCount(v1547[0].id, {
          flowCount: p1701.flowCount
        }, p1701.dayName).catch(p1703 => {
          console.error("更新" + _0x2f064f + "数据 " + p1702 + " 失败:", p1703);
        }));
      } else {
        v1546.push(FlowDataInfoByDayModel.createFlowDataInfoByDay(p1701).catch(p1704 => {
          console.error("创建" + _0x2f064f + "数据 " + p1702 + " 失败:", p1704);
        }));
      }
    });
    if (v1545.length > 0) {
      console.warn("并行执行 " + v1545.length + " 个" + _0x2f064f + "数据更新操作...");
      await Promise.all(v1545);
    }
    if (v1546.length > 0) {
      console.warn("并行执行 " + v1546.length + " 个" + _0x2f064f + "数据创建操作...");
      await Promise.all(v1546);
    }
    for (let v1548 = 0; v1548 < v1524.length; v1548++) {
      const v1549 = v1524[v1548];
      console.warn(_0x342c72 + "公司 " + v1549.companyName + " 流量信息:", v1549.dataList);
    }
    console.warn(_0x342c72 + "所有公司" + _0x2f064f + "数据更新完成");
  }
  static async updateCompanyDataForMonitor() {
    const v1550 = {
      qorwz: "【监控】"
    };
    await this.updateCompanyDataGeneric({
      serverUrl: MONITOR_LOCAL_SERVER,
      apiPath: PROJECT_API.GET_LOG_COUNT_INFO_BY_DAY,
      productType: "monitor",
      logPrefix: v1550.qorwz,
      dataListKey: "logCountList",
      nameListKey: "projectNameList"
    });
  }
  static async ["updateCompanyDataForEvent"]() {
    const v1551 = {
      lDSCZ: "eventLogCountList"
    };
    await this.updateCompanyDataGeneric({
      serverUrl: EVENT_LOCAL_SERVER,
      apiPath: PROJECT_API.GET_EVENT_LOG_COUNT_INFO_BY_DAY,
      productType: "event",
      logPrefix: "【埋点】",
      dataListKey: v1551.lDSCZ,
      nameListKey: "eventProjectNameList"
    });
  }
  static async ["calculateCountByDay"](p1705) {}
  static async ["handleProject"](p1706) {
    const v1552 = {
      GkvuE: function (p1707, p1708) {
        return p1707 ^ p1708;
      }
    };
    const v1553 = await ProjectModel.getAllProjectList();
    for (let v1554 = v1552.GkvuE(547989, 547989); v1554 < v1553.length; v1554++) {
      const {
        webMonitorId: _0x4d7a6e,
        pageAggregation: _0x2b8c8b,
        httpAggregation: _0x675865
      } = v1553[v1554];
      p1706({
        webMonitorId: _0x4d7a6e,
        userTag: "",
        p: v1554,
        projectList: v1553,
        pageAggregation: _0x2b8c8b,
        httpAggregation: _0x675865
      });
    }
  }
  static async ["handleProjectWithTag"](p1709) {
    const v1555 = {
      glrWd: function (p1710, p1711) {
        return p1710 ^ p1711;
      },
      IUxUV: function (p1712, p1713) {
        return p1712 === p1713;
      }
    };
    const v1556 = await ProjectModel.getAllProjectList();
    for (let v1557 = 0; v1557 < v1556.length; v1557++) {
      const v1558 = v1556[v1557].webMonitorId;
      const v1559 = v1556[v1557].userTag;
      const v1560 = [""];
      let v1561 = v1559 ? v1559.split(",") : [];
      if (v1561.length !== v1555.glrWd(308162, 308163) || !v1555.IUxUV(v1561[0], "")) {
        v1561 = v1560.concat(v1561);
      }
      for (let v1562 = 0; v1562 < v1561.length; v1562++) {
        let v1563 = v1561[v1562];
        p1709(v1558, v1563);
      }
    }
  }
  static async checkFreeLicense() {
    let v1564 = false;
    const v1565 = await vRequire26.postJson("" + MONITOR_LOCAL_SERVER + PROJECT_API.MONITOR_BASE_INFO, {}).catch(p1714 => {
      console.error(p1714);
    });
    const v1566 = await vRequire26.getJson("" + EVENT_LOCAL_SERVER + PROJECT_API.GET_EVENT_SYS_INFO, {}).catch(p1715 => {
      console.error(p1715);
    });
    const v1567 = v1565.data;
    const v1568 = v1566.data;
    if (v1567.totalProjectCount <= 3 && v1568.totalProjectCount <= 3) {
      v1564 = true;
    }
    return v1564;
  }
}
class C35 {
  static async create(p1716) {
    const v1569 = {
      YVpeZ: function (p1717, p1718) {
        return p1717 ^ p1718;
      },
      xIVRN: "创建信息失败，请求参数不能为空！"
    };
    let v1570 = p1716.request.body;
    if (v1570.title && v1570.author && v1570.content && v1570.category) {
      let v1571 = await ConfigModel.createConfig(v1570);
      let v1572 = await ConfigModel.getConfigDetail(v1571.id);
      p1716.response.status = 200;
      p1716.body = vRequire30.SUCCESS_200("创建信息成功", v1572);
    } else {
      p1716.response.status = v1569.YVpeZ(171999, 171587);
      p1716.body = vRequire30.ERROR_412(v1569.xIVRN);
    }
  }
}
class C36 {
  static async createNewMessage(p1719) {
    const v1573 = {
      nOZMz: "创建信息成功",
      kOWNd: function (p1720, p1721) {
        return p1720 ^ p1721;
      }
    };
    let v1574 = JSON.parse(p1719.request.body);
    const {
      id: _0x4fe606,
      ruleName: _0x276225,
      loopTime: _0x10c91d,
      quietStartTime: _0x5f5492,
      quietEndTime: _0x275d29
    } = v1574;
    const v1575 = JSON.stringify(v1574.ruleList);
    const v1576 = {
      ruleName: _0x276225,
      loopTime: _0x10c91d,
      quietStartTime: _0x5f5492,
      quietEndTime: _0x275d29,
      ruleList: v1575
    };
    if (_0x276225) {
      if (_0x4fe606) {
        v1576.id = _0x4fe606;
        await MessageModel.updateMessage(_0x4fe606, v1576);
      } else {
        await MessageModel.createMessage(v1576);
      }
      p1719.response.status = 200;
      p1719.body = vRequire30.SUCCESS_200(v1573.nOZMz, 0);
    } else {
      p1719.response.status = v1573.kOWNd(723017, 723413);
      p1719.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async ["getAllMessage"](p1722) {
    let v1577 = p1722.request.body;
    const v1578 = JSON.parse(v1577);
    let v1579 = await MessageModel.getAllMessage(v1578);
    p1722.response.status = 200;
    p1722.body = vRequire30.SUCCESS_200("查询信息列表成功！", v1579);
  }
  static async ["getMessageByType"](p1723) {
    const v1580 = {
      czqws: function (p1724, p1725) {
        return p1724 ^ p1725;
      },
      AnKom: function (p1726, p1727) {
        return p1726 ^ p1727;
      },
      kPGzP: "查询信息列表成功！"
    };
    let v1581 = p1723.request.body;
    const v1582 = JSON.parse(v1581);
    const {
      userId: _0x207d49
    } = p1723.user;
    v1582.userId = _0x207d49;
    let v1583 = await MessageModel.getMessageByType(v1582);
    let v1584 = await MessageModel.getUnReadMessageCountByType(v1582);
    let v1585 = 0;
    let v1586 = v1580.czqws(658565, 658565);
    if (v1584) {
      v1584.forEach(p1728 => {
        if (p1728.isRead === 0) {
          v1585 = parseInt(p1728.count, 10);
        }
        v1586 += parseInt(p1728.count, 10);
      });
    }
    const v1587 = {
      messages: v1583,
      unReadCount: v1585,
      total: v1586
    };
    p1723.response.status = v1580.AnKom(710343, 710159);
    p1723.body = vRequire30.SUCCESS_200(v1580.kPGzP, v1587);
  }
  static async readMessage(p1729) {
    let v1588 = JSON.parse(p1729.request.body);
    const {
      messageId: _0xf06b1d
    } = v1588;
    const v1589 = MessageModel.getMessageDetail(_0xf06b1d);
    v1589.isRead = 1;
    await MessageModel.updateMessage(_0xf06b1d, v1589);
    p1729.response.status = 200;
    p1729.body = vRequire30.SUCCESS_200("查询信息列表成功！", 0);
  }
  static async readAll(p1730) {
    const v1590 = {
      rJnNA: function (p1731, p1732) {
        return p1731 ^ p1732;
      }
    };
    let v1591 = JSON.parse(p1730.request.body);
    const {
      messageType: _0x3faf3b
    } = v1591;
    const {
      userId: _0x26f104
    } = p1730.user;
    MessageModel.readAll(_0x26f104, _0x3faf3b);
    p1730.response.status = v1590.rJnNA(984702, 984758);
    p1730.body = vRequire30.SUCCESS_200("查询信息列表成功！", 0);
  }
  static async detail(p1733) {
    return await MessageModel.getMessageDetail(p1733);
  }
  static async deleteMessage(p1734) {
    const v1592 = {
      kiVRG: "success",
      lJKSz: function (p1735, p1736) {
        return p1735 ^ p1736;
      }
    };
    let v1593 = JSON.parse(p1734.request.body);
    const {
      id: _0x3b8a60
    } = v1593;
    await MessageModel.deleteMessage(_0x3b8a60);
    p1734.response.status = 200;
    p1734.body = vRequire30.SUCCESS_200(v1592.kiVRG, v1592.lJKSz(764813, 764813));
  }
  static async saveLastVersionInfo() {
    const v1594 = {
      sfCYl: "https://www.webfunny.cn/update.html"
    };
    await vRequire26.get("http://www.webfunny.cn/config/lastVersionInfo", {}).then(async p1737 => {
      const v1595 = p1737.data;
      const {
        updateDate: _0x40acc6,
        version: _0x13aa8d,
        updateContent: _0x220345,
        upgradeGuide: _0x10e4da,
        updateDatabase: _0x31b7f5
      } = v1595;
      const v1596 = new Date().Format("yyyy-MM-dd");
      if (_0x40acc6 === v1596) {
        const v1597 = await UserModel.getAllUserInfoForSimple();
        v1597.map(async p1738 => {
          const {
            userId: _0x1308c0
          } = p1738;
          await MessageModel.createMessage({
            userId: _0x1308c0,
            title: "版本号：" + _0x13aa8d,
            content: JSON.stringify([_0x220345, _0x10e4da, _0x31b7f5]),
            type: "update",
            isRead: 0,
            link: v1594.sfCYl
          });
        });
      }
    }).catch(p1739 => {
      console.error(p1739);
    });
  }
}
class C37 {
  static async getAllNoticeTemplate(p1740) {
    const v1598 = {
      zveau: "查询成功"
    };
    const v1599 = await NoticeTemplateModel.getAllNoticeTemplate();
    p1740.response.status = 200;
    p1740.body = vRequire30.SUCCESS_200(v1598.zveau, v1599);
  }
  static async ["getNoticeTemplate"](p1741) {
    const v1600 = {
      neyzu: "noticePeopleName",
      OFDHg: function (p1742, p1743) {
        return p1742 ^ p1743;
      },
      bMHEJ: function (p1744, p1745) {
        return p1744 * p1745;
      },
      pjLzB: function (p1746, p1747) {
        return p1746(p1747);
      },
      nTeoH: "noticeSetting"
    };
    let v1601 = vRequire26.parseQs(p1741.request.url);
    const {
      userId: _0x4b2617,
      userType: _0x5ec1cb,
      companyId: _0x2a4287
    } = p1741.user;
    const {
      page = v1600.OFDHg(160328, 160329),
      pageSize = 10,
      noticeType: _0x126155,
      keyword: _0x258f69
    } = v1601;
    const v1602 = v1600.bMHEJ(Number(page) - 1, v1600.pjLzB(Number, pageSize));
    const vNumber8 = Number(pageSize);
    const v1603 = await NoticeTemplateModel.pageNoticeTemplate(v1602, vNumber8, _0x2a4287);
    const v1604 = await UserModel.getUserList();
    v1603.forEach((p1748, p1749, p1750) => {
      const {
        modifyPeopleId: _0x255997
      } = p1748;
      const v1605 = v1604.find(p1751 => p1751.userId === _0x255997)?.["nickname"];
      p1750[p1749].modifyPeopleName = v1605;
    });
    const v1606 = await TeamModel.getTeamList(_0x4b2617, _0x5ec1cb, _0x2a4287);
    const v1607 = await NoticeTemplateModel.countNoticeTemplate();
    const v1608 = [];
    for (const v1609 of v1603) {
      const {
        noticeTemplateId: _0x2f2b9e,
        noticeType: _0x4658c0,
        templateName: _0x182cc2
      } = v1609;
      const v1610 = await NoticeSettingModel.getNoticeSettingsById(_0x2f2b9e);
      const v1611 = !!_0x126155 && !_0x4658c0.split(",").some(p1752 => p1752 == _0x126155);
      const v1612 = !!_0x258f69 && !_0x182cc2.includes(_0x258f69);
      if (v1611 || v1612) {
        continue;
      }
      v1610.forEach((p1753, p1754, p1755) => {
        const {
          noticePeopleId: _0x3a5e03,
          noticeTeamId: _0x3663d7
        } = p1753;
        if (_0x3a5e03) {
          const v1613 = v1604.find(p1756 => p1756.userId === _0x3a5e03)?.nickname;
          p1755[p1754][v1600.neyzu] = v1613;
        }
        if (_0x3663d7) {
          const v1614 = v1606.find(p1757 => p1757.companyId === _0x3663d7)?.["teamName"];
          p1755[p1754].noticeTeamName = v1614;
        }
      });
      v1609[v1600.nTeoH] = v1610;
      v1608.push(v1609);
    }
    p1741.response.status = 200;
    p1741.body = vRequire30.SUCCESS_200("查询成功", {
      total: v1607,
      noticeTemplates: v1608
    });
  }
  static async createNoticeTemplate(p1758) {
    const v1615 = {
      lORWy: function (p1759, p1760) {
        return p1759 ^ p1760;
      },
      LkoYB: "创建通知模板成功"
    };
    const {
      templateName: _0x746194,
      noticeType: _0x43c2c8,
      noticeSetting: _0x3ee4c4,
      modifyPeopleId: _0x4d3364
    } = JSON.parse(p1758.request.body);
    const {
      companyId: _0x379238
    } = p1758.user;
    const v1616 = vRequire26.getUuid();
    await NoticeTemplateModel.createNoticeTemplate({
      companyId: _0x379238,
      noticeTemplateId: v1616,
      templateName: _0x746194,
      noticeType: _0x43c2c8,
      modifyPeopleId: _0x4d3364,
      lastModified: vRequire24().format("YYYY-MM-DD HH:mm:ss")
    });
    for (const v1617 of _0x3ee4c4) {
      const {
        noticePeopleId: _0x2e3de0,
        noticeTeamId: _0x5917cd,
        channel: _0x40d910,
        cycle: _0x4a2579,
        slienceTime: _0x5efece
      } = v1617;
      const v1618 = vRequire26.getUuid();
      await NoticeSettingModel.createNoticeSetting({
        noticeSettingId: v1618,
        noticePeopleId: _0x2e3de0,
        noticeTeamId: _0x5917cd,
        channel: _0x40d910,
        cycle: _0x4a2579,
        noticeTemplateId: v1616,
        slienceTime: _0x5efece
      });
    }
    p1758.response.status = v1615.lORWy(143580, 143380);
    p1758.body = vRequire30.SUCCESS_200(v1615.LkoYB, v1615.lORWy(945831, 945831));
  }
  static async getNoticeTemplateById(p1761) {
    let v1619 = vRequire26.parseQs(p1761.request.url);
    const {
      noticeTemplateId: _0x511a05
    } = v1619;
    const v1620 = await NoticeTemplateModel.getNoticeTemplateById(_0x511a05);
    const v1621 = v1620[0];
    const v1622 = await NoticeSettingModel.getNoticeSettingsById(_0x511a05);
    v1621.noticeSetting = v1622;
    p1761.response.status = 200;
    p1761.body = vRequire30.SUCCESS_200("根据ID查询成功", v1621);
  }
  static async ["deleteNoticeTemplate"](p1762) {
    const v1623 = {
      hmmaD: function (p1763, p1764) {
        return p1763 ^ p1764;
      },
      WCfGi: "删除成功"
    };
    let v1624 = vRequire26.parseQs(p1762.request.url);
    const {
      noticeTemplateId: _0x1e4bc6
    } = v1624;
    const v1625 = await AlarmRuleModel.getAlarmRuleByRelatedNoticeId(_0x1e4bc6);
    let v1626 = "";
    if (v1625 && v1625.length) {
      v1625.forEach(p1765 => {
        v1626 += "[" + p1765.ruleName + "] ";
      });
      p1762.response.status = 412;
      p1762.body = vRequire30.ERROR_412("通知模板被" + v1626 + "绑定，无法删除", 0);
      return;
    }
    await NoticeTemplateModel.deleteNoticeTemplate(_0x1e4bc6);
    await NoticeSettingModel.deleteNoticeSetting(_0x1e4bc6);
    p1762.response.status = v1623.hmmaD(766275, 766347);
    p1762.body = vRequire30.SUCCESS_200(v1623.WCfGi, 0);
  }
  static async updateNoticeTemplate(p1766) {
    const v1627 = {
      aaUcJ: function (p1767, p1768) {
        return p1767 ^ p1768;
      }
    };
    const {
      templateName: _0xe7a81d,
      noticeType: _0x9fc5d7,
      modifyPeopleId: _0x32222a,
      noticeSetting: _0x326165,
      id: _0x11e1c5,
      noticeTemplateId: _0x17ff3f
    } = JSON.parse(p1766.request.body);
    await NoticeTemplateModel.updateNoticeTemplate(_0x11e1c5, {
      templateName: _0xe7a81d,
      noticeType: _0x9fc5d7,
      modifyPeopleId: _0x32222a,
      lastModified: vRequire24().format("YYYY-MM-DD HH:mm:ss")
    });
    await NoticeSettingModel.deleteNoticeSetting(_0x17ff3f);
    for (const v1628 of _0x326165) {
      const {
        noticePeopleId: _0x3af71e,
        noticeTeamId: _0x9b9935,
        channel: _0x4040e2,
        cycle: _0x1aa776,
        slienceTime: _0x26826e
      } = v1628;
      const v1629 = vRequire26.getUuid();
      await NoticeSettingModel.createNoticeSetting({
        noticeSettingId: v1629,
        noticePeopleId: _0x3af71e,
        noticeTeamId: _0x9b9935,
        channel: _0x4040e2,
        cycle: _0x1aa776,
        noticeTemplateId: _0x17ff3f,
        slienceTime: _0x26826e
      });
    }
    p1766.response.status = 200;
    p1766.body = vRequire30.SUCCESS_200("更新成功", v1627.aaUcJ(802578, 802578));
  }
}
class C38 {
  static ["sendEmail"](p1769, p1770, p1771) {
    const v1630 = {
      EGRGW: function (p1782, p1783, p1784) {
        return p1782(p1783, p1784);
      }
    };
    if (accountInfo.useCusEmailSys === true) {
      vRequire28.sendEmail(p1769, p1770, p1771, accountInfo.emailUser, accountInfo.emailPassword);
    } else {
      v1630.EGRGW(vRequire31, "http://www.webfunny.cn/config/sendEmail", {
        method: "POST",
        body: JSON.stringify({
          email: p1769,
          title: p1770,
          content: p1771
        }),
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        }
      }).catch(p1790 => {
        console.log(p1790);
      });
    }
  }
  static async ["create"](p1791) {
    const v1631 = {
      PPPke: function (p1792, p1793) {
        return p1792 || p1793;
      }
    };
    const v1632 = JSON.parse(p1791.request.body);
    const {
      funnelName: _0x436ae5,
      funnelIds: _0x3d5a89
    } = v1632;
    const v1633 = {
      funnelName: _0x436ae5,
      funnelIds: _0x3d5a89
    };
    if (v1632.funnelName) {
      let v1634 = await UserModel.createUser(v1633);
      let v1635 = await UserModel.getUserDetail(v1634.id);
      p1791.response.status = 200;
      p1791.body = vRequire30.SUCCESS_200("创建信息成功", v1631.PPPke(v1635, {}));
    } else {
      p1791.response.status = 412;
      p1791.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async getUserList(p1794) {
    const v1636 = {
      YXRjY: "查询信息列表失败！"
    };
    let v1637 = p1794.request.body;
    if (v1637) {
      const v1638 = await UserModel.getUserList();
      p1794.response.status = 200;
      p1794.body = vRequire30.SUCCESS_200("查询信息列表成功！", v1638);
    } else {
      p1794.response.status = 412;
      p1794.body = vRequire30.ERROR_412(v1636.YXRjY);
    }
  }
  static async getUserListForTeam(p1795) {
    const v1639 = {
      aZtDY: "查询信息列表成功！",
      BiWAi: function (p1796, p1797) {
        return p1796 ^ p1797;
      }
    };
    const {
      projectId: _0x27fe8a
    } = JSON.parse(p1795.request.body);
    const v1640 = await TeamModel.getTeamMembersByWebMonitorId(_0x27fe8a);
    if (!v1640 || !v1640.length) {
      p1795.response.status = 200;
      p1795.body = vRequire30.SUCCESS_200(v1639.aZtDY, []);
      return;
    }
    const {
      members: _0x452fd8
    } = v1640[0];
    const v1641 = await UserModel.getUserListByMembers(_0x452fd8);
    p1795.response.status = v1639.BiWAi(481449, 481377);
    p1795.body = vRequire30.SUCCESS_200("查询信息列表成功！", v1641);
  }
  static async hasSuperAdminAccount(p1798) {
    const v1642 = {
      mhHFV: function (p1799, p1800) {
        return p1799 * p1800;
      }
    };
    const v1643 = await UserModel.checkAdminAccount();
    const v1644 = v1642.mhHFV(v1643[0].count, 1);
    const {
      registerEntry: _0x1eb63d,
      resetPwdEntry: _0x3dbd61,
      thirdLoginConfig: _0x5c0f7b
    } = accountInfo;
    p1798.response.status = 200;
    p1798.body = vRequire30.SUCCESS_200("查询信息列表成功！", {
      adminUserCount: v1644,
      registerEntry: _0x1eb63d,
      resetPwdEntry: _0x3dbd61,
      thirdLoginConfig: _0x5c0f7b
    });
  }
  static async checkTokenExist(p1801) {
    const v1645 = await UserModel.checkTokenExist();
    p1801.response.status = 200;
    p1801.body = vRequire30.SUCCESS_200("查询信息列表成功！", adminUserCount);
  }
  static async getUserInfo(p1802) {
    const v1646 = {
      gXtOX: "你没有权限执行此操作！",
      TUBcg: function (p1803, p1804) {
        return p1803 ^ p1804;
      },
      sLikL: "查询信息列表成功！"
    };
    let v1647 = p1802.user;
    let v1648 = {};
    if (typeof p1802.request.body === "string") {
      v1648 = JSON.parse(p1802.request.body);
    } else {
      v1648 = p1802.request.body;
    }
    const {
      userId: _0xb428f9,
      projectId = ""
    } = v1648;
    if (v1647.userType !== "superAdmin" && v1647.userType !== "admin" && v1647.userId !== _0xb428f9) {
      p1802.response.status = 412;
      p1802.body = vRequire30.ERROR_412(v1646.gXtOX);
      return;
    }
    const v1649 = await UserModel.getUserInfo(_0xb428f9);
    if (!v1649 || !v1649[0]) {
      p1802.response.status = v1646.TUBcg(984947, 985019);
      p1802.body = vRequire30.SUCCESS_200("查询信息列表成功！", {});
      return;
    }
    const {
      companyId: _0x5b25f9
    } = v1649[0];
    let v1650 = "";
    if (projectId) {
      const v1651 = await TeamModel.getTeamMembersByWebMonitorId(projectId);
      if (v1651 && v1651.length) {
        v1650 = v1651[0].leaderId;
      }
    }
    const v1652 = await CompanyModel.getCompanyInfo(_0x5b25f9);
    const v1653 = {
      ...v1649[0],
      isTeamLeader: v1650 === _0xb428f9,
      company: v1652
    };
    p1802.response.status = 200;
    p1802.body = vRequire30.SUCCESS_200(v1646.sLikL, v1653);
  }
  static async getUserListByAdmin(p1805) {
    const v1654 = {
      WJdeM: function (p1806, p1807) {
        return p1806 !== p1807;
      },
      iCfbd: "非管理员，无权调用此接口！",
      EUBiB: "没有公司ID，请重新登录",
      tdbdK: function (p1808, p1809) {
        return p1808 ^ p1809;
      }
    };
    let v1655 = p1805.request.body;
    const {
      status: _0x2b5386
    } = v1655;
    const {
      userType: _0x5b13b9,
      companyId = ""
    } = p1805.user;
    if (_0x5b13b9 !== "admin" && v1654.WJdeM(_0x5b13b9, "superAdmin")) {
      p1805.response.status = 412;
      p1805.body = vRequire30.ERROR_412(v1654.iCfbd);
      return;
    }
    if (!companyId) {
      p1805.response.status = 401;
      p1805.body = vRequire30.ERROR_401(v1654.EUBiB);
      return;
    }
    if (v1655) {
      const v1656 = await UserModel.getUserListByAdmin(_0x2b5386, companyId);
      p1805.response.status = 200;
      p1805.body = vRequire30.SUCCESS_200("查询信息列表成功！", v1656);
    } else {
      p1805.response.status = v1654.tdbdK(346470, 346362);
      p1805.body = vRequire30.ERROR_412("查询信息列表失败！");
    }
  }
  static async ["getAllUserInfoForSimple"](p1810) {
    const {
      companyId: _0x4570d4
    } = p1810.user;
    const v1657 = await UserModel.getAllUserInfoForSimple(_0x4570d4);
    p1810.response.status = 200;
    p1810.body = vRequire30.SUCCESS_200("查询信息列表成功！", v1657);
  }
  static async detail(p1811) {
    const v1658 = {
      ejaPZ: function (p1812, p1813) {
        return p1812 ^ p1813;
      },
      ijNNE: "信息ID必须传"
    };
    let v1659 = p1811.params.id;
    if (v1659) {
      let v1660 = await UserModel.getUserDetail(v1659);
      p1811.response.status = 200;
      p1811.body = vRequire30.SUCCESS_200("查询成功！", v1660);
    } else {
      p1811.response.status = v1658.ejaPZ(984444, 984288);
      p1811.body = vRequire30.ERROR_412(v1658.ijNNE);
    }
  }
  static async delete(p1814) {
    const v1661 = {
      BrVRB: function (p1815, p1816) {
        return p1815(p1816);
      },
      oYsmD: function (p1817, p1818) {
        return p1817 ^ p1818;
      },
      FvEFs: "删除信息成功！",
      aXtTJ: "信息ID必须传！"
    };
    let v1662 = JSON.parse(p1814.request.body);
    let v1663 = v1662.id;
    if (v1663 && !v1661.BrVRB(isNaN, v1663)) {
      await UserModel.deleteUser(v1663);
      p1814.response.status = v1661.oYsmD(938785, 938985);
      p1814.body = vRequire30.SUCCESS_200(v1661.FvEFs);
    } else {
      p1814.response.status = 412;
      p1814.body = vRequire30.ERROR_412(v1661.aXtTJ);
    }
  }
  static async ["update"](p1819) {
    const v1664 = {
      vGVVy: function (p1820, p1821) {
        return p1820 ^ p1821;
      }
    };
    let v1665 = p1819.request.body;
    let v1666 = p1819.params.id;
    if (v1665) {
      await UserModel.updateUser(v1666, v1665);
      let v1667 = await UserModel.getUserDetail(v1666);
      p1819.response.status = v1664.vGVVy(124236, 124292);
      p1819.body = vRequire30.SUCCESS_200("更新信息成功！", v1667);
    } else {
      p1819.response.status = 412;
      p1819.body = vRequire30.ERROR_412("更新信息失败！");
    }
  }
  static async getUserByPhone(p1822) {
    const v1668 = {
      dHLDR: function (p1823, p1824) {
        return p1823 ^ p1824;
      }
    };
    const {
      phone: _0x2d987e
    } = p1822.request.body;
    const v1669 = await UserModel.getUserByPhone(_0x2d987e);
    p1822.response.status = v1668.dHLDR(614571, 614499);
    p1822.body = vRequire30.SUCCESS_200("更新信息成功！", v1669);
  }
  static async ["setValidateCode"]() {
    const v1670 = {
      rPNUn: "0123456789ABCDEFGHGKLMNOPQRSTUVWXYZabcdefghigkmnopqrstuvwxyz",
      MnhiB: function (p1825, p1826) {
        return p1825 * p1826;
      }
    };
    const v1671 = {
      "0": "M",
      "1": "N",
      "2": "O",
      "3": "P",
      "4": "Q",
      "5": "R",
      "6": "S",
      "7": "T",
      "8": "U"
    };
    const v1672 = v1670.rPNUn;
    let v1673 = "";
    for (let v1674 = 0; v1674 < 32; v1674++) {
      const v1675 = Math.floor(v1670.MnhiB(Math.random(), v1672.length - 1) + 1);
      const v1676 = v1671[v1672.charAt(v1675)];
      if (v1676) {
        v1673 += v1676;
      } else {
        v1673 += v1672.charAt(v1675);
      }
    }
    const v1677 = vRequire26.b64EncodeUnicode(v1673);
    const v1678 = await ConfigModel.getConfigByConfigName("loginValidateCode");
    if (v1678 && v1678.length > 0) {
      await ConfigModel.updateConfig("loginValidateCode", {
        configValue: v1677
      });
    } else {
      await ConfigModel.createConfig({
        configName: "loginValidateCode",
        configValue: v1677
      });
    }
    return v1673;
  }
  static async ["refreshValidateCode"](p1827) {
    const v1679 = {
      YiUwu: function (p1828, p1829) {
        return p1828 * p1829;
      },
      QVvJi: function (p1830, p1831) {
        return p1830 ^ p1831;
      }
    };
    const v1680 = await C38.setValidateCode();
    if (global.centerInfo.loginValidateCodeTimer) {
      clearInterval(global.centerInfo.loginValidateCodeTimer);
    } else {
      global.centerInfo.loginValidateCodeTimer = setInterval(() => {
        C38.setValidateCode();
      }, v1679.YiUwu(v1679.QVvJi(474630, 474627), 60) * 1000);
    }
    p1827.response.status = 200;
    p1827.body = vRequire30.SUCCESS_200("success", v1680);
  }
  static async getValidateCode(p1832) {
    const v1681 = {
      HdEAU: function (p1833, p1834) {
        return p1833 ^ p1834;
      },
      ffbja: "success"
    };
    const v1682 = await ConfigModel.getConfigByConfigName("loginValidateCode");
    if (v1682 && v1682.length) {
      const v1683 = v1682[0].configValue;
      p1832.response.status = 200;
      p1832.body = vRequire30.SUCCESS_200("success", v1683);
    } else {
      p1832.response.status = v1681.HdEAU(784773, 784717);
      p1832.body = vRequire30.SUCCESS_200(v1681.ffbja, code);
    }
  }
  static async ["login"](p1835) {
    const v1684 = {
      jLHsY: function (p1836, p1837) {
        return p1836 ^ p1837;
      },
      wqdBP: function (p1838, p1839) {
        return p1838 ^ p1839;
      },
      higDu: function (p1840, p1841) {
        return p1840 ^ p1841;
      },
      IpjMd: "验证码不正确，请重新输入！",
      wubjC: "^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\\d{8}$",
      AGUvH: function (p1842, p1843) {
        return p1842 === p1843;
      },
      wUfQD: function (p1844, p1845) {
        return p1844 ^ p1845;
      },
      GZUkw: "此账号尚未激活，请联系管理员，在「用户管理」中激活此账号！",
      iuZyQ: function (p1846, p1847) {
        return p1846 * p1847;
      }
    };
    const v1685 = JSON.parse(p1835.request.body);
    const {
      emailName: _0x4819a7,
      password: _0x146e62,
      code: _0xdcf78b,
      webfunnyToken: _0x5d29f5
    } = v1685;
    const v1686 = vRequire26.b64DecodeUnicode(_0x146e62).split("").reverse().join("");
    const v1687 = await ConfigModel.getConfigByConfigName("loginValidateCode");
    const v1688 = vRequire26.b64DecodeUnicode(v1687[v1684.jLHsY(223134, 223134)].configValue);
    const v1689 = v1688.substring(5, v1684.jLHsY(284912, 284918));
    const v1690 = v1688.substring(v1684.wqdBP(466658, 466665), 12);
    const v1691 = v1688.substring(23, v1684.higDu(174320, 174312));
    const v1692 = v1688.substring(27, 28);
    const v1693 = ("" + v1689 + v1690 + v1691 + v1692).toLowerCase();
    const v1694 = _0xdcf78b.toLowerCase();
    if (v1693 != v1694) {
      C38.setValidateCode();
      p1835.response.status = 412;
      p1835.body = vRequire30.ERROR_412(v1684.IpjMd);
      return;
    }
    const v1695 = {
      password: vRequire26.md5(v1686)
    };
    const v1696 = new RegExp(v1684.wubjC, "");
    if (v1696.test(_0x4819a7)) {
      v1695.phone = _0x4819a7;
    } else {
      v1695.emailName = _0x4819a7;
    }
    const v1697 = await UserModel.getUserForPwd(v1695);
    if (v1697) {
      const {
        userId: _0x163b27,
        companyId: _0x40c112,
        userType: _0x4a3527,
        registerStatus: _0x4924d3,
        nickname: _0x4e3b0e
      } = v1697;
      if (v1684.AGUvH(_0x4924d3, v1684.wUfQD(154322, 154322))) {
        p1835.response.status = 412;
        p1835.body = vRequire30.ERROR_412(v1684.GZUkw);
        return;
      }
      const v1698 = vRequire32.sign({
        userId: _0x163b27,
        companyId: _0x40c112,
        userType: _0x4a3527,
        emailName: _0x4819a7,
        nickname: _0x4e3b0e
      }, vRequire33.sign, {
        expiresIn: v1684.iuZyQ(47520, v1684.higDu(177270, 177226)) * v1684.wqdBP(495852, 496388)
      });
      C38.setValidateCode();
      const v1699 = await UserTokenModel.getUserTokenDetail(_0x163b27);
      if (v1699) {
        await UserTokenModel.updateUserToken(_0x163b27, {
          ...v1699,
          accessToken: v1698
        });
      } else {
        await UserTokenModel.createUserToken({
          userId: _0x163b27,
          accessToken: v1698
        });
      }
      p1835.response.status = 200;
      p1835.body = vRequire30.SUCCESS_200("登录成功", v1698);
    } else {
      C38.setValidateCode();
      p1835.response.status = 412;
      p1835.body = vRequire30.ERROR_412("用户名或密码不正确！");
    }
  }
  static async logout(p1848) {
    const v1700 = {
      rINbf: function (p1849, p1850) {
        return p1849 ^ p1850;
      },
      DUWzr: "登出成功"
    };
    const v1701 = JSON.parse(p1848.request.body);
    const {
      userId: _0x2c9733
    } = v1701;
    const v1702 = await UserTokenModel.getUserTokenDetail(_0x2c9733);
    if (v1702) {
      await UserTokenModel.updateUserToken(_0x2c9733, {
        ...v1702,
        accessToken: ""
      });
    }
    p1848.response.status = v1700.rINbf(808303, 808359);
    p1848.body = vRequire30.SUCCESS_200(v1700.DUWzr, 0);
  }
  static async loginForApi(p1851) {
    const v1703 = {
      RApna: function (p1852, p1853) {
        return p1852 ^ p1853;
      },
      sKIHg: "此账号尚未激活，请联系管理员激活！",
      Gfdfq: function (p1854, p1855) {
        return p1854 ^ p1855;
      }
    };
    const v1704 = p1851.request.body;
    const {
      emailName: _0x3a7c93,
      password: _0x4c19b2
    } = v1704;
    const v_0x4c19b22 = _0x4c19b2;
    const v1705 = {
      emailName: _0x3a7c93,
      password: vRequire26.md5(v_0x4c19b22)
    };
    const v1706 = await UserModel.getUserForPwd(v1705);
    if (v1706) {
      const {
        userId: _0x1d607b,
        userType: _0x564d9e,
        registerStatus: _0x6682ec,
        nickname: _0x1f6c8a
      } = v1706;
      if (_0x6682ec === v1703.RApna(760461, 760461)) {
        p1851.response.status = 200;
        p1851.body = vRequire30.SUCCESS_200(v1703.sKIHg, 1);
        return;
      }
      const v1707 = vRequire32.sign({
        userId: _0x1d607b,
        userType: _0x564d9e,
        emailName: _0x3a7c93,
        nickname: _0x1f6c8a
      }, vRequire33.sign, {
        expiresIn: v1703.RApna(662651, 662618) * v1703.RApna(978036, 978028) * 60 * 60 * 1000
      });
      C38.setValidateCode();
      const v1708 = await UserTokenModel.getUserTokenDetail(_0x1d607b);
      if (v1708) {
        await UserTokenModel.updateUserToken(_0x1d607b, {
          ...v1708,
          accessToken: v1707
        });
      } else {
        await UserTokenModel.createUserToken({
          userId: _0x1d607b,
          accessToken: v1707
        });
      }
      p1851.response.status = v1703.RApna(446972, 446772);
      p1851.body = vRequire30.SUCCESS_200("登录成功", v1707);
    } else {
      C38.setValidateCode();
      p1851.response.status = v1703.Gfdfq(124851, 124795);
      p1851.body = vRequire30.SUCCESS_200("用户名密码不正确！", 1);
    }
  }
  static async forgetPwd(p1856) {
    const v1709 = {
      pSJLL: function (p1857, p1858) {
        return p1857 ^ p1858;
      },
      XHEZU: "非管理员账号，请联系管理员获取登录密码！",
      rSFRl: function (p1859, p1860) {
        return p1859 ^ p1860;
      }
    };
    const v1710 = JSON.parse(p1856.request.body);
    const {
      email: _0x425544
    } = v1710;
    let v1711 = await UserModel.isAdminAccount(_0x425544, USER_INFO.USER_TYPE_ADMIN);
    if (v1711) {
      C38.sendEmail(_0x425544, "密码找回", "管理员你好， 你的登录密码是：" + v1711.password);
      p1856.response.status = 200;
      p1856.body = vRequire30.SUCCESS_200("管理员你好，密码已发送至您的邮箱，请注意查收！", 0);
    } else {
      p1856.response.status = v1709.pSJLL(672653, 672581);
      p1856.body = vRequire30.SUCCESS_200(v1709.XHEZU, v1709.rSFRl(304687, 304686));
    }
  }
  static async sendRegisterEmail(p1861) {
    const v1712 = {
      uUsRo: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      LHEqD: function (p1862, p1863) {
        return p1862 ^ p1863;
      },
      kBmGn: function (p1864, p1865) {
        return p1864 ^ p1865;
      },
      IMmWB: function (p1866, p1867) {
        return p1866 + p1867;
      },
      zVMwm: "注册验证码：",
      Uejly: "<p>用户你好!</p>",
      HyIXc: "Webfunny",
      hgrLA: function (p1868, p1869) {
        return p1868 ^ p1869;
      }
    };
    const v1713 = JSON.parse(p1861.request.body);
    const v1714 = new RegExp(v1712.uUsRo, "");
    const v1715 = v1713.email.match(v1714)[0];
    const v1716 = "0123456789ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz";
    let v1717 = "";
    for (let v1718 = 0; v1718 < v1712.LHEqD(674744, 674748); v1718++) {
      const v1719 = Math.floor(Math.random() * (v1716.length - 1) + v1712.kBmGn(239994, 239995));
      v1717 += v1716.charAt(v1719);
    }
    if (global.centerInfo.registerEmailCode[v1715]) {
      p1861.response.status = v1712.LHEqD(470459, 470387);
      p1861.body = vRequire30.SUCCESS_200("验证码发送太频繁", 1);
      return;
    }
    global.centerInfo.registerEmailCode[v1715] = v1717;
    global.centerInfo.registerEmailCodeCheckError[v1715] = 0;
    setTimeout(() => {
      delete global.centerInfo.registerEmailCode[v1715];
    }, 120000);
    console.warn("【注册验证码】" + v1715 + "：" + v1717);
    const v1720 = v1712.IMmWB(v1712.zVMwm, v1717);
    const v1721 = v1712.IMmWB(v1712.Uejly, "<p>" + (accountInfo.productTitle || v1712.HyIXc) + "注册的验证码为：") + v1717 + "</p><p>如有疑问，请联系我们！</p>";
    C38.sendEmail(v1715, v1720, v1721);
    p1861.response.status = 200;
    p1861.body = vRequire30.SUCCESS_200("验证码已发送", v1712.hgrLA(354977, 354977));
  }
  static async getRegisterEmailForSupperAdmin(p1870) {
    const v1722 = {
      dPnIU: function (p1871, p1872) {
        return p1871 ^ p1872;
      }
    };
    const {
      userType: _0x102dd6
    } = p1870.user;
    if (_0x102dd6 !== "superAdmin" && _0x102dd6 !== "admin") {
      p1870.response.status = 403;
      p1870.body = vRequire30.ERROR_403("您没有权限执行此操作！");
      return;
    }
    p1870.response.status = v1722.dPnIU(847990, 848062);
    p1870.body = vRequire30.SUCCESS_200("success", global.centerInfo.registerEmailCode);
  }
  static async registerCheck(p1873) {
    const v1723 = {
      dRBmg: function (p1874, p1875) {
        return p1874 ^ p1875;
      },
      jhTuN: function (p1876, p1877) {
        return p1876 ^ p1877;
      },
      TZgSd: function (p1878, p1879) {
        return p1878 ^ p1879;
      },
      dejBc: "请先初始化管理员账号",
      wZVVy: function (p1880, p1881) {
        return p1880 + p1881;
      },
      znoni: function (p1882, p1883) {
        return p1882 + p1883;
      }
    };
    const v1724 = JSON.parse(p1873.request.body);
    const {
      name: _0x1a92e1,
      email: _0x4284e8,
      emailCode: _0x4bba8a,
      password: _0x138047
    } = v1724;
    const v1725 = global.centerInfo.registerEmailCode[_0x4284e8];
    const v1726 = _0x4bba8a.toLowerCase();
    if (!v1725 || v1726 != v1725.toLowerCase()) {
      p1873.response.status = v1723.dRBmg(919173, 919117);
      p1873.body = vRequire30.SUCCESS_200("验证码不正确或已失效！", v1723.jhTuN(709235, 709234));
      return;
    }
    let v1727 = await UserModel.checkUserAccount(_0x4284e8);
    if (v1727) {
      p1873.response.status = 200;
      p1873.body = vRequire30.SUCCESS_200("邮箱已存在！", v1723.TZgSd(823668, 823669));
      return;
    }
    let v1728 = await UserModel.getAdminByType("admin");
    if (!v1728) {
      p1873.response.status = 200;
      p1873.body = vRequire30.SUCCESS_200(v1723.dejBc, 1);
    } else {
      const v1729 = v1728.emailName;
      const {
        localServerDomain: _0xa28541
      } = accountInfo;
      const v1730 = "http://" + _0xa28541 + "/server/register?name=" + _0x1a92e1 + "&email=" + _0x4284e8 + "&password=" + _0x138047;
      const v1731 = "管理员确认申请";
      const v1732 = v1723.wZVVy(v1723.wZVVy(v1723.znoni("<p>管理员你好!</p><p>有用户申请注册你的监控系统，请点击注册链接，以完成注册：<a href='", v1730), "'>") + v1730 + "</a></p>", "<p>如有疑问，请联系我们！</p>");
      C38.sendEmail(v1729, v1731, v1732);
      p1873.response.status = v1723.dRBmg(670044, 670100);
      p1873.body = vRequire30.SUCCESS_200("创建信息成功", v1723.jhTuN(462986, 462986));
    }
  }
  static async ["register"](p1884) {
    const v1733 = {
      zVecv: function (p1885, p1886) {
        return p1885 * p1886;
      },
      uUnYO: "center-register",
      DuHxx: function (p1887, p1888) {
        return p1887 >= p1888;
      },
      NeFQb: "验证码不正确或已失效！",
      qPeuG: function (p1889, p1890) {
        return p1889 ^ p1890;
      },
      BtywN: "申请成功",
      rmYJE: function (p1891, p1892) {
        return p1891 + p1892;
      },
      YtQem: "</p>",
      VGTLV: "用户注册通知",
      AcosK: "创建信息成功",
      ESdQf: function (p1893, p1894) {
        return p1893 ^ p1894;
      }
    };
    const v1734 = vRequire26.parseQs(p1884.request.url);
    const {
      name: _0xc0932,
      email = "",
      phone = "",
      password: _0x3b6170,
      emailCode: _0x16ca86
    } = v1734;
    const v1735 = vRequire26.b64DecodeUnicode(_0x3b6170).split("").reverse().join("");
    const v1736 = vRequire26.getUuid();
    const v1737 = Math.floor(v1733.zVecv(Math.random(), 10));
    const v1738 = accountInfo.activationRequired === true ? 0 : 1;
    const v1739 = {
      nickname: _0xc0932,
      emailName: email,
      phone: phone,
      password: vRequire26.md5(v1735),
      userId: v1736,
      userType: "customer",
      registerStatus: v1738,
      avatar: v1737
    };
    vRequire26.postJson("http://www.webfunny.cn/config/recordEmail", {
      phone: phone,
      email: email,
      purchaseCode: accountInfo.purchaseCode,
      source: v1733.uUnYO
    }).catch(p1895 => {});
    const v1740 = global.centerInfo.registerEmailCodeCheckError;
    if (v1733.DuHxx(v1740[email], 3)) {
      p1884.response.status = 200;
      p1884.body = vRequire30.SUCCESS_200("验证码失败次数达到上限，请重新获取验证码！", 1);
      return;
    }
    const v1741 = global.centerInfo.registerEmailCode[email];
    const v1742 = _0x16ca86.toLowerCase();
    if (!v1741 || v1742 != v1741.toLowerCase()) {
      if (!v1740[email]) {
        v1740[email] = 1;
      } else {
        v1740[email]++;
      }
      p1884.response.status = 200;
      p1884.body = vRequire30.SUCCESS_200(v1733.NeFQb, v1733.qPeuG(774582, 774583));
      return;
    }
    let v1743 = await UserModel.checkUserAccount(email);
    if (v1743) {
      p1884.response.status = 200;
      p1884.body = vRequire30.SUCCESS_200("邮箱已存在！", 1);
      return;
    }
    if (v1739.nickname) {
      let v1744 = await UserModel.createUser(v1739);
      if (v1744 && v1744.id) {
        const v1745 = v1733.BtywN;
        const v1746 = v1733.rmYJE("<p>用户你好!</p><p>你的账号已经申请成功，请联系管理员激活后，方可登录。</p>" + "<p>账号：", email) + " 、 密码：" + v1735 + v1733.YtQem + "<p>如有疑问，请联系我们！</p>";
        C38.sendEmail(email, v1745, v1746);
        const v1747 = await UserModel.getUserForAdmin();
        const v1748 = JSON.stringify(["您好，用户【" + email + "】正在申请注册" + (accountInfo.productTitle || "Webfunny") + "账号，请及时处理！"]);
        MessageModel.createMessage({
          userId: v1747[0].userId,
          title: "用户注册通知",
          content: v1748,
          type: "sys",
          isRead: 0,
          link: "http://" + accountInfo.localAssetsDomain + "/webfunny_center/teamList.html"
        });
        const v1749 = v1733.VGTLV;
        const v1750 = "\n        <p>尊敬的管理员：</p>\n        <p>您好，用户【" + email + "】正在申请注册" + (accountInfo.productTitle || "webfunny") + "账号，请及时处理！</p>\n        <p>点击链接处理：http://" + accountInfo.localAssetsDomain + "/webfunny_center/userList.html</p>\n        <p>如有疑问，请联系我们！</p>\n        ";
        C38.sendEmail(v1747[0].emailName, v1749, v1750);
        p1884.response.status = 200;
        p1884.body = vRequire30.SUCCESS_200(v1733.AcosK, 0);
      }
    } else {
      p1884.response.status = v1733.ESdQf(893046, 893418);
      p1884.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async registerForSaas(p1896) {
    const v1751 = {
      KQfvo: "注册人数已经超出上限！",
      jrvQC: function (p1897, p1898) {
        return p1897 ^ p1898;
      },
      JJDsk: "customer",
      fjRJh: function (p1899, p1900) {
        return p1899 + p1900;
      },
      OZFKO: "默认团队",
      zWVmp: "center-register",
      hmTKq: function (p1901, p1902) {
        return p1901 === p1902;
      },
      uBAAf: "申请成功",
      PJHNy: "<p>你的账号已经申请成功，请联系管理员激活后，方可登录。</p>",
      TWgKB: " 、 密码：",
      JJrgH: "创建信息成功",
      NONah: "创建信息失败，请求参数不能为空！"
    };
    const v1752 = await C24.checkFreeLicense();
    let v1753 = 0;
    let v1754 = await UserModel.getUserCount();
    if (v1754 && v1754.length) {
      v1753 = v1754[0].count;
    }
    if (v1752 && v1753 >= 3) {
      p1896.response.status = 412;
      p1896.body = vRequire30.ERROR_412(v1751.KQfvo);
      return;
    }
    let v1755 = vRequire26.parseQs(p1896.request.url);
    let {
      companyName: _0x24de0d,
      chooseCompanyId: _0x375246,
      name: _0x3d8f64,
      email = "",
      phone = "",
      password: _0x560001,
      emailCode: _0x573fee,
      openid = ""
    } = v1755;
    let v1756 = v1755.registerType * 1;
    let v1757 = vRequire26.b64DecodeUnicode(_0x560001).split("").reverse().join("");
    let v1758 = vRequire26.getUuid();
    let v1759 = vRequire26.getUuid();
    let v1760 = vRequire26.getUuid();
    let v1761 = Math.floor(Math.random() * 10);
    const v1762 = global.centerInfo.registerEmailCodeCheckError;
    if (v1762[email] >= 3) {
      p1896.response.status = v1751.jrvQC(482211, 482155);
      p1896.body = vRequire30.SUCCESS_200("验证码失败次数达到上限，请重新获取验证码！", 1);
      return;
    }
    const v1763 = global.centerInfo.registerEmailCode[email];
    const v1764 = _0x573fee.toLowerCase();
    if (!v1763 || v1764 != v1763.toLowerCase()) {
      if (!v1762[email]) {
        v1762[email] = 1;
      } else {
        v1762[email]++;
      }
      p1896.response.status = 200;
      p1896.body = vRequire30.SUCCESS_200("验证码不正确或已失效！", 1);
      return;
    }
    let v1765 = await UserModel.checkUserAccount(email);
    if (v1765) {
      p1896.response.status = 200;
      p1896.body = vRequire30.SUCCESS_200("邮箱已存在！", 1);
      return;
    }
    let v1766 = accountInfo.activationRequired === true ? 0 : 1;
    let v1767 = v1751.JJDsk;
    if (v1756 === v1751.jrvQC(379795, 379794) || !_0x375246) {
      v1766 = 1;
      v1767 = "superAdmin";
      await CompanyModel.createCompany({
        ownerId: v1758,
        companyId: v1759,
        companyName: _0x24de0d
      });
      await ProductModel.createProduct({
        companyId: v1759,
        orderId: v1760,
        productType: "0",
        usedFlowCount: 0,
        maxFlowCount: 10000,
        month: new Date().Format("yyyy-MM"),
        endDate: new Date(v1751.fjRJh(new Date().getTime(), v1751.jrvQC(383782, 383806) * 30 * v1751.jrvQC(112606, 113102) * 1000)).Format("yyyy-MM-dd 00:00:00"),
        isValid: 1
      });
      await TeamModel.createTeam({
        companyId: v1759,
        teamName: v1751.OZFKO,
        leaderId: v1758,
        members: v1758,
        webMonitorIds: ""
      });
    } else {
      v1759 = _0x375246;
    }
    const v1768 = {
      companyId: v1759,
      nickname: _0x3d8f64,
      emailName: email,
      phone: phone,
      password: vRequire26.md5(v1757),
      userId: v1758,
      userType: v1767,
      registerStatus: v1766,
      avatar: v1761,
      openid: openid
    };
    vRequire26.postJson(WEBFUNNY_CONFIG_URI + "/config/recordEmail", {
      phone: phone,
      email: email,
      purchaseCode: accountInfo.purchaseCode,
      source: v1751.zWVmp
    }).catch(p1903 => {});
    if (v1768.nickname) {
      let v1769 = await UserModel.createUser(v1768);
      if (v1769 && v1769.id) {
        if (v1751.hmTKq(v1756, 1) && typeof vRequire28.onRegister === "function") {
          vRequire28.onRegister({
            email: email,
            memberName: _0x24de0d || "",
            productType: 60,
            orderAmount: 0,
            typeOfTax: "",
            phone: phone,
            name: _0x3d8f64,
            months: 12,
            projectNum: 10,
            cardNum: 10,
            flowCount: 1000000,
            saveDays: 7,
            companyId: v1759,
            channel: "saas"
          });
          p1896.response.status = 200;
          p1896.body = vRequire30.SUCCESS_200("账号创建成功", 0);
        } else {
          const v1770 = v1751.uBAAf;
          const v1771 = v1751.fjRJh("<p>用户你好!</p>" + v1751.PJHNy + "<p>账号：" + email + v1751.TWgKB, v1757) + "</p>" + "<p>如有疑问，请联系我们！</p>";
          C38.sendEmail(email, v1770, v1771);
          const v1772 = await UserModel.getUserForAdmin(v1759);
          const v1773 = JSON.stringify(["您好，用户【" + _0x3d8f64 + "】正在申请注册" + (accountInfo.productTitle || "Webfunny") + "账号，请及时处理！"]);
          MessageModel.createMessage({
            userId: v1772[0].userId,
            title: "用户注册通知",
            content: v1773,
            type: "sys",
            isRead: 0,
            link: "http://" + accountInfo.localAssetsDomain + "/webfunny_center/teamList.html"
          });
          const v1774 = "用户注册通知";
          const v1775 = "\n          <p>尊敬的管理员：</p>\n          <p>您好，用户【" + email + "】正在申请注册" + accountInfo.productTitle + "账号，请及时处理！</p>\n          <p>点击链接处理：http://" + accountInfo.localAssetsDomain + "/webfunny_center/userList.html</p>\n          <p>如有疑问，请联系我们！</p>\n          ";
          C38.sendEmail(v1772[v1751.jrvQC(247430, 247430)].emailName, v1774, v1775);
          p1896.response.status = 200;
          p1896.body = vRequire30.SUCCESS_200(v1751.JJrgH, v1751.jrvQC(329443, 329443));
        }
      }
    } else {
      p1896.response.status = 412;
      p1896.body = vRequire30.ERROR_412(v1751.NONah);
    }
  }
  static async ["registerForCloud"](p1904) {
    const v1776 = {
      Twkfy: function (p1905, p1906) {
        return p1905 * p1906;
      },
      tWyPc: function (p1907, p1908) {
        return p1907 ^ p1908;
      },
      PAVPV: "superAdmin",
      mcLQC: function (p1909, p1910) {
        return p1909 * p1910;
      },
      vpvox: "yyyy-MM-dd 00:00:00"
    };
    let v1777 = vRequire26.parseQs(p1904.request.url);
    let {
      companyName: _0x4bf5ec,
      chooseCompanyId: _0x136b2a,
      name: _0x385cda,
      email = "",
      phone = "",
      password: _0x427f2c,
      openid = ""
    } = v1777;
    let v1778 = v1776.Twkfy(v1777.registerType, 1);
    let v1779 = vRequire26.b64DecodeUnicode(_0x427f2c).split("").reverse().join("");
    let v1780 = vRequire26.getUuid();
    let v1781 = vRequire26.getUuid();
    let v1782 = vRequire26.getUuid();
    let v1783 = Math.floor(v1776.Twkfy(Math.random(), v1776.tWyPc(158495, 158485)));
    let v1784 = await UserModel.checkUserAccount(email);
    if (v1784) {
      p1904.response.status = v1776.tWyPc(208412, 208596);
      p1904.body = vRequire30.SUCCESS_200("邮箱已存在！", v1776.tWyPc(460931, 460930));
      return;
    }
    let v1785 = accountInfo.activationRequired === true ? v1776.tWyPc(371561, 371561) : 1;
    let v1786 = "customer";
    if (v1778 === 1 || !_0x136b2a) {
      v1785 = 1;
      v1786 = v1776.PAVPV;
      await CompanyModel.createCompany({
        ownerId: v1780,
        companyId: v1781,
        companyName: _0x4bf5ec
      });
      await ProductModel.createProduct({
        companyId: v1781,
        orderId: v1782,
        productType: "0",
        usedFlowCount: 0,
        maxFlowCount: 100000,
        projectCount: 3,
        month: new Date().Format("yyyy-MM"),
        endDate: new Date(new Date().getTime() + v1776.mcLQC(1209600, 1000)).Format(v1776.vpvox),
        isValid: 1,
        enableDataExport: 0,
        saveDays: 30
      });
      await TeamModel.createTeam({
        companyId: v1781,
        teamName: "默认团队",
        leaderId: v1780,
        members: v1780,
        webMonitorIds: ""
      });
    } else {
      v1781 = _0x136b2a;
      v1785 = 0;
    }
    const v1787 = {
      companyId: v1781,
      nickname: _0x385cda,
      emailName: email,
      phone: phone,
      password: vRequire26.md5(v1779),
      userId: v1780,
      userType: v1786,
      registerStatus: v1785,
      avatar: v1783,
      openid: openid
    };
    vRequire26.postJson(WEBFUNNY_CONFIG_URI + "/config/recordEmail", {
      phone: phone,
      email: email,
      purchaseCode: accountInfo.purchaseCode,
      source: "center-register"
    }).catch(p1911 => {});
    if (v1787.nickname) {
      let v1788 = await UserModel.createUser(v1787);
      p1904.response.status = 200;
      p1904.body = vRequire30.SUCCESS_200("创建信息成功", v1788);
    } else {
      p1904.response.status = 412;
      p1904.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async ["registerForSaasWithWebsite"](p1912) {
    const v1789 = {
      ukbcr: function (p1913, p1914) {
        return p1913 ^ p1914;
      },
      BUnJu: "yyyy-MM",
      PpWff: function (p1915, p1916) {
        return p1915 + p1916;
      },
      pwTYc: function (p1917, p1918) {
        return p1917 ^ p1918;
      },
      qZemo: "center-register",
      jtPAs: "success"
    };
    const v1790 = p1912.request.body;
    const {
      companyName: _0x47aadd,
      name: _0x61e881,
      email = "",
      phone = "",
      password: _0x5a18b7
    } = v1790;
    const v1791 = vRequire26.b64DecodeUnicode(_0x5a18b7).split("").reverse().join("");
    const v1792 = vRequire26.getUuid();
    const v1793 = vRequire26.getUuid();
    const v1794 = vRequire26.getUuid();
    const v1795 = Math.floor(Math.random() * 10);
    const v1796 = v1789.ukbcr(272597, 272596);
    const v1797 = "superAdmin";
    await CompanyModel.createCompany({
      ownerId: v1792,
      companyId: v1793,
      companyName: _0x47aadd
    });
    await ProductModel.createProduct({
      companyId: v1793,
      orderId: v1794,
      productType: "0",
      usedFlowCount: 0,
      maxFlowCount: 100000,
      month: new Date().Format(v1789.BUnJu),
      endDate: new Date(v1789.PpWff(new Date().getTime(), v1789.pwTYc(921538, 921562) * 14 * 3600 * 1000)).Format("yyyy-MM-dd 00:00:00"),
      isValid: 1
    });
    await TeamModel.createTeam({
      companyId: v1793,
      teamName: "默认团队",
      leaderId: v1792,
      members: v1792,
      webMonitorIds: ""
    });
    const v1798 = {
      companyId: v1793,
      nickname: _0x61e881,
      emailName: email,
      phone: phone,
      password: vRequire26.md5(v1791),
      userId: v1792,
      userType: v1797,
      registerStatus: v1796,
      avatar: v1795
    };
    vRequire26.postJson(WEBFUNNY_CONFIG_URI + "/config/recordEmail", {
      phone: phone,
      email: email,
      purchaseCode: accountInfo.purchaseCode,
      source: v1789.qZemo
    }).catch(p1919 => {});
    let v1799 = await UserModel.checkUserAccount(email);
    if (v1799) {
      p1912.response.status = 200;
      p1912.body = vRequire30.SUCCESS_200("邮箱已存在！", v1789.pwTYc(325103, 325102));
      return;
    }
    if (v1798.nickname) {
      await UserModel.createUser(v1798);
      p1912.response.status = v1789.pwTYc(231774, 231830);
      p1912.body = vRequire30.SUCCESS_200(v1789.jtPAs, {
        emailName: email,
        password: v1791
      });
    } else {
      p1912.response.status = 412;
      p1912.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async ["registerForApi"](p1920) {
    const v1800 = {
      vXseN: function (p1921, p1922) {
        return p1921 ^ p1922;
      },
      dlFdh: function (p1923, p1924) {
        return p1923 ^ p1924;
      }
    };
    const v1801 = p1920.request.body;
    const {
      chooseCompanyId = "1",
      name: _0xa44daf,
      email = "",
      phone = "",
      password: _0x1a7c58
    } = v1801;
    const v_0x1a7c582 = _0x1a7c58;
    const v1802 = vRequire26.getUuid();
    let vChooseCompanyId2 = chooseCompanyId;
    const v1803 = Math.floor(Math.random() * v1800.vXseN(130893, 130887));
    let v1804 = accountInfo.activationRequired === true ? v1800.vXseN(437705, 437705) : 1;
    let v1805 = "customer";
    const v1806 = {
      companyId: vChooseCompanyId2,
      nickname: _0xa44daf,
      emailName: email,
      phone: phone,
      password: vRequire26.md5(v_0x1a7c582),
      userId: v1802,
      userType: v1805,
      registerStatus: v1804,
      avatar: v1803
    };
    vRequire26.postJson(WEBFUNNY_CONFIG_URI + "/config/recordEmail", {
      phone: phone,
      email: email,
      purchaseCode: accountInfo.purchaseCode,
      source: "center-register"
    }).catch(p1925 => {});
    let v1807 = await UserModel.checkUserAccount(email);
    if (v1807) {
      p1920.response.status = 200;
      p1920.body = vRequire30.SUCCESS_200("邮箱已存在！", v1800.vXseN(159998, 159999));
      return;
    }
    if (v1806.nickname && v1806.emailName && v1806.password) {
      let v1808 = await UserModel.createUser(v1806);
      if (v1808 && v1808.id) {
        v1808.password = _0x1a7c58;
        p1920.response.status = v1800.vXseN(727700, 727644);
        p1920.body = vRequire30.SUCCESS_200("账号注册成功", v1808);
      }
    } else {
      p1920.response.status = v1800.dlFdh(867151, 867027);
      p1920.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async addNewCustomer(p1926) {
    const v1809 = {
      sNGIf: function (p1927, p1928) {
        return p1927 === p1928;
      },
      zBJSo: function (p1929, p1930) {
        return p1929 * p1930;
      },
      yorsf: function (p1931, p1932) {
        return p1931 ^ p1932;
      },
      QKCVt: function (p1933, p1934) {
        return p1933 >= p1934;
      },
      JUZNr: "账号数量已达上限，无法继续创建！",
      JhwbZ: function (p1935, p1936) {
        return p1935 ^ p1936;
      }
    };
    const v1810 = JSON.parse(p1926.request.body);
    const {
      nickname: _0x42d6a3,
      email = "",
      phone = "",
      password: _0x3637bc
    } = v1810;
    const v1811 = vRequire26.b64DecodeUnicode(_0x3637bc).split("").reverse().join("");
    const v1812 = vRequire26.getUuid();
    const v1813 = Math.floor(Math.random() * 10);
    const {
      userType: _0x3fa399,
      companyId: _0xe977d6
    } = p1926.user;
    if (!v1809.sNGIf(_0x3fa399, "admin") && !v1809.sNGIf(_0x3fa399, "superAdmin")) {
      p1926.response.status = 412;
      p1926.body = vRequire30.ERROR_412("非管理员，无权调用此接口！");
      return;
    }
    let v1814 = 0;
    const v1815 = await UserModel.getUserCount();
    if (v1815 && v1815.length > 0) {
      v1814 = v1809.zBJSo(v1815[0].count, v1809.yorsf(444169, 444168));
    }
    const v1816 = await C24.checkFreeLicense();
    if (v1816 === true && v1809.QKCVt(v1814, v1809.yorsf(297239, 297236))) {
      p1926.response.status = 412;
      p1926.body = vRequire30.ERROR_412(v1809.JUZNr);
      return;
    }
    const v1817 = 1;
    const v1818 = {
      companyId: _0xe977d6,
      nickname: _0x42d6a3,
      emailName: email,
      phone: phone,
      password: vRequire26.md5(v1811),
      userId: v1812,
      userType: "customer",
      registerStatus: v1817,
      avatar: v1813
    };
    let v1819 = await UserModel.checkUserAccount(email);
    if (v1819) {
      p1926.response.status = 412;
      p1926.body = vRequire30.ERROR_412("账号已存在！");
      return;
    }
    vRequire26.postJson("http://www.webfunny.cn/config/recordEmail", {
      phone: phone,
      email: email,
      purchaseCode: accountInfo.purchaseCode,
      source: "center-register"
    }).catch(p1937 => {});
    await UserModel.createUser(v1818);
    p1926.response.status = 200;
    p1926.body = vRequire30.SUCCESS_200("账号创建成功", v1809.JhwbZ(905365, 905365));
  }
  static async ["resetPwd"](p1938) {
    const v1820 = {
      VNCVo: function (p1939, p1940) {
        return p1939 >= p1940;
      },
      xAWSS: "验证码失败次数达到上限，请重新获取验证码！",
      BpUKV: function (p1941, p1942) {
        return p1941 ^ p1942;
      },
      Atird: function (p1943, p1944) {
        return p1943 ^ p1944;
      },
      pZpfh: function (p1945, p1946) {
        return p1945 ^ p1946;
      },
      ITkBY: function (p1947, p1948) {
        return p1947 + p1948;
      },
      oXZTd: "<p>如有疑问，请联系我们！</p>",
      sivGT: function (p1949, p1950) {
        return p1949 ^ p1950;
      },
      asoAK: "重置密码失败！",
      kbsOZ: function (p1951, p1952) {
        return p1951 ^ p1952;
      }
    };
    const v1821 = vRequire26.parseQs(p1938.request.url);
    const {
      email: _0x4f8054,
      password: _0x57395a,
      emailCode: _0x4d5310
    } = v1821;
    const v1822 = vRequire26.b64DecodeUnicode(_0x57395a).split("").reverse().join("");
    const v1823 = {
      emailName: _0x4f8054,
      password: vRequire26.md5(v1822),
      emailCode: _0x4d5310
    };
    const v1824 = global.centerInfo.registerEmailCodeCheckError;
    if (v1820.VNCVo(v1824[_0x4f8054], 3)) {
      p1938.response.status = 200;
      p1938.body = vRequire30.SUCCESS_200(v1820.xAWSS, v1820.BpUKV(720237, 720236));
      return;
    }
    const v1825 = global.centerInfo.registerEmailCode[_0x4f8054];
    const v1826 = _0x4d5310.toLowerCase();
    if (!v1825 || v1826 != v1825.toLowerCase()) {
      if (!v1824[_0x4f8054]) {
        v1824[_0x4f8054] = v1820.BpUKV(399622, 399623);
      } else {
        v1824[_0x4f8054]++;
      }
      p1938.response.status = v1820.Atird(482349, 482533);
      p1938.body = vRequire30.SUCCESS_200("验证码不正确或已失效！", 1);
      return;
    }
    let v1827 = await UserModel.checkUserAccount(_0x4f8054);
    if (!v1827) {
      p1938.response.status = v1820.pZpfh(165291, 165219);
      p1938.body = vRequire30.SUCCESS_200("此邮箱不存在！", 1);
      return;
    }
    let v1828 = await UserModel.resetPwd(_0x4f8054, v1823);
    if (v1828) {
      const v1829 = "密码重置成功！";
      const v1830 = v1820.ITkBY(v1820.ITkBY("<p>用户你好!</p>", "<p>你的" + (accountInfo.productTitle || "Webfunny") + "密码已重置。</p>") + "<p>账号：", _0x4f8054) + " 、 密码：" + v1822 + "</p>" + v1820.oXZTd;
      C38.sendEmail(_0x4f8054, v1829, v1830);
      p1938.response.status = 200;
      p1938.body = vRequire30.SUCCESS_200("创建信息成功", v1820.sivGT(831705, 831705));
    } else {
      p1938.response.status = 200;
      p1938.body = vRequire30.SUCCESS_200(v1820.asoAK, v1820.kbsOZ(218429, 218428));
    }
  }
  static async ["registerForAdmin"](p1953) {
    const v1831 = {
      XNtCD: function (p1954, p1955) {
        return p1954 ^ p1955;
      },
      Ypeaq: "创建信息成功"
    };
    const v1832 = JSON.parse(p1953.request.body);
    const {
      name: _0x396f28,
      email: _0x1f2daf,
      password: _0xa64efa,
      userType: _0x1c8b57,
      phone: _0x3aea90
    } = v1832;
    const v1833 = vRequire26.b64DecodeUnicode(_0xa64efa).split("").reverse().join("");
    const v1834 = vRequire26.getUuid();
    const v1835 = Math.floor(Math.random() * v1831.XNtCD(164755, 164761));
    const v1836 = {
      nickname: _0x396f28,
      emailName: _0x1f2daf,
      password: vRequire26.md5(v1833),
      userType: _0x1c8b57,
      userId: v1834,
      registerStatus: 1,
      phone: _0x3aea90,
      avatar: v1835
    };
    vRequire26.postJson("http://www.webfunny.cn/config/recordEmail", {
      email: _0x1f2daf,
      purchaseCode: accountInfo.purchaseCode
    }).catch(p1956 => {});
    if (v1836.nickname) {
      const v1837 = await UserModel.checkAdminAccount();
      const v1838 = v1837[0].count * 1;
      if (v1838 > 0) {
        p1953.response.status = 200;
        p1953.body = vRequire30.SUCCESS_200("超级管理员账号已存在，请勿重复创建", 1);
        return;
      }
      await UserModel.createUser(v1836);
      p1953.response.status = 200;
      p1953.body = vRequire30.SUCCESS_200(v1831.Ypeaq, 0);
    } else {
      p1953.response.status = v1831.XNtCD(367982, 367858);
      p1953.body = vRequire30.ERROR_412("创建信息失败，请求参数不能为空！");
    }
  }
  static async ["activeRegisterMember"](p1957) {
    const v1839 = {
      sUtFk: function (p1958, p1959) {
        return p1958 !== p1959;
      },
      agtEa: "admin",
      tHnOj: "非管理员，无权调用此接口！",
      iszbc: "Webfunny",
      wZayE: "支持项目：H5前端、PC前端、微信小程序、uni-app。"
    };
    const v1840 = JSON.parse(p1957.request.body);
    const {
      userId: _0x278f34,
      emailName: _0x4b205a
    } = v1840;
    const {
      userType: _0x5695aa
    } = p1957.user;
    if (v1839.sUtFk(_0x5695aa, v1839.agtEa) && _0x5695aa !== "superAdmin") {
      p1957.response.status = 412;
      p1957.body = vRequire30.ERROR_412(v1839.tHnOj);
      return;
    }
    if (_0x278f34) {
      await UserModel.activeRegisterMember(_0x278f34);
      MessageModel.createMessage({
        userId: _0x278f34,
        title: "欢迎登录！",
        content: JSON.stringify(["尊敬的用户您好，欢迎登录" + (accountInfo.productTitle || "Webfunny") + "前端监控系统。", (accountInfo.productTitle || v1839.iszbc) + "致力于解决前端的各种问题，纯私有化部署，支持千万级PV的日活量。", v1839.wZayE]),
        type: "sys",
        isRead: 0,
        link: "http://www.webfunny.cn"
      });
      const v1841 = "用户激活通知";
      const v1842 = "\n      <p>尊敬的用户：</p>\n      <p>您好，您的账号已经被管理员激活了，快去登录吧！</p>\n      <p>如有疑问，请联系我们！</p>\n      ";
      C38.sendEmail(_0x4b205a, v1841, v1842);
      p1957.response.status = 200;
      p1957.body = vRequire30.SUCCESS_200("用户已激活", 0);
    } else {
      p1957.response.status = 412;
      p1957.body = vRequire30.ERROR_412("激活失败");
    }
  }
  static async deleteRegisterMember(p1960) {
    const v1843 = {
      rzIfM: "用户信息删除成功",
      UxIOe: function (p1961, p1962) {
        return p1961 ^ p1962;
      },
      EZWqt: "缺失userId！"
    };
    const v1844 = JSON.parse(p1960.request.body);
    const {
      userId: _0x398e71
    } = v1844;
    const {
      userType: _0x1c637c
    } = p1960.user;
    if (_0x1c637c !== "admin" && _0x1c637c !== "superAdmin") {
      p1960.response.status = 412;
      p1960.body = vRequire30.ERROR_412("非管理员，无权调用此接口！");
      return;
    }
    if (_0x398e71) {
      await UserModel.deleteUserByUserId(_0x398e71);
      await UserTokenModel.deleteUserToken(_0x398e71);
      p1960.response.status = 200;
      p1960.body = vRequire30.SUCCESS_200(v1843.rzIfM, v1843.UxIOe(877518, 877518));
    } else {
      p1960.response.status = 412;
      p1960.body = vRequire30.ERROR_412(v1843.EZWqt);
    }
  }
  static async setAdmin(p1963) {
    const v1845 = {
      PYzaT: function (p1964, p1965) {
        return p1964 !== p1965;
      },
      BGqHV: "superAdmin",
      otSKm: "管理员设置成功",
      WIHYK: "缺失userId！"
    };
    const v1846 = JSON.parse(p1963.request.body);
    const {
      userId: _0xc42876,
      setType: _0x9d08cb
    } = v1846;
    const {
      userType: _0x385fef
    } = p1963.user;
    if (v1845.PYzaT(_0x385fef, v1845.BGqHV)) {
      p1963.response.status = 412;
      p1963.body = vRequire30.ERROR_412("非超级管理员，无权设置管理员！");
      return;
    }
    if (_0xc42876) {
      await UserModel.setAdmin(_0xc42876, _0x9d08cb);
      await UserTokenModel.deleteUserToken(_0xc42876);
      p1963.response.status = 200;
      p1963.body = vRequire30.SUCCESS_200(v1845.otSKm, 0);
    } else {
      p1963.response.status = 412;
      p1963.body = vRequire30.ERROR_412(v1845.WIHYK);
    }
  }
  static async resetSuperAdmin(p1966) {
    const v1847 = {
      AnHNR: function (p1967, p1968) {
        return p1967 ^ p1968;
      },
      OXRFU: function (p1969, p1970) {
        return p1969 ^ p1970;
      }
    };
    const v1848 = JSON.parse(p1966.request.body);
    const v1849 = v1848.userId;
    const {
      userType: _0x1ac59e,
      userId: _0x47815e
    } = p1966.user;
    if (_0x1ac59e !== "superAdmin") {
      p1966.response.status = 412;
      p1966.body = vRequire30.ERROR_412("非超级管理员，无权设置管理员！");
      return;
    }
    if (_0x47815e) {
      const v1850 = "0|1|2|3|4".split("|");
      let v1851 = 0;
      while (true) {
        switch (v1850[v1851++]) {
          case "0":
            await UserModel.resetSuperAdmin(_0x47815e, v1849);
            continue;
          case "1":
            await UserTokenModel.deleteUserToken(_0x47815e);
            continue;
          case "2":
            await UserTokenModel.deleteUserToken(v1849);
            continue;
          case "3":
            p1966.response.status = v1847.AnHNR(647517, 647573);
            continue;
          case "4":
            p1966.body = vRequire30.SUCCESS_200("超级管理员移交成功", v1847.OXRFU(306786, 306786));
            continue;
        }
        break;
      }
    } else {
      p1966.response.status = 412;
      p1966.body = vRequire30.ERROR_412("缺失userId！");
    }
  }
  static async checkSsoToken(p1971) {
    const v1852 = {
      YSttU: "Token验证无效1！",
      veeNi: function (p1972, p1973) {
        return p1972 ^ p1973;
      },
      GscFq: function (p1974, p1975) {
        return p1974 ^ p1975;
      }
    };
    const v1853 = JSON.parse(p1971.request.body);
    const {
      token: _0x137b68
    } = v1853;
    const v1854 = await vRequire26.postJson(accountInfo.ssoCheckUrl, {
      token: _0x137b68
    });
    if (!v1854) {
      p1971.response.status = 500;
      p1971.body = vRequire30.ERROR_500(v1852.YSttU, 1);
      return;
    }
    const {
      phone: _0x240958,
      email: _0x20f635
    } = v1854.data;
    const v1855 = await C38.createSsoToken(_0x240958, _0x20f635);
    if (v1855) {
      p1971.response.status = v1852.veeNi(481665, 481609);
      p1971.body = vRequire30.SUCCESS_200("success", v1855);
    } else {
      p1971.response.status = v1852.GscFq(827656, 827540);
      p1971.body = vRequire30.ERROR_412("登录失败，账号无效或不存在！", 0);
    }
  }
  static async ["createSsoToken"](p1976, p1977) {
    const v1856 = {
      svCUZ: function (p1978, p1979) {
        return p1978 ^ p1979;
      },
      qrdIV: function (p1980, p1981) {
        return p1980 * p1981;
      }
    };
    const v1857 = await UserModel.checkUserByPhoneOrEmail(p1976, p1977);
    if (!v1857 || !v1857.length) {
      return 0;
    }
    if (v1857.length > 1) {
      return v1856.svCUZ(621811, 621811);
    }
    const {
      userId: _0x4729a3,
      userType: _0xc4ac12,
      emailName: _0x574d55,
      nickname: _0x38642b,
      companyId = "1"
    } = v1857[0];
    const v1858 = vRequire32.sign({
      userId: _0x4729a3,
      userType: _0xc4ac12,
      emailName: _0x574d55,
      nickname: _0x38642b,
      companyId: companyId
    }, vRequire33.sign, {
      expiresIn: v1856.qrdIV(v1856.svCUZ(400202, 400210) * 33 * 60, v1856.svCUZ(747547, 747559)) * 1000
    });
    const v1859 = await UserTokenModel.getUserTokenDetail(_0x4729a3);
    if (v1859) {
      await UserTokenModel.updateUserToken(_0x4729a3, {
        ...v1859,
        accessToken: v1858
      });
    } else {
      await UserTokenModel.createUserToken({
        userId: _0x4729a3,
        accessToken: v1858
      });
    }
    return v1858;
  }
  static async bindOpenid(p1982) {
    const v1860 = {
      SKagF: "success",
      NbFpk: function (p1983, p1984) {
        return p1983 ^ p1984;
      }
    };
    const {
      userId: _0x66d59b,
      openid: _0x4050df
    } = JSON.parse(p1982.request.body);
    await UserModel.updateUserByUserId(_0x66d59b, {
      openid: _0x4050df
    });
    p1982.response.status = 200;
    p1982.body = vRequire30.SUCCESS_200(v1860.SKagF, v1860.NbFpk(315912, 315912));
  }
  static async checkUserByOpenid(p1985) {
    const v1861 = {
      ndJCq: function (p1986, p1987) {
        return p1986 === p1987;
      },
      dfQeM: "string",
      QJizv: function (p1988, p1989) {
        return p1988 ^ p1989;
      },
      uLwdF: function (p1990, p1991) {
        return p1990 ^ p1991;
      },
      LcBon: function (p1992, p1993) {
        return p1992 ^ p1993;
      },
      orzPt: "success"
    };
    const {
      openid: _0x33e4c3
    } = v1861.ndJCq(typeof p1985.request.body, v1861.dfQeM) ? JSON.parse(p1985.request.body) : p1985.request.body;
    const v1862 = await UserModel.getUserByOpenid(_0x33e4c3);
    let v1863 = "";
    if (v1862 && v1862.length) {
      const {
        userId: _0xed063f,
        companyId: _0x568500,
        userType: _0x451d9e,
        emailName: _0x3396d2,
        nickname: _0x5b8cdf
      } = v1862[0];
      const v1864 = vRequire32.sign({
        userId: _0xed063f,
        companyId: _0x568500,
        userType: _0x451d9e,
        emailName: _0x3396d2,
        nickname: _0x5b8cdf
      }, vRequire33.sign, {
        expiresIn: v1861.QJizv(264148, 264168) * 792 * v1861.uLwdF(780222, 780162) * v1861.LcBon(751592, 750592)
      });
      const v1865 = await UserTokenModel.getUserTokenDetail(_0xed063f);
      if (v1865) {
        await UserTokenModel.updateUserToken(_0xed063f, {
          ...v1865,
          accessToken: v1864
        });
      } else {
        await UserTokenModel.createUserToken({
          userId: _0xed063f,
          accessToken: v1864
        });
      }
      v1863 = v1864;
    }
    p1985.response.status = 200;
    p1985.body = vRequire30.SUCCESS_200(v1861.orzPt, v1863);
  }
}
module.exports = {
  UserTokenController: C20,
  AlarmOverviewController: C21,
  AlarmListController: C22,
  AlarmRuleController: C23,
  ApplicationConfigController: C26,
  CommonTableController: C24,
  AlarmTriggerController: C25,
  CompanyController: C27,
  FlowDataInfoByHourController: C28,
  FlowDataInfoByDayController: C29,
  OrderInfoController: C30,
  MenuPermissionsController: C31,
  ProductController: C32,
  TeamController: C33,
  NoticeTemplateController: C37,
  TimerCalculateController: C34,
  ConfigController: C35,
  MessageController: C36,
  UserController: C38
};