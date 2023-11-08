<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>code read Login</title>
  <style>
        body {
      background-color: black;
      color: green;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }

    .loginForm {
      background-color: black;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0px 0px 10px 0px green;
      text-align: center;
      padding-right: 20px;

    }

    .idForm, .passForm {
      margin-bottom: 10px;
    }

    .id, .pw {
     
      padding: 10px;
      border: 1px solid green;
      border-radius: 5px;
      background-color: black;
      color: green;
    }

    .btn {
      width: 100%;
      padding: 10px;
      background-color: green;
      color: black;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top:20px;
    }

    .btn:hover {
      background-color: darkgreen;
    }

    .bottomText {
      text-align: center;
    }

    a {
      color: green;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .access_key {
        width: 300px; /* 원하는 너비로 설정하세요. */
        padding: 10px;
        border: 1px solid green;
        border-radius: 5px;
        background-color: black;
        color: green;
    }
  </style>
</head>
<body>
<?php
  $accessKey = "DH{mhn8vyc9RirWDQVsmux8pD%pf4xHdZcw}";
  $accessEntered = false;

  if (isset($_POST["access_key"])) {
    $enteredKey = $_POST["access_key"];

    if ($enteredKey === $accessKey) {
      $accessEntered = true;
    }
  }

  if ($accessEntered) {
  ?>

  <form method="post" action="" class="loginForm">
    <h2>Login</h2>
    <div class="idForm">
      <input type="text" name="id" class="id" placeholder="Username">
    </div>
    <div class="passForm">
      <input type="password" name="pw" class="pw" placeholder="Password">
    </div>
    <button type="submit" class="btn" name="login">
      LOGIN
    </button>
    <div class="bottomText">
      <?php if (!isset($_GET["downloaded"])) { ?>
        <a href="?download=true">2번문제 다운로드</a>
      <?php } else { ?>
        <span>다운로드 완료</span>
      <?php } ?>
    </div>
    <a href="questions2_help.php" target="_blank">HELP!!</a>
  </form>

  <?php
  } else {
  ?>

  <form method="post" action="" class="loginForm">
    <h2>Enter Access Key</h2>
    <div class="accessKeyForm">
      <input type="password" name="access_key" class="access_key" placeholder="DH{flag} 까지 전부 넣으시면됩니다.">
    </div>
    <button type="submit" class="btn" name="access_check">
      2번문제 접속
    </button>
  </form>

  <?php
  }

  if (isset($_GET["download"]) && $_GET["download"] === "true") {
    $file_content = file_get_contents("questions2.php");
    header("Content-disposition: attachment; filename=questions2.php");
    header("Content-type: application/php");
    echo $file_content;
    exit;
  }

  if (isset($_POST["login"])) {
      $username = $_POST["id"];
      $password = $_POST["pw"];
     
      $validUsername = "haaaaackckck";
      $validPassword = "errrrsssssss";

      if ($username == $validUsername && $password == $validPassword) {
          echo "<script>alert('DH{3325$(*#13*129824579@');</script>";
      } else {
          echo "<script>alert('떙.');</script>";
      }
  }
  ?>
  <script>
  </script>
</body>
</html>
