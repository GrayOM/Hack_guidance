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
    color:brown
  }
</style>
</head>
<body>
  
  
    <?php
    if (isset($_POST['login'])) {
        $user = $_POST['user'];
        $password = $_POST['password'];
        if ($user === 'guest' && $password === 'guest' || $user === 'admin' && $password === ')(@%#*)(#UT)JV@M(R*M#*@V(R#@U*(RV#*(@MRU#(*@MVM*#(@RM') {
            setcookie("user", $user, time() + 100);
        }
    }
    ?>

    <?php
    if (isset($_COOKIE['user'])) {
        if ($_COOKIE['user'] === 'admin') {
            echo "<script>alert('You are admin');</script>";
            echo "<h1>DH{정답입니다!}</h1>";
        } else {
            echo "<h1>You are Guest not admin</h1>";
        }
    } else {
    ?>

    <form method="post">
      <label for="user">사용자 이름: </label>
      <input type="text" id="user" name="user" value="guest">
      <label for="password">비밀번호: </label>
      <input type="text" id="password" name="password" value="guest"><br>
      <button type="submit" name="login">로그인</button><br><br>
      <a href="questions3_help.php" target="_blank">Help!</a>
    </form>
    <?php
    }
    ?>
</body>
</html>
