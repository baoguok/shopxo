<?php
// +----------------------------------------------------------------------
// | ShopXO 国内领先企业级B2C免费开源电商系统
// +----------------------------------------------------------------------
// | Copyright (c) 2011~2099 http://shopxo.net All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( https://opensource.org/licenses/mit-license.php )
// +----------------------------------------------------------------------
// | Author: Devil
// +----------------------------------------------------------------------
namespace payment;

use app\service\ResourcesService;
use app\service\PayLogService;

/**
 * 现金支付
 * @author   Devil
 * @blog    http://gong.gg/
 * @version 1.0.0
 * @date    2018-09-19
 * @desc    支持自定义支付信息；可通过钩子 plugins_payment_cashpayment_custom_pay_info 覆盖展示数据
 */
class CashPayment
{
    // 插件配置参数
    private $config;

    /**
     * 构造方法
     * @author   Devil
     * @blog    http://gong.gg/
     * @version 1.0.0
     * @date    2018-09-17
     * @desc    description
     * @param   [array]           $params [输入参数（支付配置参数）]
     */
    public function __construct($params = [])
    {
        $this->config = $params;
    }

    /**
     * 配置信息
     * @author   Devil
     * @blog    http://gong.gg/
     * @version 1.0.0
     * @date    2018-09-19
     * @desc    description
     */
    public function Config()
    {
        // 基础信息
        $base = [
            'name'          => '现金支付',
            'version'       => '2.2.0',
            'apply_version' => '不限',
            'desc'          => '现金方式支付货款、支持配置自定义支付信息；支持钩子扩展覆盖收款展示',
            'author'        => 'Devil',
            'author_url'    => 'http://shopxo.net/',
        ];

        // 配置信息
        $element = [
            [
                'element'       => 'select',
                'title'         => '自定义支付信息展示',
                'desc'          => '开启后支付时展示自定义收款信息',
                'message'       => '请选择是否开启自定义支付',
                'name'          => 'is_custom_pay',
                'is_multiple'   => 0,
                'element_data'  => [
                    ['value'=>0, 'name'=>'关闭'],
                    ['value'=>1, 'name'=>'开启'],
                ],
            ],
            [
                'element'       => 'textarea',
                'name'          => 'content',
                'placeholder'   => '自定义文本',
                'title'         => '自定义文本',
                'desc'          => '可换行、一行一条数据；若安装「支付凭证审核」插件并由其覆盖则此处可不填',
                'is_required'   => 0,
                'rows'          => 6,
                'message'       => '请填写自定义文本',
            ],
            [
                'element'       => 'input',
                'type'          => 'text',
                'default'       => '',
                'name'          => 'tips',
                'placeholder'   => '特别提示信息',
                'title'         => '特别提示信息',
                'is_required'   => 0,
                'message'       => '请填写特别提示信息',
            ],
            [
                'element'       => 'input',
                'type'          => 'text',
                'default'       => '',
                'name'          => 'images_url',
                'placeholder'   => '图片地址',
                'title'         => '图片地址',
                'desc'          => '可自定义图片展示',
                'is_required'   => 0,
                'message'       => '请填写图片自定义的地址',
            ],
        ];

        return [
            'base'      => $base,
            'element'   => $element,
        ];
    }

    /**
     * 获取自定义收款展示数据（含钩子覆盖）
     * @author  Devil
     * @blog    http://gong.gg/
     * @version 1.0.0
     * @date    2026-07-28
     * @desc    钩子 plugins_payment_cashpayment_custom_pay_info 可改写 content/tips/images_url/extra_html
     * @param   [array]          $params [支付参数]
     */
    private function GetCustomPayInfoData($params = [])
    {
        $data = [
            'content'               => empty($this->config['content']) ? '' : strval($this->config['content']),
            'tips'                  => empty($this->config['tips']) ? '' : strval($this->config['tips']),
            'images_url'            => empty($this->config['images_url']) ? '' : strval($this->config['images_url']),
            'extra_html'            => '',
            'voucher_upload_url'    => '',
        ];
        $hook_name = 'plugins_payment_cashpayment_custom_pay_info';
        MyEventTrigger($hook_name, [
            'hook_name'     => $hook_name,
            'is_backend'    => true,
            'params'        => $params,
            'config'        => $this->config,
            'data'          => &$data,
        ]);
        return $data;
    }

    /**
     * 支付入口
     * @author   Devil
     * @blog    http://gong.gg/
     * @version 1.0.0
     * @date    2018-09-19
     * @desc    description
     * @param   [array]           $params [输入参数]
     */
    public function Pay($params = [])
    {
        // 是否开启了自定义支付信息
        if(!empty($this->config) && isset($this->config['is_custom_pay']) && $this->config['is_custom_pay'] == 1)
        {
            $pay_info = $this->GetCustomPayInfoData($params);
            // 有收款文案/图，或钩子注入了凭证上传入口，均需展示
            $has_info = (!empty($pay_info['content']) || !empty($pay_info['tips']) || !empty($pay_info['images_url']) || !empty($pay_info['extra_html']) || !empty($pay_info['voucher_upload_url']));
            if($has_info)
            {
                if(APPLICATION == 'web')
                {
                    $h1_margin = '50px;';
                    $margin = '50px;';
                    $padding = '30px;';
                    $radius = '2px;';
                } else {
                    $h1_margin = '10px;';
                    $margin = '20px;';
                    $padding = '10px;';
                    $radius = '10px;';
                }
                $html = '<h1 style="text-align:center;margin-top:'.$h1_margin.'">按照以下信息进行打款</h1>
                        <div style="text-align: left;margin:0 auto;max-width:800px;height:auto;border: 1px solid #f4f4f4;padding: '.$padding.';background:#fff;margin-top:'.$margin.'border-radius:'.$radius.'">';

                $copy_title = MyLang('copy_title');

                // 文本信息
                if(!empty($pay_info['content']))
                {
                    $html .= '<ul style="margin:0;padding:0;background: #fafafa;border: 1px solid #f4f4f4;border-radius:'.$radius.'">';
                    $content = explode("\n", $pay_info['content']);
                    foreach($content as $k=>$v)
                    {
                        $temp_arr = explode('：', $v);
                        if(count($temp_arr) == 1)
                        {
                            $temp_arr = explode(':', $v);
                        }
                        $temp_style = ($k > 0) ? 'border-top: 1px solid #f2f2f2;' : '';
                        $html .= '<li style="'.$temp_style.'list-style-type:none;line-height:22px;font-size:14px;padding: 5px 10px;">
                                    <span>'.$v.'</span>';
                        if(count($temp_arr) > 1)
                        {
                            $temp_value = str_replace(["\n", "\r", "\t"], '', $temp_arr[1]);
                            if(APPLICATION == 'app')
                            {
                                $html .= '<a href="'.$temp_value.'" style="border: 1px solid #2196F3;padding:0 5px;border-radius:4px;text-decoration: none;margin-left: 5px;cursor: pointer;color: #2196F3;white-space: nowrap;">'.$copy_title.'</a>';
                            } else {
                                $html .= '<a href="javascript:copy_text_event(\''.$temp_value.'\');" style="border: 1px solid #2196F3;padding:0 5px;border-radius:4px;text-decoration: none;margin-left: 5px;cursor: pointer;color: #2196F3;white-space: nowrap;">'.$copy_title.'</a>';
                            }
                        }
                        $html .= '</li>';
                    }
                    $html .= '</ul>';
                }

                // 支付金额
                $html .= '<p style="margin-top: 15px;font-size: 14px;line-height: 24px;">打款金额：<strong style="color:#E22C08;">'.ResourcesService::CurrencyDataSymbol().$params['total_price'].'</strong></p>';

                // 备注
                $html .= '<p style="margin-top: 5px;font-size: 14px;line-height: 24px;">打款备注：<strong style="color:#2196f3;">'.$params['order_no'].'</strong>';
                if(APPLICATION == 'app')
                {
                    $html .= '<a href="'.$params['order_no'].'" style="border: 1px solid #2196F3;padding:0 5px;border-radius:4px;text-decoration: none;margin-left: 5px;cursor: pointer;color: #2196F3;white-space: nowrap;">'.$copy_title.'</a>';
                } else {
                    $html .= '<a href="javascript:copy_text_event(\''.$params['order_no'].'\');" style="border: 1px solid #2196F3;padding:0 5px;border-radius:4px;text-decoration: none;margin-left: 5px;cursor: pointer;color: #2196F3;white-space: nowrap;">'.$copy_title.'</a>';
                }
                $html .= '</p>';

                // 订单关闭提示（仅系统订单有自动关闭；钱包/会员等插件业务无此机制）
                if(!empty($params['business_type']) && $params['business_type'] == 'system-order')
                {
                    $limit = intval(MyC('common_order_close_limit_time', 30, true));
                    $base_time = time();
                    if(!empty($params['business_data'][0]['add_time']))
                    {
                        $base_time = intval($params['business_data'][0]['add_time']);
                    }
                    $order_close_time = $base_time + (($limit > 5 ? $limit - 5 : 0) * 60);
                    $html .= '<div style="margin-top: 15px;"><p style="color:#f89703;font-size: 14px;line-height: 24px;">订单预计[ <span style="color:#ff5722;">'.date('m月d号H点i分', $order_close_time).'</span> ]自动关闭、请尽快完成支付!</p></div>';
                }

                // 特别提示文字
                if(!empty($pay_info['tips']))
                {
                    $html .= '<p class="tips" style="margin-top: 15px;font-size: 14px;background: #fff2df;border: 1px solid #ffeacc;color: #f99600;padding: 5px 10px;line-height: 22px;border-radius:'.$radius.'">'.$pay_info['tips'].'</p>';
                }

                // 图片信息
                if(!empty($pay_info['images_url']))
                {
                    $html .= '<div style="margin-top: 15px;"><img src="'.$pay_info['images_url'].'" alt="支付信息" style="width: 100%;border-radius: 2px;" /></div>';
                }

                // 扩展入口（如上传支付凭证，web/app 均用 a 标签；app 地址为 uniapp 页面路径）
                if(!empty($pay_info['extra_html']))
                {
                    $html .= $pay_info['extra_html'];
                } elseif(!empty($pay_info['voucher_upload_url']))
                {
                    $html .= '<div style="text-align: center;padding: 10px 0;margin-top:20px;"><a href="'.htmlspecialchars($pay_info['voucher_upload_url']).'" style="text-decoration: none;background: #2196F3;padding: 8px 16px;border-radius: 4px;color: #fff;font-size: 14px;">上传支付凭证</a></div>';
                }

                // 导航入口（仅 web）
                if(APPLICATION == 'web')
                {
                    $home_url = __MY_URL__;
                    $order_url = MySession('payment_business_order_index_url');
                    if(empty($order_url))
                    {
                        $order_url = MyUrl('index/order/index');
                    }
                    $html .= '<div style="text-align: center;padding: 10px 0;margin-top:30px;"><a href="'.$home_url.'" style="text-decoration: none;background: #666;padding: 6px 12px;border-radius: 4px;color: #fff;background: #d2364c;font-size: 14px;">回到首页</a><a href="'.$order_url.'" style="text-decoration: none;background: #666;padding: 6px 12px;border-radius: 4px;color: #fff;background: #4caf50;margin-left:50px;font-size: 14px;">进入我的订单</a></div>';
                }

                // 闭合
                $html .= '</div>';

                // app则返回固定错误码和html代码
                if(APPLICATION == 'app')
                {
                    return DataReturn('success', -6666, $html);
                }

                // js代码
                $js = '<script>
                  function copy_text_event(text) {
                    try {
                        navigator.clipboard.writeText(text);
                        alert("复制成功");
                    } catch (err) {
                        alert("复制失败（"+err+"）");
                    }
                }
                </script>';

                // 表单html
                $parameter = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>支付信息</title></head><body style="color: #333;background: #f7f7f7;">'.$html.'</body>'.$js.'</html>';

                // 支付请求记录
                PayLogService::PayLogRequestRecord($params['order_no'], ['request_params'=>$parameter]);

                // web端直接输出html
                die($parameter);
            }
        }

        // 默认方式
        $parameter = $params['call_back_url'].'?';
        $parameter .= 'out_trade_no='.$params['order_no'];
        $parameter .= '&subject='.$params['name'];
        $parameter .= '&total_price='.$params['total_price'];

        // 支付请求记录
        PayLogService::PayLogRequestRecord($params['order_no'], ['request_params'=>$parameter]);

        return DataReturn('success', 0, $parameter);
    }

    /**
     * 支付回调处理
     * @author   Devil
     * @blog    http://gong.gg/
     * @version 1.0.0
     * @date    2018-09-19
     * @desc    description
     * @param   [array]           $params [输入参数]
     */
    public function Respond($params = [])
    {
        return DataReturn('success', 0, $params);
    }
}
?>