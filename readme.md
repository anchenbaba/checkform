<script>
$(document).ready(function() {
    var rules = {
            "amount"         : [/^0.([1-9]){1,2}$/,"必须为0.85这样的数字"]
        }; //附加规则
    var items_array2 = [
            { name:"password",rule:'password',tips:'最小长度:6 最大长度:16',success:'',error:'',ajax:{method:'post',url: 'ajax.php'}}
        ];
    //tips 提示信息  success 如果不设置 则为不提示 若为空则为默认 error 如果不设置 则是规则中的错误信息 若为空 则默认错误信息
    var index='';
    $('#form3').addRules(rules).checkform({
        items           : items_array2, // 要验证的表单字段 也可以写在html里
        isAjaxSubmit    : true, //是否ajax提交表单
        clearForm       : true, // ajax提交表单后是否清空表单
        require         : true, // 是否显示必填标志 如果为字符串 则显示字符串 如果 'placeholder' 则显示placeholder信息
        type            : 'POST', // ajax提交表单方式
        dataType        : 'json', //default: Intelligent Guess (Other values: xml, json, script, or html)
        success         : function(obj, data, textStatus, jqXHR){if(data.status==1)location.href = "success.html";},//ajax提交表单成功过后的回调函数
        error           : function(obj, jqXHR, textStatus, errorThrown){layer.alert('数据提交失败', {icon: 6});},//ajax提交表单错误后的回调函数
        complete        : function(obj){
            $('input:submit',obj).removeAttr('disabled');
            $('input:submit',obj).val('提交完成');
        },//ajax提交完成后的回调函数 例如取消提交按钮状态
        beforeSend      : function(obj){
            $('input:submit',obj).val('正在提交');
            $('input:submit',obj).attr('disabled','disabled');
        },//ajax提交前的回调函数 例如提交按钮禁用
        //以下如果设置了回调函数 可以自定义提示方式，例如下面用了layer提示插件
        fieldTips       : function(obj,msg,formname){index = layer.tips(msg, obj,{time:0});},
        fieldSuccess    : function(obj,msg,formname){layer.close(index);
        },
        fieldError      : function(obj,msg,formname){index = layer.tips(msg, obj,{time:0});},
        fieldPwdStrong  : function(score,field,formObj){},//密码强度显示方式 socre为强度分数，具体见下面说明
        floatTips : {top:0,left:0,width:200,stayShow:false} // 另一种tips提示样式 留空为默认的样式 。前提是没设置上面的回调函数
        });
});
</script>

<form id="form3" method="post" action="post.php">
<p>
<input type="text" name="info2[login]" style="width:200px;" value="test111" validate='{rule:"username",success:"ok",error:"好好填写用户名",tips:"用户名提示信息" }' />
<!--validate属性里是验证的规则内容 会覆盖上面的items_array2 如果name同名的话-->
</p>
<p>
<input type="password" name="password" style="width:200px" value="" />
</p>
<p>
  <input type="text" name="fajax" style="width:200px" value="" validate='{rule:"strongpwd",require:false,ajax:{url: "./ajax.php"}}' />
</p>
<input type="submit" class="button" value="注册"/>
</form>

附带规则列表
规则   错误提示信息
"eng"  "只能输入英文",
"chn"  "只能输入汉字",
"mail" "格式不正确"
"url"  "格式不正确",
"currency" "数字格式有误",
"number"   "只能为数字",
"int"      "只能为整数",
"double"   "只能为带小数的数字",
"username" "英文开头,数字和英文及下划线和点的组合，3-19个字符",
"password"  "只能为数字和英文及下划线的组合，6-20个字符",
"strongpwd" "至少7个字符，必须同时含有字母和数字,或者字母大小写",
"safe"      "不能有特殊字符",
"dbc"       "不能有全角字符",
"qq"        "格式不正确",
"date"      "格式不正确",
"telephone" "格式不正确",
"mobilephone" "格式不正确",
"zipcode"   "格式不正确",
"bodycard"  "格式不正确",
"ip"        "IP不正确",
// 函数规则
"eq"        : [function(arg1,arg2){ return arg1==arg2 ? true:false;},"必须等于"],
"gt"        : [function(arg1,arg2){ return arg1>arg2 ? true:false;},"必须大于"],
"gte"       : [function(arg1,arg2){ return arg1>=arg2 ? true:false;},"必须大于或等于"],
"lt"        : [function(arg1,arg2){ return arg1<arg2 ? true:false;},"必须小于"],
"lte"       : [function(arg1,arg2){ return arg1<=arg2 ? true:false;},"必须小于或等于"]

密码强度检测
在html里添加
<div class="checkform_pwdstrong">
    <div class="checkform_pwdstrong_line"> </div>
    <div class="checkform_pwdstrong_line"> </div>
    <div class="checkform_pwdstrong_line"> </div>
    <div class="checkform_pwdstrong_line"> </div>
    <div class="checkform_pwdstrong_words"> 弱</div>
    <div class="checkform_pwdstrong_words"> 中</div>
    <div class="checkform_pwdstrong_words"> 好</div>
    <div class="checkform_pwdstrong_words"> 强</div>
</div>
规则
一、密码长度:

    5 分: 小于等于 4 个字符
    10 分: 5 到 7 字符
    25 分: 大于等于 8 个字符

二、字母:

    0 分: 没有字母
    10 分: 全都是小（大）写字母
    20 分: 大小写混合字母

三、数字:

    0 分: 没有数字
    10 分: 1 个数字
    20 分: 大于等于 3 个数字

四、符号:

    0 分: 没有符号
    10 分: 1 个符号
    25 分: 大于 1 个符号

五、奖励:

    2 分: 字母和数字
    3 分: 字母、数字和符号
    5 分: 大小写字母、数字和符号

最后的评分标准(总分95):

    >= 90: 非常安全
    >= 80: 安全（Secure）
    >= 70: 非常强
    >= 60: 强（Strong）
    >= 50: 一般（Average）
    >= 25: 弱（Weak）
    >= 0: 非常弱
