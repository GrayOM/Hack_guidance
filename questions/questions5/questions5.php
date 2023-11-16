<?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = $_POST['input'];

        
        $pattern = '/^[\w.%+\-]+@[\w.\-]+\.[A-Za-z]{2,3}$/';

        echo "입력 값: " . $input;

        if (preg_match($pattern, $input)) {
            $flag = "DH{t#l1sS\$rZafSS^3%8@CxhXF29LXQLwGz}";
            echo "<script>alert('Flag 값: {$flag}');</script>";
        } else {
            echo "<script>alert('오답입니다. 다시 시도하세요.');</script>";
        }
    }
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Regular Expression</title>
    <style>
        body {
            height: 96vh;
            background-color: black;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }

        h1, p, label, button, a {
            text-align: center;
            color: white;
        }

        input {
            width: 57vh;
            margin-bottom: 10px;
            padding: 5px;
            color: black; /* 입력 텍스트 색상을 검은색으로 변경 */
            border: 1px solid white; /* 테두리 색상을 흰색으로 변경 */
        }

        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            text-decoration: none;
            font-size: 16px;
            cursor: pointer;
            display: block;
            margin: 0 auto;
        }

        a {
            color: #00FF00;
            text-decoration: none;
            margin-top: 10px;
            position: absolute;
            left: 0;
            top: 0;
        }
    </style>
</head>
<body>
    <br><br><br>
    <h1>Regular expression</h1>
    
    <p>'/^[\w.%+\-]+@[\w.\-]+\.[A-Za-z]{2,3}$/'</p><br>
    
    <form method="post" action="">
        <input type="text" name="input" id="input"><br><br>
        <button type="submit">확인</button><br><br>
        <a href="questions5_help.php" target="_blank">Help!</a>
    </form>

    <?php
    if (isset($message)) {
        echo "<script>alert('{$message}');</script>";
    }
    ?>
</body>
</html>
