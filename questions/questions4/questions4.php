<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $answer = $_POST['answer'];
    $correctAnswer = 'DH{PfehFjiRQWlc5uMNWxytFIa@NdFhv6U2dYez2fbkGWBUNo^prbi1DbP7Ur#UPpdd}';

    if ($answer === $correctAnswer) {
        $message = "정답입니다!";
    } else {
        $message = "오답입니다. 다시 시도하세요.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Base64</title>
    <style>
        body {
            height: 96vh;
            background-image: url('./q4_background.jpg');
            background-repeat: no-repeat;
            background-size: cover;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column; /* 세로 중앙 정렬을 위해 추가 */
        }

        h1, p, label, input, button {
            text-align: center;
        }

        input {
            width: 57vh;
        }

        /* 버튼 가운데 정렬을 위한 추가 스타일 */
        form {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        button {
            margin-top: 10px; /* 버튼과 입력란 간격 조절을 위한 마진 추가 */
        }
    </style>
</head>
<body>
    <br><br><br>
    <h1>64?</h1>
    
    <p>'REh7UGZlaEZqaVJRV2xjNXVNTld4eXRGSWFATmRGaHY2VTJkWWV6MmZia0dXQlVOb15wcmJpMURiUDdVciNVUHBkZH0='</p><br>
    
    <form method="post" action="">
        <input type="text" name="answer" id="answer"><br>
        <button type="submit">확인</button><br>
    </form>
    
    <a href="questions4_help.php" target="_blank">Help!</a>

    <?php
    if (isset($message)) {
        echo "<script>alert('{$message}');</script>";
    }
    ?>
</body>
</html>
