<!DOCTYPE html>
<html lang="ko">
<head>
<style>
  body {
    height: 100vh;
    width: 100vw;
    background-image: url('./cookies.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  form {
    background: rgba(255, 255, 255, 0.8);
    padding-right: 50px;
    padding-top: 40px;
    padding-bottom: 40px;
    padding-left: 20px;
    border-radius: 10px;
    text-align: center;
  }

  label {
    display: block;
    margin-bottom: 10px;
  }

  input[type="text"], input[type="password"] {
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
  }

  button {
    background-color: #4CAF50;
    color: white;
    margin-left: 30px;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  h1 {
    text-align: center;
    color: white; /* 원하는 색상으로 설정하세요 */
  }

  a {
    margin-left: 30px;
    text-decoration: none;
    color: brown;
  }
</style>
</head>
<body>
  
<?php
$accessKey = "DH{flag}"; // 액세스 키를 여기에 입력하세요
$accessEntered = false;

if (isset($_POST['access_key'])) {
    $enteredKey = $_POST['access_key'];

    if ($enteredKey === $accessKey) {
        $accessEntered = true;
    }
}
?>

<?php
if ($accessEntered) {
    if (isset($_POST['login'])) {
        $user = $_POST['user'];
        $password = $_POST['password'];
        if ($user === 'guest' && $password === 'guest' || $user === 'admin' && $password === ')(@%#*)(#UT)JV@M(R*M#*@V(R#@U*(RV#*(@MRU#(*@MVM*#(@RM') {
            setcookie('user', $user, time() + 100);
        }
    }

    if (isset($_COOKIE['user'])) {
        if ($_COOKIE['user'] === 'admin') {
            echo "<script>alert('You are admin');</script>";
            echo "<h1>DH{xGl6oNREW@hvlA@W1BiQl%W0FObhVD4p}</h1>";
        } else {
            echo "<h1>You are Guest not admin</h1>";
        }
    }
} else {
    // 액세스 키를 입력하도록 하는 부분
    ?>

    <form method="post">
      <label for="access_key">액세스 키: </label>
      <input type="password" id="access_key" name="access_key" placeholder="액세스 키를 입력하세요"><br>
      <button type="submit" name="access_check">액세스 키 확인</button><br><br>
    </form>
<?php
}
?>
</body>
</html>
