<?php
/**
 * @Author: anchen
 * @Date:   2015-09-24 10:11:11
 * @Last Modified by:   anchen
 * @Last Modified time: 2015-09-24 15:28:49
 */

header('Content-Type:application/json; charset=utf-8');
$data['info'] = 'ddd';
$data['status'] = 1;
$data['data'] = $_REQUEST;
exit(json_encode($data));