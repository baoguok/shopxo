FromInit('form.form-validation-pay');
FromInit('form.form-validation-take');
$(function()
{
    // 支付操作
    var $form_pay = $('form.form-validation-pay');
    $(document).on('click', '.submit-pay', function()
    {
        var payment_id = parseInt($(this).data('payment-id') || 0);
        $form_pay.find('input[name=id]').val($(this).data('id'));
        $form_pay.find('input[name=payment_id]').val(0);
        $form_pay.find('ul.payment-list li').each(function(k, v)
        {
            var temp = parseInt($(this).data('value') || 0);
            if(temp == payment_id)
            {
                $(this).addClass('selected');
                $form_pay.find('input[name=payment_id]').val(payment_id);
            } else {
                $(this).removeClass('selected');
            }
        });
    });
    // 支付操作表单
    $form_pay.find('button[type=submit]').on('click', function()
    {
        var id = parseInt($form_pay.find('input[name=id]').val() || 0);
        if(id == 0)
        {
            Prompt(window['lang_order_id_empty'] || '订单id有误');
            return false;
        }
        var payment_id = parseInt($form_pay.find('input[name=payment_id]').val() || 0);
        if(payment_id == 0)
        {
            Prompt(window['lang_payment_choice_tips'] || '请选择支付方式');
            return false;
        }
    });

    // 取货操作
    var $form_take = $('form.form-validation-take');
    $(document).on('click', '.submit-take', function()
    {
        $form_take.find('input[name=id]').val($(this).data('id') || 0);
        $form_take.find('input[name=user_id]').val($(this).data('user-id') || 0);
        $form_take.find('input[name=extraction_code]').val('');
        $form_take.find('input[name=verify_number]').val(1);
    });
    // 取货操作表单
    $form_take.find('button[type=submit]').on('click', function()
    {
        if(parseInt($form_take.find('input[name=id]').val() || 0) == 0)
        {
            Prompt(window['lang_order_id_empty'] || '订单id有误');
            return false;
        }
    });

    // 订单详情取货码商品切换
    function ExtractionTakeSwitchShow($box, index)
    {
        var $items = $box.find('.extraction-take-item');
        var total = $items.length;
        if(total <= 0)
        {
            return;
        }
        index = (index + total) % total;
        $items.hide().removeClass('am-active').eq(index).show().addClass('am-active');
        $box.attr('data-index', index);
    }
    $(document).on('click', '.extraction-take-switch .extraction-take-prev', function()
    {
        var $box = $(this).closest('.extraction-take-switch');
        ExtractionTakeSwitchShow($box, parseInt($box.attr('data-index') || 0) - 1);
    });
    $(document).on('click', '.extraction-take-switch .extraction-take-next', function()
    {
        var $box = $(this).closest('.extraction-take-switch');
        ExtractionTakeSwitchShow($box, parseInt($box.attr('data-index') || 0) + 1);
    });

});