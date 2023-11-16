<?php

$connect = mysqli_connect('1','root','운영자','rootuse');

if($connect)
{
    echo 'DB접속성공';
}

else
{
    echo 'db접속 성공';
}



?>