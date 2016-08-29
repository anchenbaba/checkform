/*
* jquery 表单验证插件
* @Author: anchen
* @Date:   2015-09-07 16:02:57
* @Last Modified by:   anchen
* @Last Modified time: 2015-10-28 12:08:36
*/

(function($) {
    $.fn.checkform = function(options) {
        var o = $(this);
        if( !o.is("form") ) return;
        var formname = o.attr('name') || o.attr('id') || 'form1';
        options = $.extend({}, $.checkform.defaults, options || {});
        // 计算根路径
        if (!options.root) {
            $('script').each(function(a, tag) {
                miuScript = $(tag).get(0).src.match(/(.*)checkform(\.min)?\.js$/);
                if (miuScript !== null) options.root = miuScript[1];
            });
        }
        //加载css样式
        if ($("link[href$='checkform.css']").length == 0){
            $("head").append('<link href="'+options.root+'checkform.css" rel="stylesheet" rev="stylesheet" type="text/css" />');
        }
        //直接在标签里定义的规则会覆盖script里定义的规则，如果重复的话
        var items = o.find('input[validate],select[validate],textarea[validate]');
        var formItems = [];
        $.each(items, function(index, val) {
            var v = $(this).attr('validate');
            if(v != null && v != ''){
                var v2 = eval('('+v+')');
                v2.name = this.name;
                formItems.push(v2);
            }
        });
        for (var i = options.items.length - 1; i >= 0; i--) {
            for (var i2 in formItems) {
                if(options.items[i]['name'] == formItems[i2]['name']){
                    options.items.splice(i,1);
                }
            }
        }
        options.items = options.items.concat(formItems);
        formItems = null;items=null;

        var rule = $.checkform.rules,
            placeholder = function(){
                var isSupport = 'placeholder' in document.createElement('input');
                if(!isSupport){
                    var fields = $('input[placeholder],textarea[placeholder]');
                    $.each(fields, function(index, val) {
                        var input = $(this);
                        if (input.val() == '' || input.val() == input.attr('placeholder')) {
                            input.addClass('placeholder');
                            input.val(input.attr('placeholder'));
                            if(input.attr('type') == 'password'){
                            }
                        }
                    });
                    fields.focus(function() {
                        var input = $(this);
                        if (input.val() == input.attr('placeholder')) {
                            input.val('');
                            input.removeClass('placeholder');
                        }
                    }).blur(function() {
                        var input = $(this);
                        if (input.val() == '' || input.val() == input.attr('placeholder')) {
                            input.addClass('placeholder');
                            input.val(input.attr('placeholder'));
                            if(input.attr('type') == 'password'){
                            }
                        }
                    });
                }
            },
            //规则类型匹配检测
            ruleTest = function(){
                var result = true,args = arguments;
                if(rule.hasOwnProperty(args[0])){
                    var t = rule[args[0]][0], v = args[1];
                    result = args.length>2 ? t.apply(arguments,[].slice.call(args,1)):($.isFunction(t) ? t(v) :t.test(v));
                }
                return result;
            },
            passwordStrongTest = function(field){
                if(options.fieldPwdStrong && $.isFunction(options.fieldPwdStrong)) {
                    field.keyup(function(event) {
                        var passString = $(this).val();
                        var length = passString.length;
                        var count=0;
                        if(length > 0){
                            count += length <= 4 ? 5:(length >= 8?25:10);
                            count += !passString.match(/[a-z]/i)?0:(passString.match(/[a-z]/) && passString.match(/[A-Z]/)?20:10);
                            count += !passString.match(/[0-9]/)?0:(passString.match(/[0-9]/g).length >= 3?20:10);
                            count += !passString.match(/[\W_]/)?0:(passString.match(/[\W_]/g).length > 1?25:10);
                            count += !passString.match(/[0-9]/)||!passString.match(/[a-z]/i)?0:(!passString.match(/[\W_]/)?2:(!passString.match(/[a-z]/) || !passString.match(/[A-Z]/)?3:5));
                        }
                        // console.log(count);
                        options.fieldPwdStrong(count,field,o);
                    });
                }
            },
            //ajax验证
            ajax = function (item,fv,obj){
                fv = encodeURI(fv);
                $.ajax({
                    type    : item.ajax.method || 'POST',
                    url     : item.ajax.url,
                    data    : item.name+"="+fv,
                    cache   : false,
                    async   : item.ajax.async || true,// false使用同步方式执行AJAX，true使用异步方式执行ajax
                    beforeSend:function(xhr){
                        obj.data("ajax_checking",0);
                        options.fieldTips(obj,'检测中...',formname);
                    }
                })
                .done(function(data, textStatus, jqXHR) {
                    if (data.status == 1){
                        var msg = data.info || item.success;
                        options.fieldSuccess(obj,msg,formname);
                        obj.data("ajax_checking",1);
                        obj.data("ajax_msg",msg);
                    }else if(data.status == 0){
                        var msg = data.info || item.error;
                        options.fieldError(obj,msg,formname);
                        obj.data("ajax_msg",msg);
                    }else{
                        var msg = data.info || item.error || '返回信息错误';
                        options.fieldError(obj,msg,formname);
                        obj.data("ajax_msg",msg);
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    options.fieldError(obj,'检测失败',formname);
                    obj.data("ajax_checking",-9);
                    obj.data("ajax_msg",'检测失败');
                })
                .always(function(a,b,c) {
                    //options.fieldTips(obj,'',formname);
                });
            },
            fieldCheck = function(obj,item){
                //var obj = $("[name='"+filedName+"']",o);
                var fv = $.trim(obj.val()),
                    result = true,
                    errorMsg = '',
                    isRq = typeof item.require ==="boolean" ? item.require : true;
                for (var i = options.items.length - 1; i >= 0; i--) {
                    if(options.items[i]['name'] == obj.attr('name')){
                        if(obj.length == 1 || obj.is(":radio")){
                            if( isRq && ((obj.is(":radio")|| obj.is(":checkbox")) && !obj.is(":checked"))){
                                errorMsg = item.error==undefined ? "必须选择" : item.error;
                                result = false;
                            }else if(isRq && fv == "" ){
                                errorMsg = item.error==undefined ? ( obj.is("select") ? "必须选择" :"不能为空" ) : item.error;
                                result = false;
                            }else if(fv != ""){
                                if(item.min || item.max){
                                    var len = fv.length, min = item.min || 0, max = item.max;
                                    errorMsg =  item.error==undefined ? (max? "长度范围应在"+min+"~"+max+"之间":"长度应大于"+min) : item.error;
                                    if( (max && (len>max || len<min)) || (!max && len<min) ){
                                        result = false;
                                    }
                                }
                                if(result && item.rule){
                                    var matchVal = item.to ? $.trim($("[name='"+item.to+"']",o).val()) :item.value;
                                    var matchRet = matchVal ? ruleTest(item.rule,fv,matchVal) :ruleTest(item.rule,fv);

                                    if(item.error == undefined){
                                        errorMsg = rule[item.rule][1];
                                        if(matchVal){
                                            errorMsg+= $("[name='"+item.to+"']",o).attr('type') == 'password' ? '输入的密码':matchVal;
                                        }
                                    }else{
                                        errorMsg = item.error;
                                    }

                                    if(!matchRet){
                                        result = false;
                                    }
                                }
                                if (result && item.eq){
                                    var eqVal = item.eq || 0;
                                    if (fv != eqVal){
                                        errorMsg = item.error==undefined ? '必须等于'+eqVal : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.neq){
                                    var neqVal = item.neq || 0;
                                    if (fv == neqVal){
                                        errorMsg = item.error==undefined ? '必须不等于'+neqVal : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.gt){
                                    var gtVal = item.gt || 0;
                                    if (fv <= gtVal){
                                        errorMsg = item.error==undefined ? '必须大于'+gtVal : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.gte){
                                    var gteVal = item.gte || 0;
                                    if (fv < gteVal){
                                        errorMsg = item.error==undefined ? '必须大于等于'+gteVal : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.lt){
                                    var ltVal = item.lt || 0;
                                    if (fv >= ltVal){
                                        errorMsg = item.error==undefined ? '必须小于'+ltVal : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.lte){
                                    var lteVal = item.lte || 0;
                                    if (fv > lteVal){
                                        errorMsg = item.error==undefined ? '必须小于等于'+lteVal : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.between){
                                    var from = item.between[0],to = item.between[1];
                                    if (fv >= +from && fv <= +to){
                                    }else{
                                        errorMsg = item.error==undefined ? '必须在'+from+'到'+to : item.error;
                                        result = false;
                                    }
                                }
                                if (result && item.ajax){
                                    if (obj.attr('last_val') != obj.val()){
                                        //如果上次ajax没有验证过
                                        ajax(item,fv,obj);
                                        obj.attr('last_val',obj.val());
                                        continue;
                                    }else{
                                        if (obj.data("ajax_checking") == 1){
                                            item.success = obj.data("ajax_msg");
                                        }else if (obj.data("ajax_checking") == 0){
                                            errorMsg = obj.data("ajax_msg");
                                            result = false;
                                        }else{
                                            ajax(item,fv,obj);
                                            obj.attr('last_val',obj.val());
                                            continue;
                                        }
                                    }
                                }
                            }
                        }else{
                            if (obj.is("input:checkbox")){
                                var checked_count = 0;
                                obj.each(function(){
                                    if (this.checked == true){
                                        checked_count ++;
                                    }
                                });
                                if(item.checked_limit){
                                    var min = item.checked_limit[0] || 1, max = item.checked_limit[1] || null;
                                    errorMsg = item.error==undefined ? ((min==max)?"请必须选择"+min+"项":(max ? "请选择"+min+"到"+max+"项目":"请至少选择" +min + "项")) : item.error;
                                    if( (max && (checked_count>max || checked_count<min)) || (!max && checked_count<min) ){
                                        result = false;
                                    }
                                }
                            }
                        }
                        if(result){
                            // options.items[i]['is_checked'] = 1;
                            obj.data('is_checked',1);
                            options.fieldSuccess(obj,item.success,formname);
                            return true;
                        }else{
                            // options.items[i]['is_checked'] = 0;
                            obj.data('is_checked',0);
                            options.fieldError(obj,errorMsg,formname);
                            return false;
                        }
                    // break;
                    }
                }
                return true;
            },
            validate = function(){
                var ret = true;
                var isbubble = options.isBubble ? true : false;
                var tmp = true;
                $.each(options.items, function(index, val){
                    var field = $("[name='"+this.name+"']",o);
                    if(field.length>0){
                        if(field.data('is_checked') ==  1) {
                            return true; // == continue
                        }else{
                            if(isbubble){
                                tmp = fieldCheck(field,val);
                                if(tmp == false && ret == true)
                                    ret = false;
                                return true;
                            }else{
                                ret = fieldCheck(field,val);
                                return ret;
                            }
                        }
                    }
                });
                if(ret == true) {
                    $('input,select,textarea', o).data('is_checked',0);
                }
                return ret;
            },
            ajaxSubmit = function(options){
                var callbacks = [];
                var url = options.url || $.trim(o.attr('action'));
                var type = options.type || $.trim(o.attr('method')) || 'POST';
                if (url) url = (url.match(/^([^#]+)/)||[])[1];// 获取url中“#”字符前面的地址
                url = url || window.location.href || '';
                var q = o.serialize();
                //$.unique(a1.concat(a2))
                $.ajax({
                    url: url,
                    type: type,
                    dataType: options.dataType,
                    data: q,
                    beforeSend:function(xhr){options.beforeSend(o,xhr);}
                })
                .done(function(data, textStatus, jqXHR) {
                    if(options.clearForm){
                        o.clearForm();
                    }
                    options.success(o, data, textStatus, jqXHR);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    options.error(o, jqXHR, textStatus, errorThrown);
                })
                .always(function(a,b,c) {
                    options.complete(o,a,b,c);
                });
                return false;
            };
        //单元素事件绑定
        $.each(options.items, function(index, val){
            var field = $("[name='"+this.name+"']",o);
            if(field.length>0){
                var isRq = typeof val.require ==="boolean" ? val.require : true;
                if(options.require && isRq){
                    var tips;
                    if(options.require === true)
                        tips = val.tips || rule[val.rule][1] || '';
                    else if(options.require == 'placeholder'){
                        tips = field.attr('placeholder') || val.tips || rule[val.rule][1] || '';
                        field.attr('placeholder',tips);
                        tips = '';
                    }
                    else
                        tips = options.require;
                    options.fieldRequire(field,tips,formname);
                }
                if(field.is(":file") || field.is("select")){
                    field.change(function(){fieldCheck(field,val);}).focus(function(){
                        var tips = val.tips || rule[val.rule][1] || '';
                        options.fieldTips(field,tips,formname);});
                }else{
                    field.blur(function(){fieldCheck(field,val);}).focus(function(){
                        var tips = val.tips || rule[val.rule][1] || '';
                        options.fieldTips(field,tips,formname);});
                    //密码强度检测
                    if(field.is(":password")){
                        passwordStrongTest(field);
                    }
                }
            }
        });
        placeholder();
        return this.each(function(){
            //提交事件绑定
            if(options.isAjaxSubmit) {
                o.submit(function(){
                    if (validate()){//验证通过-ajax提交数据
                        ajaxSubmit(options);
                    }
                    return false;
                });
            }else{//非ajax提交数据
                o.submit(validate);
            }
        });
    };
    $.fn.addRules = function(rules){
        return this.each(function(){
            $.extend($.checkform.rules , rules || {});
            for(var name in $.checkform.rules){
                if($.checkform.rules[name] == null || $.checkform.rules[name] == undefined){
                    delete $.checkform.rules[name];
                }
            }
        });
        //return this;
    };

    $.checkform = function(){};
    $.checkform.tipsname = function(formname,namestr){
        if(formname == '' || formname == undefined) formname == 'form1';
        namestr = namestr.replace(/(\.|\[|\])/g,'');
        // return formname + "_tip_" + namestr.replace(/([a-zA-Z0-9])/g,"-$1");
        return formname + "_tips_" + namestr;
    };
    //密码强度显示方式
    $.checkform.fieldPwdStrong = function(score,field,formObj){
        var pwdstrong = $('.checkform_pwdstrong',formObj);
        if(pwdstrong.length == 0) return;
        var child = pwdstrong.children('.checkform_pwdstrong_line');
        if(score == 0 ){
            child.css('background','#d6d3d3');
        }else if(score > 0 && score <50){
            child.eq(0).css('background','#ff3300');
            child.eq(1).css('background','#d6d3d3');
            child.eq(2).css('background','#d6d3d3');
            child.eq(3).css('background','#d6d3d3');
        }else if(score >=50 && score < 60){
            child.eq(0).css('background','#ff3300');
            child.eq(1).css('background','#099');
            child.eq(2).css('background','#d6d3d3');
            child.eq(3).css('background','#d6d3d3');
        }else if(score >=60 && score < 80){
            child.eq(0).css('background','#ff3300');
            child.eq(1).css('background','#099');
            child.eq(2).css('background','#060');
            child.eq(3).css('background','#d6d3d3');
        }else if(score >=80){
            child.eq(0).css('background','#ff3300');
            child.eq(1).css('background','#099');
            child.eq(2).css('background','#060');
            child.eq(3).css('background','black');
        }
    };
    //单个字段验证提示、
    $.checkform.fieldShowFloatTips = function(obj,msg,tips,type,formname){
        if(formname == '' || formname == undefined) formname == 'form1';
        var id = tips.stayShow ? 'checkform_float_tips_'+$.checkform.tipsname(formname,obj.attr('name')) : 'checkform_float_tips';
        var jobj = $("#"+id);
        var type = type ? 'checkform_float_tips checkform_float_tips_' + type : 'checkform_float_tips';
        if(!jobj.length){
            $('<div id="'+id+'" style="position: absolute;z-index:3000"><div style="position: relative;"><div class="checkform_float_anglel"><i class="checkform_float_anglel_icon"></i></div><div class="checkform_float_tips"></div></div></div>').appendTo("body");
            jobj = $("#"+id);
        }
        var tipPosition = obj.next().length>0 ? obj.nextAll(":last"):obj;
        var offset = tipPosition.offset();
        msg ? jobj.show() : jobj.hide();
        jobj.css({
            top: offset.top - 2 + (tips.top ? tips.top : 0),
            left: offset.left + tipPosition.width() + 18 + (tips.left ? tips.left : 0),
            width: tips.width
        });
        $(jobj.find(".checkform_float_tips")[0]).width(tips.width - 30).html(tips.change ? tips.change(obj,msg) : msg).attr('class',type);
    };
    $.checkform.fieldRequire = function(obj,msg,formname){
        var tips = $.checkform.tipsname(formname,obj.attr('name'));
        var tipsObj = $("#"+tips);
        if(tipsObj.length>0){
            tipsObj.remove();
        }
        var tipPosition = obj.next().length>0 ? obj.nextAll(":last"):obj;
        tipPosition.after("<span id='"+tips+"' class='checkform_require'> "+ msg +" </span>");
    };
    $.checkform.fieldTips = function(obj,msg,formname){
        if(!$.isEmptyObject(this.floatTips)){
            $.checkform.fieldShowFloatTips(obj,msg,this.floatTips,'',formname);
            return;
        }
        var tips = $.checkform.tipsname(formname,obj.attr('name'));
        var tipsObj = $("#"+tips);
        if(tipsObj.length>0){
            tipsObj.remove();
        }
        var tipPosition = obj.next().length>0 ? obj.nextAll(":last"):obj;
        tipPosition.after("<span id='"+tips+"' class='checkform_tips'> "+ msg +" </span>");
    };
    $.checkform.fieldSuccess = function(obj,msg,formname){
        if(msg=='') msg = '√';
        if(!$.isEmptyObject(this.floatTips)){
            $.checkform.fieldShowFloatTips(obj,msg,this.floatTips,'success',formname);
            return;
        }
        var tips = $.checkform.tipsname(formname,obj.attr('name'));
        var tipsObj = $("#"+tips);
        if(tipsObj.length>0){
            tipsObj.remove();
        }
        if(msg == undefined) return;
        var tipPosition = obj.next().length>0 ? obj.nextAll(":last"):obj;
        tipPosition.after("<span id='"+tips+"' class='checkform_success'> "+ msg +" </span>");
    };
    $.checkform.fieldError = function(obj,msg,formname){
        if(msg==undefined || msg=='') msg = 'X';
        if(!$.isEmptyObject(this.floatTips)){
            $.checkform.fieldShowFloatTips(obj,msg,this.floatTips,'error',formname);
            return;
        }
        var tips = $.checkform.tipsname(formname,obj.attr('name'));
        var tipsObj = $("#"+tips);
        if(tipsObj.length>0){
            tipsObj.remove();
        }
        var tipPosition = obj.next().length>0 ? obj.nextAll(":last"):obj;
        tipPosition.after("<span id='"+tips+"' class='checkform_error'> "+ msg +" </span>");
    };
    $.ajaxsendform = function(){};
    $.ajaxsendform.success = function(obj, data, textStatus, jqXHR){
        console.log('success');
    };
    $.ajaxsendform.error = function(obj, jqXHR, textStatus, errorThrown){
        alert('数据发送失败');
    };
    $.ajaxsendform.complete = function(obj,a,b,c){
        $('input:submit',obj).removeAttr('disabled');
        $('input:submit',obj).val('提交完成');
    };
    $.ajaxsendform.beforeSend = function(obj,xhr){
        $('input:submit',obj).val('正在提交');
        $('input:submit',obj).attr('disabled','disabled');
    };
    $.checkform.defaults = {
        items               : [],
        isBubble            : false,
        isAjaxSubmit        : false,
        type                : 'POST', // ajax提交表单方式
        dataType            : 'json', //default: Intelligent Guess (Other values: xml, json, script, or
        success             : $.ajaxsendform.success,//ajax提交成功过后的回调函数
        error               : $.ajaxsendform.error,//ajax提交错误后的回调函数
        complete            : $.ajaxsendform.complete,//ajax提交完成后的回调函数
        beforeSend          : $.ajaxsendform.beforeSend,//ajax提交前的回调函数
        clearForm           : true,
        root                : '',
        require             : '',
        fieldRequire        : $.checkform.fieldRequire,
        fieldTips           : $.checkform.fieldTips,
        fieldSuccess        : $.checkform.fieldSuccess,
        fieldError          : $.checkform.fieldError,
        fieldPwdStrong      : $.checkform.fieldPwdStrong,
        floatTips           : {}
    };
    $.checkform.rules = {
        "eng"       : [/^[A-Za-z]+$/,"只能输入英文"],
        "chn"       : [/^[\u0391-\uFFE5]+$/,"只能输入汉字"],
        "mail"      : [/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,"格式不正确"],
        "url"       : [/^http[s]?:\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/,"格式不正确"],
        "currency"  : [/^\d+(\.\d+)?$/,"数字格式有误"],
        "number"    : [/^\d+$/,"只能为数字"],
        "int"       : [/^[0-9]{1,30}$/,"只能为整数"],
        "double"    : [/^[-\+]?\d+(\.\d+)?$/,"只能为带小数的数字"],
        "username"  : [/^[a-zA-Z]{1}([a-zA-Z0-9]|[._]){3,19}$/,"英文开头,数字和英文及下划线和点的组合，3-19个字符"],
        "password"  : [/^(\w){6,20}$/,"只能为数字和英文及下划线的组合，6-20个字符"],
        "strongpwd" : [/^(?=.{7,})(((?=.*[A-Z])(?=.*[a-z]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))).*$/,"至少7个字符，必须同时含有字母和数字,或者字母大小写"],
        "safe"      : [/>|<|,|\[|\]|\{|\}|\?|\/|\+|=|\||\'|\\|\"|:|;|\~|\!|\@|\#|\*|\$|\%|\^|\&|\(|\)|`/i,"不能有特殊字符"],
        "dbc"       : [/[ａ-ｚＡ-Ｚ０-９！＠＃￥％＾＆＊（）＿＋｛｝［］｜：＂＇；．，／？＜＞｀～　]/,"不能有全角字符"],
        "qq"        : [/[1-9][0-9]{4,}/,"格式不正确"],
        "date"      : [/^((((1[6-9]|[2-9]\d)\d{2})-(0?[13578]|1[02])-(0?[1-9]|[12]\d|3[01]))|(((1[6-9]|[2-9]\d)\d{2})-(0?[13456789]|1[012])-(0?[1-9]|[12]\d|30))|(((1[6-9]|[2-9]\d)\d{2})-0?2-(0?[1-9]|1\d|2[0-8]))|(((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))-0?2-29-))$/,"格式不正确"],
        "telephone" : [/^1\d{10}$/,"格式不正确"],
        "mobilephone" : [/^((\+86)|(86))?1[3|4|5|7|8]\d{9}$/,"格式不正确"],
        "zipcode"   : [/^[1-9]\d{5}$/,"格式不正确"],
        "bodycard"  : [/^((1[1-5])|(2[1-3])|(3[1-7])|(4[1-6])|(5[0-4])|(6[1-5])|71|(8[12])|91)\d{4}((19\d{2}(0[13-9]|1[012])(0[1-9]|[12]\d|30))|(19\d{2}(0[13578]|1[02])31)|(19\d{2}02(0[1-9]|1\d|2[0-8]))|(19([13579][26]|[2468][048]|0[48])0229))\d{3}(\d|X|x)?$/,"格式不正确"],
        "ip"        : [/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/,"IP不正确"],
        // 函数规则
        "eq"        : [function(arg1,arg2){ return arg1==arg2 ? true:false;},"必须等于"],
        "gt"        : [function(arg1,arg2){ return arg1>arg2 ? true:false;},"必须大于"],
        "gte"       : [function(arg1,arg2){ return arg1>=arg2 ? true:false;},"必须大于或等于"],
        "lt"        : [function(arg1,arg2){ return arg1<arg2 ? true:false;},"必须小于"],
        "lte"       : [function(arg1,arg2){ return arg1<=arg2 ? true:false;},"必须小于或等于"]
    };

    $.fn.clearForm = function() {
        return this.each(function() {
            $('input,select,textarea', this).clearFields();
        });
    };

    $.fn.clearFields = function() {
        return this.each(function() {
            var t = this.type, tag = this.tagName.toLowerCase();
            if (t == 'text' || t == 'password' || tag == 'textarea') {
                this.value = '';
            }
            else if (t == 'checkbox' || t == 'radio') {
                this.checked = false;
            }
            else if (tag == 'select') {
                this.selectedIndex = -1;
            }
        });
    };
})(jQuery);