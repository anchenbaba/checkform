<?php
/**
 * @Author: anchen
 * @Date:   2015-09-24 08:46:21
 * @Last Modified by:   anchen
 * @Last Modified time: 2015-09-28 12:24:03
 */
header('Content-Type:application/json; charset=utf-8');
$data['info'] = 'ok';
$data['status'] = 1;
exit(json_encode($data));