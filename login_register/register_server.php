<?php

include('db.php');

if(isset($_POST['user_id']) && isset($_POST['user_nick']) && isset($_POST['pass1']) && isset($_POST['pass2']))
{

    $user_id = mysqli_real_escape_string($db,$_POST['user_id']);
    $user_nick = mysqli_real_escape_string($db,$_POST['user_nick']);
    $pass1 = mysqli_real_escape_string($db,$_POST['pass1']);
    $pass2 = mysqli_real_escape_string($db,$_POST['pass2']);


    //error
    if(empty($user_id))
    {
        header("location: registerform.php?error=아이디가 비어있어요.");
        exit();
    }
    else if (empty($user_nick))
    {
        header("location: registerform.php?error=닉네임이 비어있어요.");
        exit();
    }
    else if(empty($pass1))
    {
        header("location: registerform.php?error=비밀번호가 비어있어요.");
        exit();
    }
    else if(empty($pass2))
    {
        header("location: registerform.php?error=확인 비밀번호가 비어있어요.");
        exit();
    }

    elseif($pass1 !== $pass2)
    {
        header("location: registerform.php?error=비밀번호가 일치하지 않아요.");
        exit();
    }

    else
    {
        // Your code for successful registration goes here
    }
}
?>
