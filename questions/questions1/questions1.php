<!DOCTYPE html>
<html>
<head>
    <title>script_login_page</title>
    <style>
        /* CSS 스타일링 */
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center; /* 가로 중앙 정렬 */
            align-items: center; /* 세로 중앙 정렬 */
            height: 87vh; /* 화면 전체 높이만큼 설정 */
            margin: 0;
            flex-direction: column;
                }
        .login-container {
            width: 300px;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>로그인</h2>
        <form id="login-form">
            <label for="username">사용자 이름:</label>
            <input type="text" id="username" name="username" required><br><br>
            <label for="password">비밀번호:</label>
            <input type="password" id="password" name="password" required><br><br>
            <input type="submit" value="로그인">
        </form>
    </div>
        <a href="questions1_help.php" target="_blank">HELP!!</a>
    <script>
        document.getElementById("login-form").addEventListener("submit", function(event) {
            event.preventDefault(); 
            var username = document.getElementById("username").value;
            var password = document.getElementById("password").value;
            if (username === "hackguidence" && password === "2984075230948324") {
                alert("DH{mhn8vyc9RirWDQVsmux8pD%pf4xHdZcw}");
            } else {
                alert("로그인 실패. 사용자명과 비밀번호를 확인하세요.");
            }
        });
    </script>
</body>
</html>
