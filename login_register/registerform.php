<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원가입</title>
    <link rel="stylesheet" href="registerform.css">
</head>
<body>
    <form action="register_server.php" method="post">
        <h2>회원가입</h2>

        <?php if(isset($_GET['error'])) { ?>
        <p class="error"><?php echo $_GET['error']; ?></p>
        <?php };?>

        <label>ID</label>
        <input type="text" placeholder="아이디 입력" name="user_id">

        <label>닉네임</label>
        <input type="text" placeholder="닉네임 입력" name="user_nick">

        <label>비밀번호</label>
        <input type="password" placeholder="비밀번호 입력" name="pass1">

        <label>비밀번호 확인</label>
        <input type="password" placeholder="비밀번호 확인 입력" name="pass2">

        <button type="submit">회원가입</button>
        <a href="./loginform.php">이미 회원이신가요? (로그인 페이지)</a>
    </form>
    
</body>
</html>