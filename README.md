# 🔐 Hack_Guidence 1인이 되어버린 캡스톤 디자인 (미완성)

**Hack_Guidence**는 웹 보안 문제를 통해 해킹 기법을 학습할 수 있는 캡스톤 디자인 프로젝트입니다. 보안 취약점을 탐색하고, 분석하며, 실제로 악용할 수 있는 실습 환경을 제공합니다.

## 📝 개요
이 프로젝트는 다음과 같은 목적을 가지고 있습니다.
- 웹 해킹 및 보안 취약점 학습
- 취약점 분석 및 문제 해결 능력 향상
- 실습을 통한 웹 보안 기술 향상

## 📂 프로젝트 구조
각 문제는 독립적인 PHP 파일과 JavaScript 코드로 구성되어 있으며, 특정 보안 취약점에 중점을 둡니다. 파일과 문제에 대한 자세한 설명은 아래와 같습니다.

---

### 문제 1️⃣ - 단순 인증 우회
**파일:** `index.php`  
**설명:** 로그인 시스템에서 특정 사용자명과 비밀번호를 입력하여 인증을 우회하는 문제입니다.  
**가이드:** `username`과 `password` 값을 통해 정확한 입력을 알아내야 합니다.  

```javascript
<script>
    document.getElementById("login-form").addEventListener("submit", function(event) {
        event.preventDefault(); 
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;
        if (username === "hackguidence" && password === "2984075230948324") {
            alert("HG_flag{정답입니다!}");
        } else {
            alert("로그인 실패. 사용자명과 비밀번호를 확인하세요.");
        }
    });
</script>
```

---

### 문제 2️⃣ - 파일 다운로드 및 인증 우회
**파일:** `questions2.php`  
**설명:** 특정 매개변수를 통해 파일을 다운로드할 수 있는 기능과, ID와 PW를 이용한 인증이 포함된 문제입니다. 사용자가 올바른 자격증명 정보를 입력하거나 파일 다운로드 기능을 활용하여 문제를 해결할 수 있습니다.  
**가이드:** `download` GET 매개변수를 이용해 파일을 다운로드하고, POST 요청에서 올바른 사용자명과 비밀번호로 플래그를 획득하세요.

```php
<?php
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
        echo "<script>alert('HG_flag{정답입니다!}');</script>";
    } else {
        echo "<script>alert('떙.');</script>";
    }
}
?>
```
---

### 문제 3️⃣ - 쿠키 기반 인증 우회
**파일:** `questions3.php`  
**설명:** 쿠키를 사용하여 사용자 역할을 지정하고, admin 역할일 때만 플래그를 표시합니다. 이 문제는 쿠키 값을 변경하여 인증을 우회하는 방법을 연습할 수 있습니다. 
**가이드:** `user` 쿠키 값을 admin으로 설정하여 DH{정답입니다!} 플래그를 획득하세요.

```php
<?php
if (isset($_POST['login'])) {
    $user = $_POST['user'];
    $password = $_POST['password'];
    if ($user === 'guest' && $password === 'guest' || $user === 'admin' && $password === ')(@%#*)(#UT)JV@M(R*M#*@V(R#@U*(RV#*(@MRU#(*@MVM*#(@RM') {
        setcookie("user", $user, time() + 100);
    }
}

if (isset($_COOKIE['user'])) {
    if ($_COOKIE['user'] === 'admin') {
        echo "<script>alert('You are admin');</script>";
        echo "<h1>DH{정답입니다!}</h1>";
    } else {
        echo "<h1>You are Guest not admin</h1>";
    }
}
?>

```
---
### 문제 4️⃣ - 메세지 출력 취약점
**파일:** `questions4.php`  
**설명:** 특정 변수 값을 통해 스크립트에서 알림 창을 출력하는 문제입니다. 사용자 입력을 받아 메시지를 표시하는 과정을 통해 입력 검증의 중요성을 학습할 수 있습니다.
**가이드:** `message` 변수를 설정하여 스크립트에서 알림 창을 출력하세요.

```php
<?php
if (isset($message)) {
    echo "<script>alert('{$message}');</script>";
}
```
---
### 문제 5️⃣ - 정규표현식을 이용한 입력 취약점
**파일:** `questions5.php`  
**설명:** 입력된 값이 이메일 형식에 맞는지 검증하는 문제입니다. 정규표현식을 사용하여 이메일 형식을 검증하고, 올바른 형식의 이메일을 입력하면 플래그를 출력합니다.
**가이드:** 유효한 이메일 형식에 맞춰 입력하면 플래그를 획득할 수 있습니다.

```php
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST['input'];
    $pattern = '/^[\w.%+\-]+@[\w.\-]+\.[A-Za-z]{2,3}$/';
    echo "입력 값: " . $input;
?>
```
### 📌 참고
문제 풀이에 어려움이 있을 경우, 각 문제에 포함된 가이드를 참고하여 해결 방법을 찾아보세요. 각 문제는 웹 해킹의 주요 개념을 이해하고 실제로 활용할 수 있도록 설계되었습니다. 
